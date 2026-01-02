-- Add role inference fields to suppliers table if not already present
-- This should be run after add_suppliers_entity_resolution.sql

DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'suppliers' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.suppliers ADD COLUMN role TEXT 
    CHECK (role IN ('factory', 'trading', 'logistics', 'unknown'));
    CREATE INDEX IF NOT EXISTS idx_suppliers_role 
    ON public.suppliers (role);
  END IF;

  -- Add role_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'suppliers' 
    AND column_name = 'role_reason'
  ) THEN
    ALTER TABLE public.suppliers ADD COLUMN role_reason TEXT;
  END IF;
END $$;

-- Function to infer supplier role based on name keywords and patterns
CREATE OR REPLACE FUNCTION infer_supplier_role(
  name TEXT,
  normalized_name TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  nname TEXT;
  role_result TEXT := 'unknown';
  reason_result TEXT;
BEGIN
  -- Use normalized name if provided, otherwise normalize
  nname := COALESCE(normalized_name, normalize_company_name(name));
  
  IF nname IS NULL OR trim(nname) = '' THEN
    RETURN 'unknown';
  END IF;
  
  -- Logistics keywords (highest priority, most specific)
  IF nname ~* '\b(logistics|freight|shipping|transport|cargo|logistics|forwarder|freight forwarder|logistics company)\b' THEN
    role_result := 'logistics';
    reason_result := 'Name contains logistics keywords';
    RETURN role_result;
  END IF;
  
  -- Trading keywords
  IF nname ~* '\b(trading|trade|trading company|export|import|trading co|trading ltd|trading corp)\b' THEN
    role_result := 'trading';
    reason_result := 'Name contains trading keywords';
    RETURN role_result;
  END IF;
  
  -- Factory/manufacturing keywords (less specific, so checked after trading)
  IF nname ~* '\b(manufacturing|manufacturer|factory|production|producer|industrial|industries|manufacturing co|factory ltd)\b' THEN
    role_result := 'factory';
    reason_result := 'Name contains manufacturing keywords';
    RETURN role_result;
  END IF;
  
  -- Default to unknown
  role_result := 'unknown';
  reason_result := 'No role indicators found in name';
  
  RETURN role_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to infer role from import patterns (can be enhanced based on actual data)
-- This is a placeholder that can be extended based on import statistics
CREATE OR REPLACE FUNCTION infer_role_from_imports(supplier_id TEXT)
RETURNS TEXT AS $$
DECLARE
  role_result TEXT := 'unknown';
  hs_codes TEXT[];
  origin_countries TEXT[];
BEGIN
  -- Get top HS codes and origins for this supplier from import stats
  -- This is a placeholder - adjust based on actual supplier_import_stats structure
  SELECT 
    top_hs_codes,
    top_origins
  INTO hs_codes, origin_countries
  FROM supplier_import_stats
  WHERE supplier_import_stats.supplier_id = infer_role_from_imports.supplier_id;
  
  -- If no import data, return unknown
  IF hs_codes IS NULL THEN
    RETURN 'unknown';
  END IF;
  
  -- Logic can be enhanced based on HS code patterns, origin countries, etc.
  -- For now, default to unknown (can be enhanced later)
  RETURN 'unknown';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION infer_supplier_role IS 'Infers supplier role from company name keywords. Returns one of: factory, trading, logistics, unknown';
COMMENT ON FUNCTION infer_role_from_imports IS 'Infers supplier role from import patterns (HS codes, origins, etc.). Placeholder that can be enhanced.';





