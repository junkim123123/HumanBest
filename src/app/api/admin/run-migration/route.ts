// @ts-nocheck
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

/**
 * POST /api/admin/run-migration
 * 
 * Executes the migration to fix image_url index size limit issue
 * This endpoint runs DDL statements that cannot be executed via Supabase JS client
 * 
 * Note: Supabase doesn't support direct SQL execution via JS client for DDL statements.
 * This endpoint uses a workaround by executing statements one by one.
 */
export async function POST(request: Request) {
  try {
    // Verify this is a server-side request (optional: add authentication)
    const supabase = createAdminClient();

    const migrationSQL = `
-- Step 1: Drop the UNIQUE constraint on (product_id, image_url)
ALTER TABLE public.product_analyses 
  DROP CONSTRAINT IF EXISTS product_analyses_product_id_image_url_key;

-- Step 2: Make image_url nullable (data URLs won't be stored)
ALTER TABLE public.product_analyses 
  ALTER COLUMN image_url DROP NOT NULL;

-- Step 3: Drop the index on image_url (too large for base64 data URLs)
DROP INDEX IF EXISTS public.idx_product_analyses_image_url;

-- Step 4: Add unique index on image_hash (used as cache key)
CREATE UNIQUE INDEX IF NOT EXISTS product_analyses_image_hash_uq
  ON public.product_analyses (image_hash)
  WHERE image_hash IS NOT NULL;
`;

    // Split into individual statements
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    const results: Array<{ statement: string; success: boolean; error?: string }> = [];

    // Note: Supabase JS client cannot execute DDL statements directly
    // We need to use Supabase Management API or direct PostgreSQL connection
    // For now, we'll return the SQL statements that need to be run manually
    
    return NextResponse.json(
      {
        success: false,
        message: "DDL statements cannot be executed via Supabase JS client",
        instructions: "Please run the migration SQL manually in Supabase SQL Editor",
        sql: migrationSQL,
        statements: statements.map((s) => ({
          statement: s.substring(0, 100) + "...",
          needsManualExecution: true,
        })),
        alternative: {
          method: "Supabase SQL Editor",
          steps: [
            "1. Go to Supabase Dashboard",
            "2. Navigate to SQL Editor",
            "3. Copy and paste the SQL from migration_fix_image_url_index.sql",
            "4. Click 'Run'",
          ],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Migration API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

