-- ============================================================================
-- Migration: Fix product_supplier_matches cache upsert error
-- ============================================================================
-- Problem: upsert with onConflict fails because unique constraints don't exist
-- Solution: Create unique indexes for the conflict resolution columns
-- ============================================================================

-- Create unique index for product_id + supplier_id combination
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_product_supplier_uq
  ON public.product_supplier_matches (product_id, supplier_id)
  WHERE product_id IS NOT NULL AND supplier_id IS NOT NULL;

-- Create unique index for analysis_id + supplier_id combination
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_analysis_supplier_uq
  ON public.product_supplier_matches (analysis_id, supplier_id)
  WHERE analysis_id IS NOT NULL AND supplier_id IS NOT NULL;

-- Verify the indexes were created
-- You can run this query to verify:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'product_supplier_matches'
-- ORDER BY indexname;

COMMENT ON INDEX product_supplier_matches_product_supplier_uq IS 'Unique index for upsert conflict resolution when product_id is present';
COMMENT ON INDEX product_supplier_matches_analysis_supplier_uq IS 'Unique index for upsert conflict resolution when analysis_id is present';

