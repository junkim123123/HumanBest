-- MVP hotfix: no new columns are required for verification orders
-- Keep schema untouched; only refresh PostgREST cache if needed.
NOTIFY pgrst, 'reload schema';
