-- ============================================================================
-- Migration: Fix image_url index size limit issue
-- ============================================================================
-- Problem: base64 data URLs are too large for B-tree indexes (max 8191 bytes)
-- Solution: 
--   1. Make image_url nullable (data URLs won't be stored)
--   2. Remove image_url index
--   3. Add unique index on image_hash (used as cache key)
--   4. Remove UNIQUE(product_id, image_url) constraint
-- ============================================================================

-- Step 1: Drop the UNIQUE constraint on (product_id, image_url)
ALTER TABLE public.product_analyses 
  DROP CONSTRAINT IF EXISTS product_analyses_product_id_image_url_key;

-- Step 2: Make image_url nullable (data URLs won't be stored)
ALTER TABLE public.product_analyses 
  ALTER COLUMN image_url DROP NOT NULL;

-- Step 3: Drop the index on image_url (too large for base64 data URLs)
DROP INDEX IF EXISTS public.idx_product_analyses_image_url;

-- Step 4: Add unique index on image_hash (used as cache key)
-- This allows upsert by image_hash using onConflict: "image_hash"
CREATE UNIQUE INDEX IF NOT EXISTS product_analyses_image_hash_uq
  ON public.product_analyses (image_hash)
  WHERE image_hash IS NOT NULL;

-- Step 5: Verify the changes
-- You can run these queries to verify:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'product_analyses';
-- \d product_analyses

COMMENT ON COLUMN public.product_analyses.image_url IS 'Original image URL (null for data URLs to avoid index size limits)';
COMMENT ON COLUMN public.product_analyses.image_hash IS 'SHA-256 hash of image used as cache key. Unique index ensures no duplicates.';

