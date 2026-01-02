-- ============================================================================
-- Migration: Add trigram index for supplier_products.product_name
-- ============================================================================
-- Problem: ilike searches become slow as data grows without proper index
-- Solution: Add pg_trgm extension and GIN index for fast text search
-- ============================================================================

-- Enable pg_trgm extension for trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on product_name for fast ilike searches
CREATE INDEX IF NOT EXISTS supplier_products_name_trgm
  ON supplier_products USING gin (product_name gin_trgm_ops);

COMMENT ON INDEX supplier_products_name_trgm IS 'GIN trigram index for fast ilike searches on product_name. Prevents statement timeout on large datasets.';

