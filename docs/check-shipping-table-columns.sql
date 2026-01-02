-- Check if shipping tables contain exporter/shipper columns for supplier matching
-- Run this in Supabase SQL Editor to verify column existence before implementing shipping-based supplier matching
--
-- Quick check: Look for any exporter/shipper/supplier/vendor related columns
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'shipping_records_normalized',
    'shipping_records',
    'import_records'
  )
  AND column_name ILIKE ANY (ARRAY[
    '%exporter%',
    '%shipper%',
    '%consignor%',
    '%supplier%',
    '%vendor%'
  ])
ORDER BY table_name, column_name;

-- Detailed check: Specific column names and data types
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'shipping_records_normalized',
    'shipping_records',
    'import_records',
    'supplier_products'
  )
  AND column_name IN (
    'exporter_name',
    'shipper_name',
    'supplier_name',
    'import_key_id'
  )
ORDER BY table_name, column_name;

-- Interpretation:
-- - If the first query returns any rows with exporter/shipper, you can implement
--   shipping-based supplier matching by normalizing supplier names and joining.
-- - If no rows are returned, use supplier_products-based intel only.
-- - If import_key_id exists in both shipping tables and supplier_products,
--   you can use that as a foreign key relationship.

