-- Create report_supplier_matches table to store supplier matches per report
-- This allows persisting supplier matches with their tier (recommended/candidate)

CREATE TABLE IF NOT EXISTS public.report_supplier_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('recommended', 'candidate')),
  match_score INTEGER,
  rerank_score INTEGER,
  flags JSONB DEFAULT '{}',
  evidence JSONB DEFAULT '{}',
  unit_price NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint matching the upsert target
CREATE UNIQUE INDEX IF NOT EXISTS report_supplier_matches_report_supplier_tier_uidx
ON public.report_supplier_matches (report_id, supplier_id, tier);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_report_supplier_matches_report_id
ON public.report_supplier_matches (report_id);

CREATE INDEX IF NOT EXISTS idx_report_supplier_matches_report_tier
ON public.report_supplier_matches (report_id, tier);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_report_supplier_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_report_supplier_matches_updated_at ON public.report_supplier_matches;

CREATE TRIGGER update_report_supplier_matches_updated_at
BEFORE UPDATE ON public.report_supplier_matches
FOR EACH ROW
EXECUTE FUNCTION update_report_supplier_matches_updated_at();

