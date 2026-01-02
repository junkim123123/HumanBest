-- Add indexes to optimize category search and prevent timeouts
-- These indexes help with ILIKE queries on category and product_name

-- Enable pg_trgm extension for trigram-based text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for exact category match (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_supplier_products_category_exact
ON public.supplier_products (category)
WHERE category IS NOT NULL;

-- Trigram index for category ILIKE queries (fuzzy category matching)
CREATE INDEX IF NOT EXISTS idx_supplier_products_category_trgm
ON public.supplier_products USING gin (lower(category) gin_trgm_ops)
WHERE category IS NOT NULL;

-- Trigram index for product_name ILIKE queries (used in OR filter searches)
CREATE INDEX IF NOT EXISTS idx_supplier_products_product_name_trgm
ON public.supplier_products USING gin (lower(product_name) gin_trgm_ops)
WHERE product_name IS NOT NULL;

-- Composite index for category + supplier_id (common query pattern)
CREATE INDEX IF NOT EXISTS idx_supplier_products_category_supplier
ON public.supplier_products (category, supplier_id)
WHERE category IS NOT NULL;

COMMENT ON INDEX idx_supplier_products_category_trgm IS 'Trigram index for fast ILIKE queries on category field';
COMMENT ON INDEX idx_supplier_products_product_name_trgm IS 'Trigram index for fast ILIKE queries on product_name field';

