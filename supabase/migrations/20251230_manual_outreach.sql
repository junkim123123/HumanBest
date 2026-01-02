-- Manual outreach closed beta
-- Adds credits, verification_request flow, order events

-- Credits balance tracked in dedicated table (avoid modifying auth.users ownership)
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.user_credits_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_credits_touch ON public.user_credits;
CREATE TRIGGER trg_user_credits_touch
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.user_credits_touch();

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_own_user_credits') THEN
    CREATE POLICY user_read_own_user_credits ON public.user_credits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_insert_own_user_credits') THEN
    CREATE POLICY user_insert_own_user_credits ON public.user_credits
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_update_own_user_credits') THEN
    CREATE POLICY user_update_own_user_credits ON public.user_credits
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

-- Orders: allow verification_request and contact fields
DO $$
BEGIN
  -- relax quote_id for verification-only orders
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'quote_id') THEN
    BEGIN
      ALTER TABLE public.orders ALTER COLUMN quote_id DROP NOT NULL;
    EXCEPTION WHEN others THEN NULL; END;
  END IF;

  -- add type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'type') THEN
    ALTER TABLE public.orders ADD COLUMN type TEXT NOT NULL DEFAULT 'standard';
  END IF;

  -- add contact + snapshot fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'contact_email') THEN
    ALTER TABLE public.orders ADD COLUMN contact_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'contact_whatsapp') THEN
    ALTER TABLE public.orders ADD COLUMN contact_whatsapp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'report_snapshot_json') THEN
    ALTER TABLE public.orders ADD COLUMN report_snapshot_json JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'report_id') THEN
    ALTER TABLE public.orders ADD COLUMN report_id UUID;
  END IF;

  -- extend status check
  BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
  EXCEPTION WHEN others THEN NULL; END;
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_status_check CHECK (
      status IN (
        'draft','awaiting_contact','contacted','meeting_scheduled','closed',
        'awaiting_invoice','awaiting_payment','in_progress','pending_shipment','shipped','delivered','cancelled'
      )
    );

  -- extend type check
  BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_type_check;
  EXCEPTION WHEN others THEN NULL; END;
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_type_check CHECK (type IN ('standard','verification_request'));
END$$;

-- Order events audit
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created','contacted','meeting_scheduled','closed','credits_granted','note','contact_updated')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- Policies: users can read/insert their own order events; admin bypasses via service role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_own_order_events') THEN
    CREATE POLICY user_read_own_order_events ON public.order_events
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_insert_own_order_events') THEN
    CREATE POLICY user_insert_own_order_events ON public.order_events
      FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
  END IF;
END$$;

-- Partial uniqueness to prevent duplicate open verification requests
CREATE UNIQUE INDEX IF NOT EXISTS uniq_verification_request_per_report
  ON public.orders(user_id, report_id)
  WHERE type = 'verification_request' AND status IN ('awaiting_contact','contacted','meeting_scheduled');

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_contact_per_user
  ON public.orders(user_id, status)
  WHERE status = 'awaiting_contact';

-- Indexes for order_events
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_type ON public.order_events(event_type);

-- Helper function: increment credits atomically
CREATE OR REPLACE FUNCTION public.increment_user_credits(p_user_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET credits_balance = public.user_credits.credits_balance + p_amount, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
