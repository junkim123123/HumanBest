// @ts-nocheck
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

/**
 * POST /api/admin/apply-supplier-matches-index
 * Apply migration to fix supplier matches cache unique index
 */
export async function POST() {
  try {
    const supabaseAdmin = createAdminClient();

    // Create unique index for product_id + supplier_id combination
    const { error: error1 } = await supabaseAdmin.rpc("exec_sql", {
      sql: `
        CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_product_supplier_uq
        ON public.product_supplier_matches (product_id, supplier_id)
        WHERE product_id IS NOT NULL AND supplier_id IS NOT NULL;
      `,
    });

    // If RPC doesn't work, try direct query (PostgreSQL doesn't support direct SQL execution via Supabase client)
    // Instead, we'll use a workaround: check if index exists, if not, we'll need manual application
    
    // Let's try a different approach - use raw SQL via Supabase client
    // Actually, Supabase JS client doesn't support raw SQL execution
    // We need to use the REST API or pg directly
    
    // For now, return instructions
    return NextResponse.json({
      success: false,
      message: "Supabase JS client doesn't support raw SQL execution",
      instructions: {
        method1: "Use Supabase Dashboard > SQL Editor",
        method2: "Use Supabase CLI: supabase db push",
        sql: `
-- Create unique index for product_id + supplier_id combination
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_product_supplier_uq
  ON public.product_supplier_matches (product_id, supplier_id)
  WHERE product_id IS NOT NULL AND supplier_id IS NOT NULL;

-- Create unique index for analysis_id + supplier_id combination
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_analysis_supplier_uq
  ON public.product_supplier_matches (analysis_id, supplier_id)
  WHERE analysis_id IS NOT NULL AND supplier_id IS NOT NULL;

COMMENT ON INDEX product_supplier_matches_product_supplier_uq IS 'Unique index for upsert conflict resolution when product_id is present';
COMMENT ON INDEX product_supplier_matches_analysis_supplier_uq IS 'Unique index for upsert conflict resolution when analysis_id is present';
        `,
      },
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

