-- ============================================================================
-- NexSupply Intelligence Pipeline - Database Schema
-- ============================================================================
-- This schema defines the tables required for the Intelligence Pipeline
-- Product (Knowledge) and Order (Transaction) separation is maintained
-- ============================================================================

-- ============================================================================
-- Table 1: product_analyses
-- Stores Gemini analysis results including HS Code, product name, features
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  image_url TEXT NOT NULL,
  image_hash TEXT, -- Hash of image for cache lookup
  product_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  hs_code TEXT, -- Harmonized System Code for customs classification
  attributes JSONB NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, image_url)
);

-- Indexes for product_analyses
CREATE INDEX IF NOT EXISTS idx_product_analyses_product_id ON product_analyses(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analyses_image_url ON product_analyses(image_url);
CREATE INDEX IF NOT EXISTS idx_product_analyses_image_hash ON product_analyses(image_hash);
CREATE INDEX IF NOT EXISTS idx_product_analyses_hs_code ON product_analyses(hs_code);
CREATE INDEX IF NOT EXISTS idx_product_analyses_category ON product_analyses(category);
CREATE INDEX IF NOT EXISTS idx_product_analyses_keywords ON product_analyses USING gin(keywords);

-- ============================================================================
-- Table 2: supplier_products
-- Stores supplier/factory data and products they handle
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  moq INTEGER NOT NULL DEFAULT 1 CHECK (moq > 0),
  lead_time INTEGER NOT NULL DEFAULT 0 CHECK (lead_time >= 0), -- days
  category TEXT,
  hs_code TEXT, -- HS Code for matching
  currency TEXT NOT NULL DEFAULT 'USD',
  import_key_id TEXT, -- Reference to ImportKey if applicable
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for supplier_products
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_product_name ON supplier_products USING gin(to_tsvector('english', product_name));
CREATE INDEX IF NOT EXISTS idx_supplier_products_category ON supplier_products(category);
CREATE INDEX IF NOT EXISTS idx_supplier_products_hs_code ON supplier_products(hs_code);
CREATE INDEX IF NOT EXISTS idx_supplier_products_import_key_id ON supplier_products(import_key_id);

-- ============================================================================
-- Table 3: product_supplier_matches
-- Stores matching scores and relationships between analyses and suppliers
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_supplier_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  analysis_id UUID REFERENCES product_analyses(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  moq INTEGER NOT NULL DEFAULT 1,
  lead_time INTEGER NOT NULL DEFAULT 0,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reason TEXT, -- Why this match was made (HS Code, keyword, etc.)
  import_key_id TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

-- Indexes for product_supplier_matches
CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_product_id ON product_supplier_matches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_analysis_id ON product_supplier_matches(analysis_id);
CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_match_score ON product_supplier_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_supplier_id ON product_supplier_matches(supplier_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE product_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_supplier_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read access" ON product_analyses
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON supplier_products
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON product_supplier_matches
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert/update/delete their own data
-- Adjust these policies based on your authentication requirements
CREATE POLICY "Allow authenticated write access" ON product_analyses
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access" ON supplier_products
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access" ON product_supplier_matches
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- Functions: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_product_analyses_updated_at
  BEFORE UPDATE ON product_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_supplier_matches_updated_at
  BEFORE UPDATE ON product_supplier_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE product_analyses IS 'Stores Gemini AI analysis results for product images. Includes HS Code, product name, and features.';
COMMENT ON TABLE supplier_products IS 'Stores supplier/factory data and products they handle. Used for matching with product analyses.';
COMMENT ON TABLE product_supplier_matches IS 'Stores matching scores and relationships between product analyses and suppliers.';

COMMENT ON COLUMN product_analyses.hs_code IS 'Harmonized System Code for customs classification and duty calculation';
COMMENT ON COLUMN supplier_products.hs_code IS 'HS Code for matching with product analyses';
COMMENT ON COLUMN product_supplier_matches.match_reason IS 'Explanation of why this match was made (e.g., HS Code match, keyword match)';

