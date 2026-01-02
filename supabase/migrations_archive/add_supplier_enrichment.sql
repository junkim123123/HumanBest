-- Create supplier_enrichment table to store inferred supplier profile data
-- This allows caching enrichment results per supplier_id for consistent display
-- All fields are estimates/inferences, not confirmed facts

CREATE TABLE IF NOT EXISTS public.supplier_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id TEXT NOT NULL UNIQUE,
  country_guess TEXT,
  role_factory_pct INTEGER CHECK (role_factory_pct >= 0 AND role_factory_pct <= 100),
  role_trading_pct INTEGER CHECK (role_trading_pct >= 0 AND role_trading_pct <= 100),
  role_logistics_pct INTEGER CHECK (role_logistics_pct >= 0 AND role_logistics_pct <= 100),
  evidence_summary TEXT,
  risk_tags JSONB DEFAULT '[]'::jsonb,
  next_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on supplier_id for UPSERT
CREATE UNIQUE INDEX IF NOT EXISTS supplier_enrichment_supplier_id_uidx
ON public.supplier_enrichment (supplier_id);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_supplier_enrichment_supplier_id
ON public.supplier_enrichment (supplier_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_supplier_enrichment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_supplier_enrichment_updated_at ON public.supplier_enrichment;
CREATE TRIGGER update_supplier_enrichment_updated_at
BEFORE UPDATE ON public.supplier_enrichment
FOR EACH ROW
EXECUTE FUNCTION update_supplier_enrichment_updated_at();

-- RLS policies (if needed)
ALTER TABLE public.supplier_enrichment ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read enrichment data
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.supplier_enrichment;
CREATE POLICY "Allow authenticated read access" ON public.supplier_enrichment
FOR SELECT
USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.supplier_enrichment IS 'Stores inferred supplier profile data (country, role likelihoods, evidence summary, risk tags, next questions). All fields are estimates, not confirmed facts.';
COMMENT ON COLUMN public.supplier_enrichment.role_factory_pct IS 'Estimated likelihood (0-100) that supplier is a factory, based on keywords and evidence';
COMMENT ON COLUMN public.supplier_enrichment.role_trading_pct IS 'Estimated likelihood (0-100) that supplier is a trading company';
COMMENT ON COLUMN public.supplier_enrichment.role_logistics_pct IS 'Estimated likelihood (0-100) that supplier is a logistics company';
COMMENT ON COLUMN public.supplier_enrichment.evidence_summary IS 'One-line summary explaining why this lead was matched';
COMMENT ON COLUMN public.supplier_enrichment.risk_tags IS 'JSON array of risk tags (e.g., ["no_pricing", "unconfirmed_manufacturer"])';
COMMENT ON COLUMN public.supplier_enrichment.next_questions IS 'JSON array of 6 short questions to ask this supplier';

