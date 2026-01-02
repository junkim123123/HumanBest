-- Add missing unique constraint for supplier_matches_cache upsert
-- This fixes the upsert error by providing the exact onConflict target

-- First, check if product_supplier_matches table exists and add unique constraint
DO $$
BEGIN
  -- Add unique index for analysis_id, supplier_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'product_supplier_matches' 
    AND indexname = 'product_supplier_matches_analysis_supplier_uidx'
  ) THEN
    CREATE UNIQUE INDEX product_supplier_matches_analysis_supplier_uidx
    ON public.product_supplier_matches (analysis_id, supplier_id)
    WHERE analysis_id IS NOT NULL AND supplier_id IS NOT NULL;
  END IF;
END $$;

-- Create suppliers table for entity resolution
CREATE TABLE IF NOT EXISTS public.suppliers (
  supplier_id TEXT PRIMARY KEY, -- Stable identifier (UUID or hash)
  normalized_name TEXT NOT NULL, -- Normalized company name for matching
  display_name TEXT NOT NULL, -- Original/display name
  role TEXT CHECK (role IN ('factory', 'trading', 'logistics', 'unknown')),
  role_reason TEXT, -- One-line explanation of role inference
  website_domain TEXT, -- Extracted domain for matching
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS suppliers_normalized_name_uidx
ON public.suppliers (normalized_name);

CREATE INDEX IF NOT EXISTS idx_suppliers_role
ON public.suppliers (role);

CREATE INDEX IF NOT EXISTS idx_suppliers_website_domain
ON public.suppliers (website_domain) WHERE website_domain IS NOT NULL;

-- Create supplier_aliases table to store all name variations
CREATE TABLE IF NOT EXISTS public.supplier_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id TEXT NOT NULL REFERENCES public.suppliers(supplier_id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL, -- Raw name from source
  normalized_alias TEXT NOT NULL, -- Normalized version
  source_type TEXT, -- e.g., 'import_record', 'product_match', 'manual'
  source_id TEXT, -- Reference to source record
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_aliases_supplier_id
ON public.supplier_aliases (supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_aliases_normalized
ON public.supplier_aliases (normalized_alias);

CREATE UNIQUE INDEX IF NOT EXISTS supplier_aliases_supplier_alias_uidx
ON public.supplier_aliases (supplier_id, normalized_alias);

-- Create supplier_links table to link source records to suppliers
CREATE TABLE IF NOT EXISTS public.supplier_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id TEXT NOT NULL REFERENCES public.suppliers(supplier_id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- e.g., 'import_record', 'supplier_product', 'report_match'
  source_id TEXT NOT NULL, -- ID from source table
  source_table TEXT, -- Source table name
  raw_name TEXT, -- Raw name from source
  match_method TEXT, -- 'exact', 'fuzzy', 'website'
  match_score DECIMAL(5,2), -- Similarity score for fuzzy matches
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_links_supplier_id
ON public.supplier_links (supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_links_source
ON public.supplier_links (source_type, source_id);

-- Function to normalize company name
CREATE OR REPLACE FUNCTION normalize_company_name(name TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  IF name IS NULL OR trim(name) = '' THEN
    RETURN NULL;
  END IF;
  
  normalized := lower(trim(name));
  
  -- Remove common suffixes (case-insensitive)
  normalized := regexp_replace(normalized, '\s+(ltd|limited|inc|incorporated|corp|corporation|llc|co|company|group|enterprise|intl|international)\.?$', '', 'i');
  
  -- Strip punctuation
  normalized := regexp_replace(normalized, '[.,;:!?''"()[\]{}]', '', 'g');
  
  -- Normalize whitespace
  normalized := regexp_replace(normalized, '\s+', ' ', 'g');
  normalized := trim(normalized);
  
  RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract website domain
CREATE OR REPLACE FUNCTION extract_domain(url TEXT)
RETURNS TEXT AS $$
BEGIN
  IF url IS NULL OR trim(url) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remove protocol
  url := regexp_replace(url, '^https?://', '', 'i');
  
  -- Remove www.
  url := regexp_replace(url, '^www\.', '', 'i');
  
  -- Extract domain (first part before /)
  url := split_part(url, '/', 1);
  
  -- Extract domain from email format (if present)
  IF url LIKE '%@%' THEN
    url := split_part(url, '@', 2);
  END IF;
  
  -- Convert to lowercase
  url := lower(trim(url));
  
  RETURN NULLIF(url, '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update trigger for suppliers.updated_at
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION update_suppliers_updated_at();

-- Enable pg_trgm extension for fuzzy matching if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for fuzzy name matching
CREATE INDEX IF NOT EXISTS idx_suppliers_normalized_name_trgm
ON public.suppliers USING GIN (normalized_name gin_trgm_ops);

COMMENT ON TABLE public.suppliers IS 'Stable supplier entities with role inference and profile data';
COMMENT ON TABLE public.supplier_aliases IS 'All name variations linked to suppliers for entity resolution';
COMMENT ON TABLE public.supplier_links IS 'Links between suppliers and source records (imports, products, etc.)';
COMMENT ON FUNCTION normalize_company_name IS 'Normalizes company names for entity resolution by lowercasing, removing suffixes, and stripping punctuation';
COMMENT ON FUNCTION extract_domain IS 'Extracts domain from URL or email for matching';





