-- Adjust verification_request uniqueness to scope by user + report while active

-- Drop previous uniqueness (name may be index or constraint depending on environment)
DROP INDEX IF EXISTS public.uniq_active_contact_per_user;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS uniq_active_contact_per_user;

-- Drop any prior verification constraint/index to avoid conflicts when re-running
DROP INDEX IF EXISTS public.uniq_active_verification_per_user;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS uniq_active_verification_per_user;

-- Enforce uniqueness per user/report for active verification requests
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_verification_per_user_report
ON public.orders (user_id, report_id)
WHERE type = 'verification_request'
  AND status IN (
    'awaiting_contact',
    'contacted',
    'meeting_scheduled',
    'awaiting_invoice',
    'awaiting_payment',
    'in_progress',
    'pending_shipment',
    'shipped'
  );

-- Ensure PostgREST picks up the schema change
NOTIFY pgrst, 'reload schema';
