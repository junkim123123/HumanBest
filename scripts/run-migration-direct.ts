/**
 * Direct Migration Script using PostgreSQL connection
 * 
 * This script connects directly to Supabase PostgreSQL database
 * and executes the migration SQL statements.
 * 
 * Requirements:
 * - Install pg: npm install pg @types/pg
 * - Set DATABASE_URL in .env.local (format: postgresql://postgres:[password]@[host]:5432/postgres)
 */

import * as fs from "fs";
import * as path from "path";

async function runMigrationDirect() {
  // Try to use pg library if available
  let pg: any;
  try {
    pg = require("pg");
  } catch (e) {
    console.error("❌ 'pg' package not found.");
    console.error("   Install it with: npm install pg @types/pg");
    console.error("\n💡 Alternative: Run the SQL manually in Supabase SQL Editor");
    console.error(`   File: ${path.join(__dirname, "../supabase/migration_fix_image_url_index.sql")}`);
    process.exit(1);
  }

  // Get database connection string
  // Format: postgresql://postgres:[password]@[host]:5432/postgres
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable not set");
    console.error("   Format: postgresql://postgres:[password]@[host]:5432/postgres");
    console.error("   You can find this in Supabase Dashboard -> Settings -> Database -> Connection string");
    process.exit(1);
  }

  console.log("🚀 Starting direct migration: Fix image_url index size limit issue\n");

  // Read migration SQL
  const migrationPath = path.join(__dirname, "../supabase/migration_fix_image_url_index.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  // Split into statements
  const statements = migrationSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("COMMENT"));

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false, // Supabase requires SSL
    },
  });

  try {
    await client.connect();
    console.log("✓ Connected to database\n");

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;

      console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

      try {
        await client.query(statement);
        console.log("   ✓ Success\n");
      } catch (error: any) {
        // Some errors are expected (e.g., constraint doesn't exist)
        if (error.message.includes("does not exist") || error.message.includes("already exists")) {
          console.log(`   ⚠️  ${error.message.substring(0, 60)}... (continuing)\n`);
        } else {
          throw error;
        }
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log("\n📋 Verification:");
    const result = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'product_analyses'
      ORDER BY indexname;
    `);
    console.log("\nCurrent indexes on product_analyses:");
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.indexname}`);
    });

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigrationDirect().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

