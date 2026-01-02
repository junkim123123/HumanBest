-- Migration: Add external trade data flags to reports
-- Adds used_external_trade_data and external_trade_data_reason

DO $$ 
BEGIN
    -- Add used_external_trade_data (boolean)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'used_external_trade_data'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN used_external_trade_data boolean NOT NULL DEFAULT false;
        
        COMMENT ON COLUMN public.reports.used_external_trade_data IS 'Whether external trade data (ImportKey/internal records) was used for this report';
    END IF;

    -- Add external_trade_data_reason (text)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'external_trade_data_reason'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN external_trade_data_reason text;
        
        COMMENT ON COLUMN public.reports.external_trade_data_reason IS 'Reason code: USED_LOW_EVIDENCE, SKIP_INTERNAL_CONFIDENT, SKIP_BENCHMARKS, SKIP_NO_MATCH, SKIP_DISABLED, SKIP_BUDGET';
    END IF;

    -- Add external_trade_data_provider (text)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'external_trade_data_provider'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN external_trade_data_provider text;
        
        COMMENT ON COLUMN public.reports.external_trade_data_provider IS 'Source of external trade data: importkey, panjiva, trademap, etc.';
    END IF;

    -- Add external_trade_data_checked_at (timestamptz)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'external_trade_data_checked_at'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN external_trade_data_checked_at timestamptz;
        
        COMMENT ON COLUMN public.reports.external_trade_data_checked_at IS 'When the trade data decision was made';
    END IF;

    -- Add external_trade_data_attempted (boolean)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'external_trade_data_attempted'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN external_trade_data_attempted boolean NOT NULL DEFAULT false;
        
        COMMENT ON COLUMN public.reports.external_trade_data_attempted IS 'Whether external trade data lookup was attempted (before checking result count)';
    END IF;

    -- Add external_trade_data_result_count (int)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'external_trade_data_result_count'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN external_trade_data_result_count integer;
        
        COMMENT ON COLUMN public.reports.external_trade_data_result_count IS 'Number of matching shipment records found (null if not attempted or call failed)';
    END IF;

    -- Add label_uploaded (boolean)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_uploaded'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_uploaded boolean NOT NULL DEFAULT false;
        
        COMMENT ON COLUMN public.reports.label_uploaded IS 'Whether a label image was uploaded in the request';
    END IF;

    -- Add label_ocr_status (text enum)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_ocr_status'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_ocr_status text CHECK (label_ocr_status IN ('SUCCESS', 'PARTIAL', 'FAILED'));
        
        COMMENT ON COLUMN public.reports.label_ocr_status IS 'Label OCR result: SUCCESS | PARTIAL | FAILED';
    END IF;

    -- Add label_ocr_failure_reason (text)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_ocr_failure_reason'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_ocr_failure_reason text;
        
        COMMENT ON COLUMN public.reports.label_ocr_failure_reason IS 'OCR failure heuristic: BLURRY, GLARE, TOO_SMALL, CROPPED, LOW_CONTRAST, NON_LATIN, or null if success';
    END IF;

    -- Add label_terms (jsonb)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_terms'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_terms jsonb DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN public.reports.label_terms IS 'Extracted OCR terms from label as JSON array';
    END IF;

    -- Add label_ocr_checked_at (timestamptz)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_ocr_checked_at'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_ocr_checked_at timestamptz;
        
        COMMENT ON COLUMN public.reports.label_ocr_checked_at IS 'When label OCR was performed';
    END IF;
END $$;

-- Optional: indexes for trade data audit queries
CREATE INDEX IF NOT EXISTS idx_reports_used_external_trade_data 
ON public.reports(used_external_trade_data);

CREATE INDEX IF NOT EXISTS idx_reports_external_trade_data_attempted 
ON public.reports(external_trade_data_attempted);

CREATE INDEX IF NOT EXISTS idx_reports_label_uploaded 
ON public.reports(label_uploaded);

-- SCHEMA RELOAD NOTE:
-- After applying this migration to Supabase, if you still see schema cache errors,
-- reload the PostgREST schema cache by running in your terminal:
--   curl -X POST "http://localhost:3000/rpc/pgrst_reload_schema" 2>/dev/null
-- OR for Supabase Cloud, run:
--   SELECT pgrst_api_function_once('pgrst_reload_schema');
-- OR wait for automatic schema sync (usually < 5 seconds)
