-- filepath: supabase/schema.sql
-- ============================================================================
-- NexSupply - Consolidated Database Schema
-- ============================================================================
-- Single source of truth for all tables, functions, triggers, and policies
-- Last updated: 2025-12-29
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- PART 1: Authentication & User Management
-- ============================================================================

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- PART 2: Intelligence Pipeline - Product Analysis
-- ============================================================================

-- Product analyses (Gemini AI results)
CREATE TABLE IF NOT EXISTS public.product_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid,
  image_url text NOT NULL,
  image_hash text,
  product_name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  hs_code text,
  attributes jsonb NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  confidence decimal(3,2) NOT NULL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, image_url)
);

CREATE INDEX IF NOT EXISTS idx_product_analyses_product_id ON public.product_analyses(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analyses_image_url ON public.product_analyses(image_url);
CREATE INDEX IF NOT EXISTS idx_product_analyses_image_hash ON public.product_analyses(image_hash);
CREATE INDEX IF NOT EXISTS idx_product_analyses_hs_code ON public.product_analyses(hs_code);
CREATE INDEX IF NOT EXISTS idx_product_analyses_category ON public.product_analyses(category);
CREATE INDEX IF NOT EXISTS idx_product_analyses_keywords ON public.product_analyses USING gin(keywords);

-- Supplier products
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id text NOT NULL,
  supplier_name text NOT NULL,
  product_name text NOT NULL,
  product_description text,
  unit_price decimal(10,2) NOT NULL,
  moq integer NOT NULL DEFAULT 1 CHECK (moq > 0),
  lead_time integer NOT NULL DEFAULT 0 CHECK (lead_time >= 0),
  category text,
  hs_code text,
  currency text NOT NULL DEFAULT 'USD',
  import_key_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON public.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_product_name ON public.supplier_products USING gin(to_tsvector('english', product_name));
CREATE INDEX IF NOT EXISTS idx_supplier_products_category ON public.supplier_products(category);
CREATE INDEX IF NOT EXISTS idx_supplier_products_hs_code ON public.supplier_products(hs_code);
CREATE INDEX IF NOT EXISTS idx_supplier_products_import_key_id ON public.supplier_products(import_key_id);

-- Product-supplier matches
CREATE TABLE IF NOT EXISTS public.product_supplier_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  analysis_id uuid REFERENCES public.product_analyses(id) ON DELETE CASCADE,
  supplier_id text NOT NULL,
  supplier_name text NOT NULL,
  product_name text NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  moq integer NOT NULL DEFAULT 1,
  lead_time integer NOT NULL DEFAULT 0,
  match_score integer NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reason text,
  import_key_id text,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_product_id ON public.product_supplier_matches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_analysis_id ON public.product_supplier_matches(analysis_id);
CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_match_score ON public.product_supplier_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_supplier_id ON public.product_supplier_matches(supplier_id);

-- ============================================================================
-- PART 3: User Journey - Reports, Verifications, Orders
-- ============================================================================

-- Reports (user-owned, shareable analysis results)
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_key text UNIQUE,
  product_name text NOT NULL,
  category text,
  confidence text CHECK (confidence IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  image_url text,
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  baseline jsonb NOT NULL DEFAULT '{}'::jsonb,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  pipeline_result jsonb,
  schema_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_input_key ON public.reports(input_key);

-- Verifications (sample requests, inspections, audits)
CREATE TABLE IF NOT EXISTS public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  verification_type text NOT NULL CHECK (verification_type IN ('sample', 'inspection', 'audit')),
  notes text,
  result jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_verifications_report_id ON public.verifications(report_id);
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON public.verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.verifications(status);

-- Orders (production, shipping, delivery tracking)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
  supplier_name text,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2),
  total_amount numeric(10,2),
  tracking_number text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_report_id ON public.orders(report_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Messages (inbox for user-admin communication)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  read boolean DEFAULT false,
  message_type text NOT NULL DEFAULT 'system' CHECK (message_type IN ('system', 'support', 'notification', 'order_update')),
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Files (attachments for reports, orders, verifications)
CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  related_type text CHECK (related_type IN ('report', 'order', 'verification', 'message')),
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_related_type_id ON public.files(related_type, related_id);

-- Leads (sourcing candidates from intelligence pipeline)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  supplier_name text NOT NULL,
  supplier_type text,
  contact_email text,
  contact_phone text,
  confidence_score numeric(3,2),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'rejected')),
  notes text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leads_report_id ON public.leads(report_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- ============================================================================
-- PART 4: Functions and Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER product_analyses_updated_at BEFORE UPDATE ON public.product_analyses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER supplier_products_updated_at BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER product_supplier_matches_updated_at BEFORE UPDATE ON public.product_supplier_matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER verifications_updated_at BEFORE UPDATE ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 5: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_supplier_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view/update own profile, admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Product analyses: Authenticated users can read/write (for intelligence pipeline)
CREATE POLICY "Authenticated can read product_analyses" ON public.product_analyses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can write product_analyses" ON public.product_analyses
  FOR ALL USING (auth.role() = 'authenticated');

-- Supplier products: Authenticated users can read/write
CREATE POLICY "Authenticated can read supplier_products" ON public.supplier_products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can write supplier_products" ON public.supplier_products
  FOR ALL USING (auth.role() = 'authenticated');

-- Product-supplier matches: Authenticated users can read/write
CREATE POLICY "Authenticated can read matches" ON public.product_supplier_matches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can write matches" ON public.product_supplier_matches
  FOR ALL USING (auth.role() = 'authenticated');

-- Reports: Public can read (shareable), users own their reports, admins see all
CREATE POLICY "Anyone can read reports" ON public.reports
  FOR SELECT USING (true);

CREATE POLICY "Users can create own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own reports" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reports" ON public.reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Verifications: Users see own, admins see all
CREATE POLICY "Users can view own verifications" ON public.verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all verifications" ON public.verifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Orders: Users see own, admins see all
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Messages: Users see own messages, admins see all
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messages" ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Files: Users see own files, admins see all
CREATE POLICY "Users can view own files" ON public.files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files" ON public.files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all files" ON public.files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Leads: Users can see leads from their reports, admins see all
CREATE POLICY "Users can view leads from own reports" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = leads.report_id AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all leads" ON public.leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- PART 6: Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users with role-based access control';
COMMENT ON TABLE public.product_analyses IS 'Gemini AI analysis results for product images';
COMMENT ON TABLE public.supplier_products IS 'Supplier/factory products for matching';
COMMENT ON TABLE public.product_supplier_matches IS 'Scored matches between products and suppliers';
COMMENT ON TABLE public.reports IS 'User-owned analysis reports with complete pipeline results';
COMMENT ON TABLE public.verifications IS 'Sample requests, inspections, and audits';
COMMENT ON TABLE public.orders IS 'Production orders with tracking from quote to delivery';
COMMENT ON TABLE public.messages IS 'User-admin communication inbox';
COMMENT ON TABLE public.files IS 'File attachments for reports, orders, verifications';
COMMENT ON TABLE public.leads IS 'Sourcing candidates generated from intelligence pipeline';