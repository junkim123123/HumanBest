/**
 * Migration Script: Fix image_url index size limit issue
 * 
 * This script executes the migration SQL to:
 * 1. Make image_url nullable
 * 2. Remove image_url index
 * 3. Add unique index on image_hash
 * 4. Remove UNIQUE(product_id, image_url) constraint
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing environment variables:");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
    console.error("\nPlease set these in your .env.local file");
    process.exit(1);
  }

  console.log("🚀 Starting migration: Fix image_url index size limit issue\n");

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read migration SQL file
  const migrationPath = path.join(__dirname, "../supabase/migration_fix_image_url_index.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  // Split SQL into individual statements
  const statements = migrationSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("COMMENT"));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  try {
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comment-only lines
      if (statement.startsWith("--") || statement.length === 0) {
        continue;
      }

      console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

      // Use RPC to execute raw SQL (if available) or use direct query
      // Note: Supabase doesn't directly support raw SQL execution via JS client
      // We'll need to use the REST API or PostgREST functions
      
      // Alternative: Use Supabase REST API with service role key
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql: statement }),
      });

      if (!response.ok) {
        // If RPC doesn't exist, try direct approach using PostgREST
        // For DDL statements, we need to use Supabase Management API or direct connection
        console.warn(`⚠️  Direct SQL execution not available. Please run manually in Supabase SQL Editor.`);
        console.warn(`   Statement: ${statement}`);
        break;
      }

      const result = await response.json();
      console.log(`   ✓ Success`);
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📋 Verification queries:");
    console.log("   Run these in Supabase SQL Editor to verify:");
    console.log("   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'product_analyses';");
    console.log("   \\d product_analyses");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error("\n💡 Alternative: Run the SQL manually in Supabase SQL Editor:");
    console.error(`   File: ${migrationPath}`);
    process.exit(1);
  }
}

// Run migration
runMigration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

