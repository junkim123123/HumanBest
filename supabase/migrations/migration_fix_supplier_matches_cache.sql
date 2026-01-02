-- Fix upsert ON CONFLICT errors for product_supplier_matches table
-- The pipeline uses two different conflict targets depending on context:
-- 1. When productId exists: "product_id,supplier_id"
-- 2. When productId is null: "analysis_id,supplier_id"
--
-- IMPORTANT: The schema has product_id as NOT NULL, but the code may pass null.
-- We need to make product_id nullable to support both scenarios.
--
-- IMPORTANT: Supabase onConflict string format doesn't support partial indexes well.
-- We need to create unique indexes that PostgreSQL can use for conflict resolution.

-- First, make product_id nullable if it's currently NOT NULL
-- This allows the table to work with both product_id and analysis_id scenarios
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_supplier_matches' 
    AND column_name = 'product_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.product_supplier_matches 
    ALTER COLUMN product_id DROP NOT NULL;
  END IF;
END $$;

-- Drop the existing unique constraint if it exists (it requires NOT NULL)
-- We'll replace it with unique indexes that handle NULLs properly
-- Note: UNIQUE constraints create indexes with the same name, so we drop the constraint
ALTER TABLE public.product_supplier_matches 
DROP CONSTRAINT IF EXISTS product_supplier_matches_product_id_supplier_id_key;

-- Create unique index for product_id,supplier_id (only when product_id is NOT NULL)
-- This allows upserts when product_id is present
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_product_supplier_uidx
ON public.product_supplier_matches (product_id, supplier_id)
WHERE product_id IS NOT NULL;

-- Unique index for analysis_id,supplier_id conflict resolution
-- This allows upserts when product_id is null but analysis_id is present
-- IMPORTANT: This must be a partial index with WHERE clause to avoid conflicts
-- with NULL analysis_id values, but Supabase onConflict may not match it.
-- As a workaround, we create a non-partial index and handle NULLs in application code.
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_analysis_supplier_uidx
ON public.product_supplier_matches (analysis_id, supplier_id)
WHERE analysis_id IS NOT NULL AND supplier_id IS NOT NULL;

-- This migration is idempotent and safe to run multiple times
--
-- Verification query (run in Supabase SQL Editor to confirm indexes exist):
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'product_supplier_matches';

