-- Add indexes to prevent statement timeouts in supplier_products queries
-- These indexes support fast lookups and text search

-- B-tree index on supplier_id (for joins and filtering)
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id_btree
ON public.supplier_products (supplier_id)
WHERE supplier_id IS NOT NULL;

-- B-tree index on category (for category-based searches)
CREATE INDEX IF NOT EXISTS idx_supplier_products_category_btree
ON public.supplier_products (category)
WHERE category IS NOT NULL;

-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for product_name (for ILIKE and similarity searches)
CREATE INDEX IF NOT EXISTS idx_supplier_products_product_name_trgm
ON public.supplier_products USING gin (lower(product_name) gin_trgm_ops)
WHERE product_name IS NOT NULL;

-- Trigram index for product_description (for ILIKE and similarity searches)
CREATE INDEX IF NOT EXISTS idx_supplier_products_product_desc_trgm
ON public.supplier_products USING gin (lower(product_description) gin_trgm_ops)
WHERE product_description IS NOT NULL;

-- Composite index for category + supplier_id (common query pattern)
CREATE INDEX IF NOT EXISTS idx_supplier_products_category_supplier
ON public.supplier_products (category, supplier_id)
WHERE category IS NOT NULL;

COMMENT ON INDEX idx_supplier_products_product_name_trgm IS 'Trigram index for fast ILIKE queries on product_name field';
COMMENT ON INDEX idx_supplier_products_product_desc_trgm IS 'Trigram index for fast ILIKE queries on product_description field';
