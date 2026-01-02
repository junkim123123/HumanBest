-- Align order_uploads schema with app expectations
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS visible_to_user boolean DEFAULT true;
ALTER TABLE public.order_uploads ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS order_uploads_order_id_idx ON public.order_uploads(order_id);

NOTIFY pgrst, 'reload schema';
