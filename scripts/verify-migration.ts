/**
 * Verify Migration Script
 * 
 * Checks if the migration was applied successfully by:
 * 1. Verifying image_url is nullable
 * 2. Checking that image_url index is removed
 * 3. Verifying image_hash unique index exists
 */

import { createAdminClient } from "../src/utils/supabase/admin";

async function verifyMigration() {
  console.log("🔍 Verifying migration: Fix image_url index size limit issue\n");

  try {
    const supabase = createAdminClient();

    // Check 1: Verify image_url column is nullable
    console.log("1️⃣ Checking if image_url is nullable...");
    const { data: columnInfo, error: columnError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT 
          column_name, 
          is_nullable, 
          data_type
        FROM information_schema.columns 
        WHERE table_name = 'product_analyses' 
        AND column_name = 'image_url';
      `,
    });

    if (columnError) {
      // Try alternative method
      const { data: testInsert, error: testError } = await supabase
        .from("product_analyses")
        .insert({
          product_name: "__MIGRATION_TEST__",
          description: "Test",
          category: "Test",
          image_url: null, // Try to insert null
          image_hash: "test_hash_" + Date.now(),
          attributes: {},
          keywords: [],
          confidence: 0.8,
        })
        .select()
        .single();

      if (testError) {
        if (testError.message.includes("null value in column") && testError.message.includes("image_url")) {
          console.log("   ❌ image_url is still NOT NULL");
          console.log("   Error:", testError.message);
        } else {
          console.log("   ⚠️  Could not verify (test insert failed for other reason)");
          console.log("   Error:", testError.message);
        }
      } else {
        console.log("   ✅ image_url is nullable (test insert with null succeeded)");
        // Clean up test record
        await supabase.from("product_analyses").delete().eq("id", testInsert.id);
      }
    } else {
      console.log("   ✅ Column info retrieved");
      console.log("   ", columnInfo);
    }

    // Check 2: Verify image_url index is removed
    console.log("\n2️⃣ Checking if image_url index is removed...");
    const { data: indexes, error: indexError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'product_analyses' 
        AND indexname = 'idx_product_analyses_image_url';
      `,
    });

    if (indexError) {
      // Alternative: Try to query indexes via table metadata
      console.log("   ⚠️  Could not query indexes directly");
      console.log("   Please verify manually in Supabase Dashboard");
    } else {
      if (indexes && indexes.length > 0) {
        console.log("   ❌ idx_product_analyses_image_url still exists");
      } else {
        console.log("   ✅ idx_product_analyses_image_url is removed");
      }
    }

    // Check 3: Verify image_hash unique index exists
    console.log("\n3️⃣ Checking if image_hash unique index exists...");
    const { data: hashIndex, error: hashIndexError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'product_analyses' 
        AND indexname = 'product_analyses_image_hash_uq';
      `,
    });

    if (hashIndexError) {
      console.log("   ⚠️  Could not query indexes directly");
      console.log("   Please verify manually in Supabase Dashboard");
    } else {
      if (hashIndex && hashIndex.length > 0) {
        console.log("   ✅ product_analyses_image_hash_uq exists");
        console.log("   ", hashIndex[0]);
      } else {
        console.log("   ❌ product_analyses_image_hash_uq does not exist");
      }
    }

    console.log("\n✅ Verification complete!");
    console.log("\n💡 If any checks failed, please run the migration SQL again in Supabase SQL Editor");

  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    console.error("\n💡 Please verify manually in Supabase Dashboard:");
    console.error("   Run: SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'product_analyses';");
  }
}

verifyMigration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

