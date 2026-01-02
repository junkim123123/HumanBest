-- ============================================================================
-- Migration: Add reports table
-- ============================================================================
-- This migration adds the reports table for storing intelligence pipeline results
-- Uses input_key for deduplication (stable hash of input parameters)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_key TEXT NOT NULL UNIQUE,

  product_name TEXT,
  category TEXT,
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),

  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  baseline JSONB NOT NULL DEFAULT '{}'::jsonb,

  pipeline_result JSONB,
  schema_version INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_input_key ON reports(input_key);

-- RLS for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access for MVP (reports are shareable)
CREATE POLICY "Allow anonymous read access" ON reports
  FOR SELECT
  USING (true);

-- Allow authenticated write access
CREATE POLICY "Allow authenticated write access" ON reports
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE reports IS 'Stores complete report data generated from intelligence pipeline. Uses input_key for deduplication.';
COMMENT ON COLUMN reports.input_key IS 'SHA-256 hash of input parameters (image hash, quantity, duty rate, etc.) for deduplication';
COMMENT ON COLUMN reports.pipeline_result IS 'Full pipeline result stored as JSONB for future reprocessing if report schema changes';

