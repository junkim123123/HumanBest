-- Create table for ImportKey raw company list derived from similar import records
-- This table stores companies extracted from shipping/import records for transparency

CREATE TABLE IF NOT EXISTS report_importkey_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'Shipper', 'Exporter', 'Consignee', 'Importer'
  shipments_count INTEGER NOT NULL DEFAULT 0,
  last_seen DATE,
  origin_country TEXT,
  example_description TEXT,
  source TEXT NOT NULL DEFAULT 'internal_records',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Primary key ensures one row per report-company-role combination
  UNIQUE(report_id, company_name, role)
);

-- Index for fast lookups by report_id
CREATE INDEX IF NOT EXISTS idx_report_importkey_companies_report_id 
  ON report_importkey_companies(report_id);

-- Index for sorting by shipments count
CREATE INDEX IF NOT EXISTS idx_report_importkey_companies_shipments 
  ON report_importkey_companies(report_id, shipments_count DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_report_importkey_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_report_importkey_companies_updated_at
  BEFORE UPDATE ON report_importkey_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_report_importkey_companies_updated_at();



