-- Migration: Fix product_supplier_matches schema to align with code
-- Add missing columns needed for supplier leads persistence

-- Step 1: Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add report_id column (required for linking to reports)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_supplier_matches' 
        AND column_name = 'report_id'
    ) THEN
        ALTER TABLE public.product_supplier_matches 
        ADD COLUMN report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE;
        
        -- Create index for report_id queries
        CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_report_id 
        ON public.product_supplier_matches(report_id);
    END IF;

    -- Add tier column (recommended | candidate)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_supplier_matches' 
        AND column_name = 'tier'
    ) THEN
        ALTER TABLE public.product_supplier_matches 
        ADD COLUMN tier text NOT NULL DEFAULT 'candidate'
        CHECK (tier IN ('recommended', 'candidate'));
    END IF;

    -- Add rerank_score column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_supplier_matches' 
        AND column_name = 'rerank_score'
    ) THEN
        ALTER TABLE public.product_supplier_matches 
        ADD COLUMN rerank_score decimal(10,4);
    END IF;

    -- Add flags column (JSONB for flexible metadata)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_supplier_matches' 
        AND column_name = 'flags'
    ) THEN
        ALTER TABLE public.product_supplier_matches 
        ADD COLUMN flags jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Add evidence column (JSONB for structured evidence data)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'product_supplier_matches' 
        AND column_name = 'evidence'
    ) THEN
        ALTER TABLE public.product_supplier_matches 
        ADD COLUMN evidence jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Step 2: Drop old unique constraint and create new one
-- The code uses (report_id, supplier_id, tier) for conflict resolution
DROP INDEX IF EXISTS product_supplier_matches_product_id_supplier_id_key;
DROP INDEX IF EXISTS product_supplier_matches_product_supplier_uq;

-- Create unique index for upsert conflict resolution
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_report_supplier_tier_uq
ON public.product_supplier_matches (report_id, supplier_id, tier)
WHERE report_id IS NOT NULL;

-- Keep the old product_id unique constraint for backward compatibility
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_product_supplier_uq
ON public.product_supplier_matches (product_id, supplier_id)
WHERE product_id IS NOT NULL;

-- Step 3: Make some columns nullable since they may not always be present
ALTER TABLE public.product_supplier_matches 
ALTER COLUMN product_id DROP NOT NULL,
ALTER COLUMN product_name DROP NOT NULL,
ALTER COLUMN unit_price DROP NOT NULL;

-- Step 4: Update comments
COMMENT ON COLUMN public.product_supplier_matches.report_id IS 'Link to reports table for supplier leads';
COMMENT ON COLUMN public.product_supplier_matches.tier IS 'recommended or candidate tier';
COMMENT ON COLUMN public.product_supplier_matches.flags IS 'Metadata: matched_anchors, why_lines, evidence_strength, etc';
COMMENT ON COLUMN public.product_supplier_matches.evidence IS 'Evidence data: recordCount, lastSeenDays, productTypes, evidenceSnippet';
COMMENT ON COLUMN public.product_supplier_matches.rerank_score IS 'Reranking score after anchor matching';
