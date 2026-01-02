-- Leads table for verification request routing
-- Idempotent and additive to avoid destructive changes

-- 1) Create table if missing
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  product_name text,
  source text NOT NULL DEFAULT 'verification_request',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Ensure required columns and defaults
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE public.leads SET source = 'verification_request' WHERE source IS NULL;
UPDATE public.leads SET status = 'new' WHERE status IS NULL;
UPDATE public.leads SET created_at = now() WHERE created_at IS NULL;

ALTER TABLE public.leads ALTER COLUMN source SET DEFAULT 'verification_request';
ALTER TABLE public.leads ALTER COLUMN source SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new';
ALTER TABLE public.leads ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.leads ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN order_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN user_id SET NOT NULL;

-- 3) Relationships and uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public' AND table_name = 'leads' AND constraint_name = 'leads_order_fk'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_order_fk FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public' AND table_name = 'leads' AND constraint_name = 'leads_user_fk'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_user_fk FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public' AND table_name = 'leads' AND constraint_name = 'leads_order_unique'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_order_unique UNIQUE (order_id);
  END IF;
END$$;

-- 4) Indexes
CREATE INDEX IF NOT EXISTS leads_order_id_idx ON public.leads (order_id);
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads (user_id);

-- 5) Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
