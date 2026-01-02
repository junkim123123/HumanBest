-- Ensure order_messages has sender_role, sender, visible_to_user
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS sender_role text;
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS sender text;
ALTER TABLE public.order_messages ADD COLUMN IF NOT EXISTS visible_to_user boolean DEFAULT true;

-- Ensure order_uploads can track visibility
ALTER TABLE public.order_uploads ADD COLUMN IF NOT EXISTS visible_to_user boolean DEFAULT true;

-- Drop legacy triggers that may reference old sender columns
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_table = 'order_messages'
      AND trigger_schema = 'public'
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.order_messages', r.trigger_name);
  END LOOP;
END$$;

-- Helper to list triggers on order_messages (run manually if needed)
-- SELECT trigger_name, event_manipulation, action_timing, action_statement
-- FROM information_schema.triggers
-- WHERE event_object_table = 'order_messages'
--   AND trigger_schema = 'public';
