-- ============================================================================
-- NexSupply Test Data Seeding
-- ============================================================================
-- Run this in Supabase SQL Editor to populate test supplier data
-- This allows the Intelligence Pipeline to find matches during testing
-- ============================================================================

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM supplier_products WHERE supplier_id LIKE 'TEST-%';

-- ============================================================================
-- Test Supplier Data: Glassware & Smoking Accessories
-- ============================================================================

INSERT INTO supplier_products (
  supplier_id,
  supplier_name,
  product_name,
  product_description,
  unit_price,
  moq,
  lead_time,
  category,
  hs_code,
  currency,
  import_key_id
) VALUES 
-- Glass Pipes
(
  'TEST-GLASS-001',
  'Hebei Glass Works Co.',
  'Borosilicate Glass Pipe 4inch',
  'High-quality borosilicate glass hand pipe, 4 inch length, clear finish',
  2.50,
  100,
  14,
  'Glassware',
  '7013.99',
  'USD',
  NULL
),
(
  'TEST-GLASS-002',
  'Shenzhen Sourcing Ltd.',
  'Color Changing Spoon Pipe',
  'Fume glass spoon pipe with color-changing effect, 3.5 inch',
  1.80,
  200,
  21,
  'Glassware',
  '7013.99',
  'USD',
  NULL
),
(
  'TEST-GLASS-003',
  'Guangzhou Glass Art Factory',
  'Bubbler Water Pipe 6inch',
  'Glass bubbler with water filtration, 6 inch height, multiple colors',
  4.20,
  50,
  18,
  'Glassware',
  '7013.99',
  'USD',
  NULL
),

-- Grinders & Accessories
(
  'TEST-ACC-001',
  'Yiwu Trading Master',
  'Grinder Aluminum 63mm',
  'Aluminum 4-piece herb grinder, 63mm diameter, magnetic lid',
  3.20,
  50,
  10,
  'Accessories',
  '8210.00',
  'USD',
  NULL
),
(
  'TEST-ACC-002',
  'Dongguan Metal Works',
  'Stainless Steel Grinder 50mm',
  'Premium stainless steel grinder, 50mm, 4-piece design',
  5.50,
  30,
  12,
  'Accessories',
  '8210.00',
  'USD',
  NULL
),

-- Storage & Containers
(
  'TEST-STOR-001',
  'Zhejiang Plastic Molding Co.',
  'Airtight Storage Jar 16oz',
  'UV-protected airtight storage jar, 16oz capacity, multiple colors',
  1.20,
  500,
  7,
  'Storage',
  '3923.30',
  'USD',
  NULL
),
(
  'TEST-STOR-002',
  'Foshan Container Factory',
  'Glass Storage Jar with Lid',
  'Clear glass storage jar with airtight lid, 32oz capacity',
  2.80,
  200,
  14,
  'Storage',
  '7013.99',
  'USD',
  NULL
),

-- Rolling Papers & Wraps
(
  'TEST-PAPER-001',
  'Hangzhou Paper Products',
  'Organic Hemp Rolling Papers 1.25',
  'Organic hemp rolling papers, 1.25 inch width, 50 sheets per pack',
  0.35,
  1000,
  5,
  'Paper Products',
  '4813.90',
  'USD',
  NULL
),
(
  'TEST-PAPER-002',
  'Ningbo Packaging Solutions',
  'Pre-Rolled Cones 1.25g',
  'Pre-rolled paper cones, 1.25g capacity, 50 cones per box',
  0.50,
  500,
  7,
  'Paper Products',
  '4813.90',
  'USD',
  NULL
),

-- Lighters & Tools
(
  'TEST-TOOL-001',
  'Shenzhen Electronics Co.',
  'Butane Torch Lighter',
  'Refillable butane torch lighter, windproof, adjustable flame',
  1.50,
  200,
  10,
  'Tools',
  '9613.80',
  'USD',
  NULL
),
(
  'TEST-TOOL-002',
  'Guangdong Hardware Factory',
  'Stainless Steel Multi-Tool',
  'Stainless steel multi-purpose tool for cleaning and maintenance',
  2.20,
  100,
  12,
  'Tools',
  '8210.00',
  'USD',
  NULL
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the data was inserted correctly:
-- SELECT supplier_name, product_name, hs_code, unit_price, moq FROM supplier_products WHERE supplier_id LIKE 'TEST-%' ORDER BY category, product_name;

