-- Admin users registry
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_users_self_read') THEN
    CREATE POLICY admin_users_self_read ON public.admin_users
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

NOTIFY pgrst, 'reload schema';
