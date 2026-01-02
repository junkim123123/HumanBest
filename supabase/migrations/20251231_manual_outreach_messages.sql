-- Messaging + admin queue support for manual outreach verification

-- Order messages (two-way threads)
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user','admin','system')),
  sender_id UUID,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_own_order_messages') THEN
    CREATE POLICY user_read_own_order_messages ON public.order_messages
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_insert_own_order_messages') THEN
    CREATE POLICY user_insert_own_order_messages ON public.order_messages
      FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON public.order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON public.order_messages(created_at DESC);

-- Order events: allow message + meeting scheduled etc
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.order_events DROP CONSTRAINT IF EXISTS order_events_event_type_check;
  EXCEPTION WHEN others THEN NULL; END;
  ALTER TABLE public.order_events
    ADD CONSTRAINT order_events_event_type_check CHECK (
      event_type IN ('created','contacted','meeting_scheduled','closed','credits_granted','note','contact_updated','message_sent')
    );
END$$;
