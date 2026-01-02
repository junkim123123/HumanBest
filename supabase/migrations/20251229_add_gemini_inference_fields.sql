-- Migration: Add Gemini inference draft fields with trust-safe gating
-- All inferred values stored as drafts with confidence and evidence

DO $$ 
BEGIN
    -- Critical field confirmation tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'critical_confirm'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN critical_confirm jsonb DEFAULT '{
            "originCountry": {"value": null, "confirmed": false, "source": "NONE", "confidence": null, "evidenceSnippet": null},
            "netWeight": {"value": null, "confirmed": false, "source": "NONE", "confidence": null, "evidenceSnippet": null},
            "allergens": {"value": null, "confirmed": false, "source": "NONE", "confidence": null, "evidenceSnippet": null}
        }'::jsonb;
        
        COMMENT ON COLUMN public.reports.critical_confirm IS 'User confirmation status for 3 critical fields (origin, net weight, allergens) with source and evidence';
    END IF;

    -- Barcode inference draft
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'barcode_draft'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN barcode_draft jsonb;
        
        COMMENT ON COLUMN public.reports.barcode_draft IS 'Vision-inferred barcode: {value, confidence, evidenceSnippet}';
    END IF;

    -- Weight inference draft
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'weight_draft'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN weight_draft jsonb;
        
        COMMENT ON COLUMN public.reports.weight_draft IS 'Inferred unit weight: {value, unit, confidence, evidenceSnippet}';
    END IF;

    -- Case pack inference draft
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'case_pack_draft'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN case_pack_draft jsonb;
        
        COMMENT ON COLUMN public.reports.case_pack_draft IS 'Case pack candidates: {candidates: [{value, confidence, evidenceSnippet}], chosen, confirmed}';
    END IF;

    -- Customs category inference
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'customs_category_draft'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN customs_category_draft jsonb;
        
        COMMENT ON COLUMN public.reports.customs_category_draft IS 'Plain language customs category: {value, confidence, evidenceSnippet}';
    END IF;

    -- HS candidates with reasoning
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'hs_candidates_draft'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN hs_candidates_draft jsonb DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN public.reports.hs_candidates_draft IS 'HS code candidates: [{code, confidence, rationale, evidenceSnippet}]';
    END IF;

    -- Compliance status and notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'compliance_status'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN compliance_status text CHECK (compliance_status IN ('INCOMPLETE', 'PRELIMINARY', 'COMPLETE'));
        
        COMMENT ON COLUMN public.reports.compliance_status IS 'INCOMPLETE = critical fields unconfirmed, PRELIMINARY = confirmed but low confidence, COMPLETE = fully verified';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'compliance_notes'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN compliance_notes jsonb DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN public.reports.compliance_notes IS 'Array of compliance notes: [{level: "info"|"warn", text: string}]';
    END IF;

    -- Barcode extraction source tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'barcode_extraction_source'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN barcode_extraction_source text CHECK (barcode_extraction_source IN ('OCR', 'VISION', 'MANUAL', 'NONE'));
        
        COMMENT ON COLUMN public.reports.barcode_extraction_source IS 'How barcode was extracted: OCR | VISION | MANUAL | NONE';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reports' 
        AND column_name = 'barcode_extraction_status'
    ) THEN
        ALTER TABLE public.reports 
        ADD COLUMN barcode_extraction_status text CHECK (barcode_extraction_status IN ('CONFIRMED', 'DRAFT', 'FAILED', 'NONE'));
        
        COMMENT ON COLUMN public.reports.barcode_extraction_status IS 'Barcode extraction status: CONFIRMED | DRAFT | FAILED | NONE';
    END IF;
END $$;

-- Create indexes for querying draft statuses
CREATE INDEX IF NOT EXISTS idx_reports_compliance_status 
ON public.reports(compliance_status);

CREATE INDEX IF NOT EXISTS idx_reports_barcode_extraction_status 
ON public.reports(barcode_extraction_status);
