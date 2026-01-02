/**
 * Apply supplier matches cache unique index migration
 * Run with: npx tsx scripts/apply-supplier-matches-index.ts
 */

import { createAdminClient } from "@/utils/supabase/admin";
import pg from "pg";

const { Client } = pg;

async function applyMigration() {
  try {
    console.log("🔧 Applying supplier matches cache unique index migration...\n");

    // Get connection details from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    // Extract database connection details from Supabase URL
    // Supabase connection string format: postgresql://postgres:[password]@[host]:[port]/postgres
    // We need to construct this from the service key or use direct connection
    
    // Alternative: Use Supabase REST API to execute SQL
    // But Supabase doesn't provide direct SQL execution endpoint
    
    // Best approach: Use pg client directly if we have connection string
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (!dbUrl) {
      console.log("❌ DATABASE_URL or SUPABASE_DB_URL not found");
      console.log("\n📝 Please apply manually via Supabase Dashboard:");
      console.log("   1. Go to Supabase Dashboard > SQL Editor");
      console.log("   2. Copy SQL from: supabase/migration_fix_supplier_matches_cache.sql");
      console.log("   3. Execute the SQL");
      return;
    }

    const client = new Client({
      connectionString: dbUrl,
    });

    await client.connect();
    console.log("✅ Connected to database\n");

    // Apply migration
    const sql = `
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
    `;

    await client.query(sql);
    console.log("✅ Migration applied successfully!\n");

    // Verify indexes
    const verifyQuery = `
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'product_supplier_matches'
      AND indexname IN (
        'product_supplier_matches_product_supplier_uq',
        'product_supplier_matches_analysis_supplier_uq'
      )
      ORDER BY indexname;
    `;

    const result = await client.query(verifyQuery);
    
    if (result.rows.length === 2) {
      console.log("✅ Verification: Both indexes created successfully");
      result.rows.forEach((row) => {
        console.log(`   - ${row.indexname}`);
      });
    } else {
      console.log("⚠️  Warning: Expected 2 indexes, found", result.rows.length);
    }

    await client.end();
    console.log("\n✅ Migration complete!");

  } catch (error) {
    console.error("❌ Error applying migration:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

applyMigration();

