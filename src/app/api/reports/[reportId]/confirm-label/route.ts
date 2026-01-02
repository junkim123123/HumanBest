// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/reports/[reportId]/confirm-label
 * Confirm the 3 critical label fields (country_of_origin, allergens_list, net_weight)
 * This marks labelExtractionStatus as CONFIRMED and enables full compliance checks
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { reportId } = await params;
    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "MISSING_REPORT_ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { country_of_origin, allergens_list, net_weight_value, net_weight_unit } = body;

    // Validate required fields
    if (!country_of_origin || !net_weight_value || !net_weight_unit) {
      return NextResponse.json(
        { success: false, error: "MISSING_REQUIRED_FIELDS", details: "country_of_origin, net_weight_value, and net_weight_unit are required" },
        { status: 400 }
      );
    }

    // Fetch report to verify ownership
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("id, user_id, label_draft, label_extraction_status")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { success: false, error: "REPORT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Build confirmed fields object
    const labelConfirmedFields = {
      country_of_origin: country_of_origin.trim(),
      allergens_list: Array.isArray(allergens_list) ? allergens_list : [],
      net_weight_value: parseFloat(net_weight_value),
      net_weight_unit: net_weight_unit.trim(),
    };

    // Update report with confirmed fields
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        label_extraction_status: "CONFIRMED",
        label_confirmed_fields: JSON.stringify(labelConfirmedFields),
        label_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[Confirm Label API] Update failed:", updateError);
      return NextResponse.json(
        { success: false, error: "UPDATE_FAILED", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Label fields confirmed successfully",
      labelConfirmedFields,
    });
  } catch (error: any) {
    console.error("[Confirm Label API] Error:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", details: error.message },
      { status: 500 }
    );
  }
}
