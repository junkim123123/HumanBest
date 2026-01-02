-- Create materialized view for supplier import statistics
-- This aggregates import/shipping data by supplier_id
-- Note: Adjust table and column names based on actual import/shipping table schema

-- First, create a function to refresh the view
-- This will need to be customized based on your actual import/shipping table structure

-- For now, we'll create a placeholder structure that can be adapted
-- Replace 'import_records' with your actual table name
-- Replace column names with actual columns from your import/shipping table

CREATE OR REPLACE FUNCTION refresh_supplier_import_stats()
RETURNS void AS $$
BEGIN
  -- Drop existing materialized view if it exists
  DROP MATERIALIZED VIEW IF EXISTS public.supplier_import_stats;
  
  -- Create materialized view with aggregated stats
  -- NOTE: You'll need to adjust this query based on your actual table structure
  CREATE MATERIALIZED VIEW public.supplier_import_stats AS
  SELECT 
    sl.supplier_id,
    
    -- Counts
    COUNT(*) FILTER (WHERE ir.arrival_date >= NOW() - INTERVAL '90 days') AS shipment_count_90d,
    COUNT(*) FILTER (WHERE ir.arrival_date >= NOW() - INTERVAL '12 months') AS shipment_count_12m,
    
    -- Dates
    MAX(ir.arrival_date) AS last_seen_date,
    
    -- Top HS codes (most frequent in last 12 months)
    (
      SELECT array_agg(hs_code ORDER BY cnt DESC)
      FROM (
        SELECT hs_code, COUNT(*) as cnt
        FROM import_records ir2
        JOIN supplier_links sl2 ON sl2.source_id = ir2.id::TEXT AND sl2.source_type = 'import_record'
        WHERE sl2.supplier_id = sl.supplier_id
          AND ir2.arrival_date >= NOW() - INTERVAL '12 months'
          AND ir2.hs_code IS NOT NULL
        GROUP BY hs_code
        ORDER BY cnt DESC
        LIMIT 5
      ) top_hs
    ) AS top_hs_codes,
    
    -- Top origins
    (
      SELECT array_agg(origin_country ORDER BY cnt DESC)
      FROM (
        SELECT origin_country, COUNT(*) as cnt
        FROM import_records ir2
        JOIN supplier_links sl2 ON sl2.source_id = ir2.id::TEXT AND sl2.source_type = 'import_record'
        WHERE sl2.supplier_id = sl.supplier_id
          AND ir2.arrival_date >= NOW() - INTERVAL '12 months'
          AND ir2.origin_country IS NOT NULL
        GROUP BY origin_country
        ORDER BY cnt DESC
        LIMIT 5
      ) top_origins
    ) AS top_origins,
    
    -- Top destinations
    (
      SELECT array_agg(destination_country ORDER BY cnt DESC)
      FROM (
        SELECT destination_country, COUNT(*) as cnt
        FROM import_records ir2
        JOIN supplier_links sl2 ON sl2.source_id = ir2.id::TEXT AND sl2.source_type = 'import_record'
        WHERE sl2.supplier_id = sl.supplier_id
          AND ir2.arrival_date >= NOW() - INTERVAL '12 months'
          AND ir2.destination_country IS NOT NULL
        GROUP BY destination_country
        ORDER BY cnt DESC
        LIMIT 5
      ) top_destinations
    ) AS top_destinations,
    
    -- Consignee count (unique importers)
    COUNT(DISTINCT ir.consignee_name) AS consignee_count,
    
    -- Unit value statistics (when available)
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ir.unit_value) AS unit_value_p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ir.unit_value) AS unit_value_median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ir.unit_value) AS unit_value_p75,
    AVG(ir.unit_value) AS unit_value_avg,
    MIN(ir.unit_value) AS unit_value_min,
    MAX(ir.unit_value) AS unit_value_max
    
  FROM supplier_links sl
  LEFT JOIN import_records ir ON sl.source_id = ir.id::TEXT AND sl.source_type = 'import_record'
  WHERE sl.source_type = 'import_record'
  GROUP BY sl.supplier_id;
  
  -- Create index on supplier_id for fast lookups
  CREATE UNIQUE INDEX IF NOT EXISTS supplier_import_stats_supplier_id_idx
  ON public.supplier_import_stats (supplier_id);
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the placeholder nature
COMMENT ON FUNCTION refresh_supplier_import_stats IS 'Refreshes supplier_import_stats materialized view. NOTE: This is a placeholder that needs to be adapted to your actual import/shipping table schema. Replace import_records table name and column names with actual ones.';

-- Create initial view (will fail if import_records doesn't exist, which is expected)
-- Users should customize the function above and run it manually





