-- Admin workspace alignment
-- Adds visibility flag for messages and uploader/file columns for uploads

-- order_messages: visibility control
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS visible_to_user boolean;
ALTER TABLE public.order_messages ALTER COLUMN visible_to_user SET DEFAULT true;
UPDATE public.order_messages SET visible_to_user = true WHERE visible_to_user IS NULL;
ALTER TABLE public.order_messages ALTER COLUMN visible_to_user SET NOT NULL;
CREATE INDEX IF NOT EXISTS order_messages_visible_idx ON public.order_messages(order_id, visible_to_user);

-- order_uploads: richer metadata
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS uploader_role text;
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE public.order_uploads ALTER COLUMN uploader_role SET DEFAULT 'user';
ALTER TABLE public.order_uploads ALTER COLUMN file_type SET DEFAULT 'other';
UPDATE public.order_uploads SET uploader_role = COALESCE(uploader_role, created_by_role, 'user');
UPDATE public.order_uploads SET file_type = COALESCE(file_type, kind, 'other');
UPDATE public.order_uploads SET file_url = COALESCE(file_url, storage_path) WHERE file_url IS NULL;
ALTER TABLE public.order_uploads ALTER COLUMN uploader_role SET NOT NULL;
ALTER TABLE public.order_uploads ALTER COLUMN file_type SET NOT NULL;
CREATE INDEX IF NOT EXISTS order_uploads_order_id_idx ON public.order_uploads(order_id);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
