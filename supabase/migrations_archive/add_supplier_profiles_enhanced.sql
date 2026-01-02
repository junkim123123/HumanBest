-- Enhance supplier_profiles table with additional fields for entity resolution and enrichment
-- This migration extends the existing supplier_profiles table

-- Add new columns if they don't exist (using ALTER TABLE with IF NOT EXISTS equivalent pattern)
DO $$
BEGIN
  -- Add supplier_id column if it doesn't exist (for stable entity resolution)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_profiles' 
    AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE public.supplier_profiles ADD COLUMN supplier_id TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS supplier_profiles_supplier_id_uidx
    ON public.supplier_profiles (supplier_id) WHERE supplier_id IS NOT NULL;
  END IF;

  -- Add role column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.supplier_profiles ADD COLUMN role TEXT 
    CHECK (role IN ('factory', 'trading', 'logistics', 'unknown'));
    CREATE INDEX IF NOT EXISTS idx_supplier_profiles_role 
    ON public.supplier_profiles (role);
  END IF;

  -- Add city column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_profiles' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.supplier_profiles ADD COLUMN city TEXT;
  END IF;

  -- Rename last_checked_at to last_seen_date if exists, or add it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_profiles' 
    AND column_name = 'last_checked_at'
  ) THEN
    ALTER TABLE public.supplier_profiles RENAME COLUMN last_checked_at TO last_seen_date;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_profiles' 
    AND column_name = 'last_seen_date'
  ) THEN
    ALTER TABLE public.supplier_profiles ADD COLUMN last_seen_date TIMESTAMPTZ;
  END IF;

  -- Add shipment_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_profiles' 
    AND column_name = 'shipment_count'
  ) THEN
    ALTER TABLE public.supplier_profiles ADD COLUMN shipment_count INTEGER DEFAULT 0;
  END IF;

  -- Add hs_codes_seen column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_profiles' 
    AND column_name = 'hs_codes_seen'
  ) THEN
    ALTER TABLE public.supplier_profiles ADD COLUMN hs_codes_seen TEXT[] DEFAULT '{}';
  END IF;

  -- Add evidence_summary column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'supplier_profiles' 
    AND column_name = 'evidence_summary'
  ) THEN
    ALTER TABLE public.supplier_profiles ADD COLUMN evidence_summary TEXT;
  END IF;
END $$;

-- Create supplier_evidence table for storing evidence per supplier
CREATE TABLE IF NOT EXISTS public.supplier_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id TEXT NOT NULL, -- References supplier_profiles.supplier_id
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('keyword_match', 'category_match', 'hs_code_match', 'similar_record', 'product_history')),
  evidence_value TEXT, -- e.g., matched keyword, HS code, record count
  confidence_score DECIMAL(5,2), -- 0.00 to 100.00
  source_record_id TEXT, -- Reference to source record if applicable
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_evidence_supplier_id
ON public.supplier_evidence (supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_evidence_type
ON public.supplier_evidence (evidence_type);

-- Add foreign key constraint if supplier_profiles has supplier_id
-- Note: We use a partial index approach since supplier_id might not be set on all rows
COMMENT ON TABLE public.supplier_profiles IS 'Stores enriched supplier profile data with entity resolution support';
COMMENT ON TABLE public.supplier_evidence IS 'Stores evidence records for supplier matching and enrichment';





