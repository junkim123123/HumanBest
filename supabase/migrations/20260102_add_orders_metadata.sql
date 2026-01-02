-- Add metadata column to orders for optional fields without schema churn
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Refresh PostgREST cache so the column is immediately visible
NOTIFY pgrst, 'reload schema';
