-- Create sourcing copilot data model for paid quote collection workflow

-- Sourcing jobs table (one job per report/user request)
CREATE TABLE IF NOT EXISTS public.sourcing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'outreach_sent', 'replies_received', 'quotes_confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sourcing_jobs_report_id
ON public.sourcing_jobs (report_id);

CREATE INDEX IF NOT EXISTS idx_sourcing_jobs_user_id
ON public.sourcing_jobs (user_id);

CREATE INDEX IF NOT EXISTS idx_sourcing_jobs_status
ON public.sourcing_jobs (status);

-- Sourcing job suppliers (which suppliers are part of this job)
CREATE TABLE IF NOT EXISTS public.sourcing_job_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sourcing_job_id UUID NOT NULL REFERENCES public.sourcing_jobs(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'outreach_sent', 'reply_received', 'parsed', 'needs_followup', 'confirmed_in_writing')),
  outreach_pack JSONB, -- Stores generated outreach pack (outreach_message, questions_checklist, spec_summary, red_flags)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sourcing_job_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_sourcing_job_suppliers_job_id
ON public.sourcing_job_suppliers (sourcing_job_id);

CREATE INDEX IF NOT EXISTS idx_sourcing_job_suppliers_supplier_id
ON public.sourcing_job_suppliers (supplier_id);

CREATE INDEX IF NOT EXISTS idx_sourcing_job_suppliers_status
ON public.sourcing_job_suppliers (status);

-- Supplier conversations (thread per supplier)
CREATE TABLE IF NOT EXISTS public.supplier_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sourcing_job_supplier_id UUID NOT NULL REFERENCES public.sourcing_job_suppliers(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL,
  supplier_email TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_conversations_job_supplier_id
ON public.supplier_conversations (sourcing_job_supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_conversations_supplier_id
ON public.supplier_conversations (supplier_id);

-- Supplier messages (individual emails in a conversation)
CREATE TABLE IF NOT EXISTS public.supplier_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.supplier_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  subject TEXT,
  body_text TEXT NOT NULL,
  body_html TEXT,
  from_email TEXT,
  to_email TEXT,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  parsed_data JSONB, -- Parsed reply data (price_per_unit, currency, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_messages_conversation_id
ON public.supplier_messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_supplier_messages_direction
ON public.supplier_messages (direction);

CREATE INDEX IF NOT EXISTS idx_supplier_messages_sent_at
ON public.supplier_messages (sent_at);

-- Supplier quotes (structured quote data parsed from replies)
CREATE TABLE IF NOT EXISTS public.supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sourcing_job_supplier_id UUID NOT NULL REFERENCES public.sourcing_job_suppliers(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.supplier_messages(id) ON DELETE SET NULL,
  supplier_id TEXT NOT NULL,
  price_per_unit DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  incoterm TEXT, -- e.g., 'FOB', 'CIF', 'EXW'
  moq INTEGER,
  lead_time_days INTEGER,
  payment_terms TEXT,
  packaging_notes TEXT,
  missing_fields TEXT[], -- Fields that were not provided
  followup_message TEXT, -- Suggested followup message
  confirmed_in_writing BOOLEAN NOT NULL DEFAULT false, -- Must be true to show as confirmed
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'needs_review')),
  validation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_quotes_job_supplier_id
ON public.supplier_quotes (sourcing_job_supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_quotes_supplier_id
ON public.supplier_quotes (supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_quotes_confirmed
ON public.supplier_quotes (confirmed_in_writing) WHERE confirmed_in_writing = true;

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_sourcing_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sourcing_jobs_updated_at ON public.sourcing_jobs;
CREATE TRIGGER update_sourcing_jobs_updated_at
BEFORE UPDATE ON public.sourcing_jobs
FOR EACH ROW
EXECUTE FUNCTION update_sourcing_tables_updated_at();

DROP TRIGGER IF EXISTS update_sourcing_job_suppliers_updated_at ON public.sourcing_job_suppliers;
CREATE TRIGGER update_sourcing_job_suppliers_updated_at
BEFORE UPDATE ON public.sourcing_job_suppliers
FOR EACH ROW
EXECUTE FUNCTION update_sourcing_tables_updated_at();

DROP TRIGGER IF EXISTS update_supplier_conversations_updated_at ON public.supplier_conversations;
CREATE TRIGGER update_supplier_conversations_updated_at
BEFORE UPDATE ON public.supplier_conversations
FOR EACH ROW
EXECUTE FUNCTION update_sourcing_tables_updated_at();

DROP TRIGGER IF EXISTS update_supplier_quotes_updated_at ON public.supplier_quotes;
CREATE TRIGGER update_supplier_quotes_updated_at
BEFORE UPDATE ON public.supplier_quotes
FOR EACH ROW
EXECUTE FUNCTION update_sourcing_tables_updated_at();

-- RLS policies
ALTER TABLE public.sourcing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_job_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quotes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own jobs
CREATE POLICY "Users can read own sourcing jobs" ON public.sourcing_jobs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can read own job suppliers" ON public.sourcing_job_suppliers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sourcing_jobs
    WHERE sourcing_jobs.id = sourcing_job_suppliers.sourcing_job_id
    AND sourcing_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own conversations" ON public.supplier_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sourcing_job_suppliers
    JOIN public.sourcing_jobs ON sourcing_jobs.id = sourcing_job_suppliers.sourcing_job_id
    WHERE sourcing_job_suppliers.id = supplier_conversations.sourcing_job_supplier_id
    AND sourcing_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own messages" ON public.supplier_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_conversations
    JOIN public.sourcing_job_suppliers ON sourcing_job_suppliers.id = supplier_conversations.sourcing_job_supplier_id
    JOIN public.sourcing_jobs ON sourcing_jobs.id = sourcing_job_suppliers.sourcing_job_id
    WHERE supplier_conversations.id = supplier_messages.conversation_id
    AND sourcing_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own quotes" ON public.supplier_quotes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sourcing_job_suppliers
    JOIN public.sourcing_jobs ON sourcing_jobs.id = sourcing_job_suppliers.sourcing_job_id
    WHERE sourcing_job_suppliers.id = supplier_quotes.sourcing_job_supplier_id
    AND sourcing_jobs.user_id = auth.uid()
  )
);

COMMENT ON TABLE public.sourcing_jobs IS 'Sourcing jobs created when user requests paid outreach service';
COMMENT ON TABLE public.sourcing_job_suppliers IS 'Suppliers included in a sourcing job with status tracking';
COMMENT ON TABLE public.supplier_conversations IS 'Email conversation threads with suppliers';
COMMENT ON TABLE public.supplier_messages IS 'Individual email messages in conversations';
COMMENT ON TABLE public.supplier_quotes IS 'Structured quote data parsed from supplier replies. Only quotes with confirmed_in_writing=true are shown as confirmed.';

