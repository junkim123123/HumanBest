/**
 * Check if reports table exists in Supabase
 * Run with: npx tsx scripts/check-reports-table.ts
 */

import { createAdminClient } from "@/utils/supabase/admin";

async function checkReportsTable() {
  try {
    console.log("🔍 Checking reports table in Supabase...\n");

    const supabase = createAdminClient();

    // Check if reports table exists by trying to query it
    const { data, error } = await supabase
      .from("reports")
      .select("id, input_key, product_name, category, created_at")
      .limit(1);

    if (error) {
      if (error.code === "42P01") {
        // Table does not exist
        console.log("❌ reports table does NOT exist");
        console.log("\n📝 To create it, run the migration:");
        console.log("   File: supabase/apply-reports-table.sql");
        console.log("   Or use Supabase Dashboard > SQL Editor\n");
        return;
      } else {
        console.error("❌ Error checking reports table:", error);
        return;
      }
    }

    console.log("✅ reports table EXISTS!\n");

    // Get table info
    const { count } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });

    console.log(`📊 Total reports: ${count || 0}\n`);

    // Check RLS policies
    console.log("🔐 Checking RLS policies...");
    let policies: any = null;
    let policyError: any = null;
    try {
      const result = await supabase.rpc(
        "get_table_policies",
        { table_name: "reports" }
      );
      policies = result.data;
      policyError = result.error;
    } catch (err) {
      policyError = err;
    }

    if (!policyError && policies) {
      console.log("   Policies:", policies);
    } else {
      console.log("   (Could not check policies - this is OK)");
    }

    // Check indexes
    console.log("\n📇 Checking indexes...");
    let indexes: any = null;
    let indexError: any = null;
    try {
      const result = await supabase.rpc(
        "get_table_indexes",
        { table_name: "reports" }
      );
      indexes = result.data;
      indexError = result.error;
    } catch (err) {
      indexError = err;
    }

    if (!indexError && indexes) {
      console.log("   Indexes:", indexes);
    } else {
      console.log("   (Could not check indexes - this is OK)");
    }

    // Show sample data if exists
    if (data && data.length > 0) {
      console.log("\n📋 Sample report:");
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log("\n📋 No reports found (table is empty)");
    }

    console.log("\n✅ All checks passed!");

  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
  }
}

checkReportsTable();

