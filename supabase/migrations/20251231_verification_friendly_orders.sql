-- Relax NOT NULL constraints for verification_request orders while enforcing standard order completeness
DO $$
DECLARE
  cols TEXT[] := ARRAY[
    'quote_id',
    'supplier_id',
    'supplier_name',
    'quantity',
    'unit_price',
    'incoterm',
    'origin_country',
    'destination_country',
    'total_amount',
    'payment_status',
    'estimated_delivery_date'
  ];
  col TEXT;
  missing_count INT;
BEGIN
  -- Drop NOT NULL on standard-only fields if present
  FOREACH col IN ARRAY cols LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = col
        AND is_nullable = 'NO'
    ) THEN
      EXECUTE format('ALTER TABLE public.orders ALTER COLUMN %I DROP NOT NULL', col);
    END IF;
  END LOOP;

  -- Remove old constraint if present to replace cleanly
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_standard_fields_required'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_standard_fields_required;
  END IF;

  -- Ensure all referenced columns exist before adding the CHECK
  SELECT COUNT(*) INTO missing_count
  FROM (
    SELECT UNNEST(cols) EXCEPT
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) s;

  IF missing_count = 0 THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_standard_fields_required
      CHECK (
        type <> 'standard'
        OR (
          quote_id IS NOT NULL
          AND supplier_id IS NOT NULL
          AND supplier_name IS NOT NULL
          AND product_name IS NOT NULL
          AND quantity IS NOT NULL
          AND unit_price IS NOT NULL
          AND incoterm IS NOT NULL
          AND origin_country IS NOT NULL
          AND destination_country IS NOT NULL
          AND total_amount IS NOT NULL
          AND payment_status IS NOT NULL
          AND estimated_delivery_date IS NOT NULL
        )
      );
  END IF;
END$$;

-- Ask PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
