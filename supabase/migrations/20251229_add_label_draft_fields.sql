-- Migration: Add label draft extraction fields
-- When OCR fails, we extract structured label data using Vision and store as draft

DO $$ 
BEGIN
    -- Add label_draft (jsonb) for Vision-extracted structured fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_draft'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_draft jsonb;
        
        COMMENT ON COLUMN public.reports.label_draft IS 'Vision-extracted label fields when OCR fails. Structure: {brand_name: {value, confidence, evidence}, product_name: {...}, net_weight_value: {...}, net_weight_unit: {...}, country_of_origin: {...}, allergens_list: {...}, ingredients_summary: {...}}';
    END IF;

    -- Add label_extraction_source (text enum)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_extraction_source'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_extraction_source text CHECK (label_extraction_source IN ('OCR', 'VISION', 'MANUAL'));
        
        COMMENT ON COLUMN public.reports.label_extraction_source IS 'How label data was extracted: OCR (traditional OCR), VISION (Gemini Vision fallback), MANUAL (user entered)';
    END IF;

    -- Add label_extraction_status (text enum)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_extraction_status'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_extraction_status text CHECK (label_extraction_status IN ('DRAFT', 'CONFIRMED'));
        
        COMMENT ON COLUMN public.reports.label_extraction_status IS 'Whether extracted label data is DRAFT (needs confirmation) or CONFIRMED (user verified)';
    END IF;

    -- Add label_confirmed_at (timestamptz)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_confirmed_at'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_confirmed_at timestamptz;
        
        COMMENT ON COLUMN public.reports.label_confirmed_at IS 'When user confirmed the 3 critical label fields (country_of_origin, allergens_list, net_weight)';
    END IF;

    -- Add label_confirmed_fields (jsonb)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_confirmed_fields'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_confirmed_fields jsonb DEFAULT '{}'::jsonb;
        
        COMMENT ON COLUMN public.reports.label_confirmed_fields IS 'User-confirmed values for critical fields: {country_of_origin, allergens_list, net_weight_value, net_weight_unit}';
    END IF;

    -- Add label_vision_extraction_attempted (boolean)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_vision_extraction_attempted'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_vision_extraction_attempted boolean NOT NULL DEFAULT false;
        
        COMMENT ON COLUMN public.reports.label_vision_extraction_attempted IS 'Whether Vision-based label extraction was attempted (triggered when OCR fails)';
    END IF;

    -- Add label_vision_extraction_at (timestamptz)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'label_vision_extraction_at'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN label_vision_extraction_at timestamptz;
        
        COMMENT ON COLUMN public.reports.label_vision_extraction_at IS 'When Vision-based label extraction was performed';
    END IF;
END $$;

-- Create index for querying draft labels
CREATE INDEX IF NOT EXISTS idx_reports_label_extraction_status 
ON public.reports(label_extraction_status);

CREATE INDEX IF NOT EXISTS idx_reports_label_vision_extraction_attempted 
ON public.reports(label_vision_extraction_attempted);
