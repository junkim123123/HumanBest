-- Partner workflow schema for verification concierge
-- Idempotent, additive, safe

-- order_partner_assignments
CREATE TABLE IF NOT EXISTS public.order_partner_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  region text NOT NULL,
  partner_name text NULL,
  assigned_by uuid NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'assigned'
);
ALTER TABLE public.order_partner_assignments ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.order_partner_assignments ADD COLUMN IF NOT EXISTS partner_name text;
ALTER TABLE public.order_partner_assignments ADD COLUMN IF NOT EXISTS assigned_by uuid;
ALTER TABLE public.order_partner_assignments ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TABLE public.order_partner_assignments ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.order_partner_assignments ALTER COLUMN assigned_at SET DEFAULT now();
ALTER TABLE public.order_partner_assignments ALTER COLUMN status SET DEFAULT 'assigned';
ALTER TABLE public.order_partner_assignments ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.order_partner_assignments ALTER COLUMN order_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS order_partner_assignments_order_id_idx ON public.order_partner_assignments(order_id);

-- order_rfqs
CREATE TABLE IF NOT EXISTS public.order_rfqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  region text NOT NULL,
  spec_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz NULL,
  status text NOT NULL DEFAULT 'draft'
);
ALTER TABLE public.order_rfqs ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.order_rfqs ADD COLUMN IF NOT EXISTS spec_snapshot jsonb;
ALTER TABLE public.order_rfqs ALTER COLUMN spec_snapshot SET DEFAULT '{}'::jsonb;
ALTER TABLE public.order_rfqs ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.order_rfqs ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.order_rfqs ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.order_rfqs ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.order_rfqs ALTER COLUMN order_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS order_rfqs_order_id_idx ON public.order_rfqs(order_id);

-- order_quotes
CREATE TABLE IF NOT EXISTS public.order_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rfq_id uuid NULL REFERENCES public.order_rfqs(id) ON DELETE SET NULL,
  supplier_name text NOT NULL,
  supplier_country text NULL,
  fob_unit_price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  moq integer NULL,
  lead_time_days integer NULL,
  packaging jsonb NULL,
  notes text NULL,
  evidence_urls text[] NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  position integer NULL,
  status text NOT NULL DEFAULT 'received'
);
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS supplier_country text;
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE public.order_quotes ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS fob_unit_price numeric;
ALTER TABLE public.order_quotes ALTER COLUMN fob_unit_price SET NOT NULL;
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS moq integer;
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS lead_time_days integer;
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS packaging jsonb;
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS evidence_urls text[];
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS received_at timestamptz;
ALTER TABLE public.order_quotes ALTER COLUMN received_at SET DEFAULT now();
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS position integer;
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.order_quotes ALTER COLUMN status SET DEFAULT 'received';
ALTER TABLE public.order_quotes ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.order_quotes ADD COLUMN IF NOT EXISTS rfq_id uuid;
ALTER TABLE public.order_quotes ALTER COLUMN order_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS order_quotes_order_id_idx ON public.order_quotes(order_id);
CREATE INDEX IF NOT EXISTS order_quotes_rfq_id_idx ON public.order_quotes(rfq_id);

-- order_cost_models
CREATE TABLE IF NOT EXISTS public.order_cost_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_cost_models ADD COLUMN IF NOT EXISTS inputs jsonb;
ALTER TABLE public.order_cost_models ALTER COLUMN inputs SET DEFAULT '{}'::jsonb;
ALTER TABLE public.order_cost_models ADD COLUMN IF NOT EXISTS outputs jsonb;
ALTER TABLE public.order_cost_models ALTER COLUMN outputs SET DEFAULT '{}'::jsonb;
ALTER TABLE public.order_cost_models ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE public.order_cost_models ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.order_cost_models ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.order_cost_models ALTER COLUMN order_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS order_cost_models_order_id_key ON public.order_cost_models(order_id);

-- order_uploads
CREATE TABLE IF NOT EXISTS public.order_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  kind text NOT NULL,
  storage_path text NOT NULL,
  created_by_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  note text NULL
);
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS kind text;
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS created_by_role text;
ALTER TABLE public.order_uploads ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.order_uploads ALTER COLUMN order_id SET NOT NULL;
ALTER TABLE public.order_uploads ALTER COLUMN kind SET NOT NULL;
ALTER TABLE public.order_uploads ALTER COLUMN storage_path SET NOT NULL;
ALTER TABLE public.order_uploads ALTER COLUMN created_by_role SET NOT NULL;
CREATE INDEX IF NOT EXISTS order_uploads_order_id_idx ON public.order_uploads(order_id);

-- order_messages alignment (no legacy sender)
ALTER TABLE public.order_messages DROP COLUMN IF EXISTS sender;
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS sender_role text;
ALTER TABLE public.order_messages ALTER COLUMN sender_role SET DEFAULT 'user';
ALTER TABLE public.order_messages ALTER COLUMN sender_role SET NOT NULL;
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS sender_id uuid;
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.order_messages ALTER COLUMN body SET NOT NULL;
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.order_messages ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.order_messages ALTER COLUMN created_at SET NOT NULL;

-- RLS enable
ALTER TABLE public.order_partner_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_cost_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_uploads ENABLE ROW LEVEL SECURITY;

-- Policies: users read own via orders.user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_order_partner_assignments') THEN
    CREATE POLICY user_read_order_partner_assignments ON public.order_partner_assignments
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_order_rfqs') THEN
    CREATE POLICY user_read_order_rfqs ON public.order_rfqs
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_order_quotes') THEN
    CREATE POLICY user_read_order_quotes ON public.order_quotes
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_order_cost_models') THEN
    CREATE POLICY user_read_order_cost_models ON public.order_cost_models
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_order_uploads') THEN
    CREATE POLICY user_read_order_uploads ON public.order_uploads
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
  END IF;
END$$;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
