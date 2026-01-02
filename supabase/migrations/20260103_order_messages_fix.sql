-- Align order_messages schema with app expectations

-- 1) Create table if missing
CREATE TABLE IF NOT EXISTS public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  sender_id uuid NULL,
  sender_role text NOT NULL DEFAULT 'user',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Remove legacy sender column if it exists
ALTER TABLE public.order_messages DROP COLUMN IF EXISTS sender;

-- 3) Ensure required columns and constraints
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS sender_role text;
UPDATE public.order_messages SET sender_role = 'user' WHERE sender_role IS NULL;
ALTER TABLE public.order_messages ALTER COLUMN sender_role SET DEFAULT 'user';
ALTER TABLE public.order_messages ALTER COLUMN sender_role SET NOT NULL;

ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS body text;
UPDATE public.order_messages SET body = '' WHERE body IS NULL;
ALTER TABLE public.order_messages ALTER COLUMN body SET NOT NULL;

ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS sender_id uuid;
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS created_at timestamptz;
UPDATE public.order_messages SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.order_messages ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.order_messages ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.order_messages ALTER COLUMN order_id SET NOT NULL;
ALTER TABLE public.order_messages ADD CONSTRAINT order_messages_order_fk FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE CASCADE;

-- Ensure primary key exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'order_messages_pkey'
      AND conrelid = 'public.order_messages'::regclass
  ) THEN
    ALTER TABLE public.order_messages ADD PRIMARY KEY (id);
  END IF;
END$$;

-- 4) Indexes for performance
CREATE INDEX IF NOT EXISTS order_messages_order_id_idx ON public.order_messages (order_id);
CREATE INDEX IF NOT EXISTS order_messages_created_at_idx ON public.order_messages (created_at);

-- 5) Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
