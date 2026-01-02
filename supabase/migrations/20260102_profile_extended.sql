-- Extend profiles table with company info and notification settings

-- Profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Company/Shipping info
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shipping_address_line1 text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shipping_address_line2 text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shipping_city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shipping_state text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shipping_postal_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shipping_country text DEFAULT 'United States';

-- Notification preferences (all default to true)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_quotes_ready boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_order_updates boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_monthly_credits boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_marketing boolean DEFAULT false;

NOTIFY pgrst, 'reload schema';
