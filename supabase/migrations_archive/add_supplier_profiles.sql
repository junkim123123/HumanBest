-- Create supplier_profiles table to store enriched supplier profile data
-- Keyed by normalized_name for matching by name variations

CREATE TABLE IF NOT EXISTS public.supplier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_name TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL, -- Original/display name
  website TEXT,
  address TEXT,
  country TEXT,
  certifications TEXT[] DEFAULT '{}'::text[],
  source_urls TEXT[] DEFAULT '{}'::text[],
  last_checked_at TIMESTAMPTZ,
  confidence_label TEXT, -- e.g., "verified", "inferred", "unverified"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on normalized_name for UPSERT
CREATE UNIQUE INDEX IF NOT EXISTS supplier_profiles_normalized_name_uidx
ON public.supplier_profiles (normalized_name);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_normalized_name
ON public.supplier_profiles (normalized_name);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_supplier_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_supplier_profiles_updated_at ON public.supplier_profiles;
CREATE TRIGGER update_supplier_profiles_updated_at
BEFORE UPDATE ON public.supplier_profiles
FOR EACH ROW
EXECUTE FUNCTION update_supplier_profiles_updated_at();

-- RLS policies (if needed)
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read profile data
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.supplier_profiles;
CREATE POLICY "Allow authenticated read access" ON public.supplier_profiles
FOR SELECT
USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.supplier_profiles IS 'Stores enriched supplier profile data (website, address, country, certifications) keyed by normalized name for matching variations';
COMMENT ON COLUMN public.supplier_profiles.normalized_name IS 'Normalized supplier name (lowercase, stripped punctuation, common suffixes removed) used as unique key';
COMMENT ON COLUMN public.supplier_profiles.confidence_label IS 'Confidence level: verified (confirmed), inferred (estimated), unverified (no validation)';

