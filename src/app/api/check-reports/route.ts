// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/check-reports
 * Check if reports table exists and is accessible
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Try to query reports table
    const { data, error, count } = await supabase
      .from("reports")
      .select("id, input_key, product_name, category, confidence, signals, baseline, pipeline_result, schema_version, created_at, updated_at", { count: "exact" })
      .limit(5);

    if (error) {
      if (error.code === "42P01") {
        // Table does not exist
        return NextResponse.json({
          exists: false,
          error: "Table does not exist",
          message: "reports table has not been created yet",
          action: "Run the migration: supabase/apply-reports-table.sql",
        }, { status: 404 });
      }

      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }, { status: 500 });
    }

    // Table structure verified by successful query above

    // Table exists!
    return NextResponse.json({
      exists: true,
      accessible: true,
      count: count || 0,
      sample: data || [],
      columns: {
        id: "UUID (primary key)",
        input_key: "TEXT (unique, for deduplication)",
        product_name: "TEXT",
        category: "TEXT",
        confidence: "TEXT (low|medium|high)",
        signals: "JSONB",
        baseline: "JSONB",
        pipeline_result: "JSONB",
        schema_version: "INTEGER",
        created_at: "TIMESTAMPTZ",
        updated_at: "TIMESTAMPTZ",
      },
      message: `✅ reports table exists and is accessible. Current count: ${count || 0} records`,
      rls: "Anonymous read access enabled (MVP)",
    });

  } catch (error) {
    return NextResponse.json({
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
