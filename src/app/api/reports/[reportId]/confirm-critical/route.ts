// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/reports/[reportId]/confirm-critical
 * Confirm the 3 critical fields (originCountry, netWeight, allergens)
 * This marks fields as confirmed and updates compliance status
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
    const { originCountry, netWeight, allergens } = body;

    // Validate inputs
    if (!originCountry && !netWeight && !allergens) {
      return NextResponse.json(
        { success: false, error: "AT_LEAST_ONE_FIELD_REQUIRED" },
        { status: 400 }
      );
    }

    // Fetch current report
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json(
        { success: false, error: "REPORT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Build updated critical_confirm object
    const currentCriticalConfirm = report.critical_confirm || {
      originCountry: { value: null, confirmed: false, source: "NONE", confidence: null, evidenceSnippet: null },
      netWeight: { value: null, confirmed: false, source: "NONE", confidence: null, evidenceSnippet: null },
      allergens: { value: null, confirmed: false, source: "NONE", confidence: null, evidenceSnippet: null },
    };

    const updatedCriticalConfirm = { ...currentCriticalConfirm };

    // Update each field if provided
    if (originCountry !== undefined) {
      updatedCriticalConfirm.originCountry = {
        value: originCountry,
        confirmed: true,
        source: "MANUAL",
        confidence: 1.0,
        evidenceSnippet: "User confirmed",
      };
    }

    if (netWeight !== undefined) {
      updatedCriticalConfirm.netWeight = {
        value: netWeight,
        confirmed: true,
        source: "MANUAL",
        confidence: 1.0,
        evidenceSnippet: "User confirmed",
      };
    }

    if (allergens !== undefined) {
      updatedCriticalConfirm.allergens = {
        value: allergens,
        confirmed: true,
        source: "MANUAL",
        confidence: 1.0,
        evidenceSnippet: "User confirmed",
      };
    }

    // Compute new compliance status
    const allConfirmed = 
      updatedCriticalConfirm.originCountry.confirmed &&
      updatedCriticalConfirm.netWeight.confirmed &&
      updatedCriticalConfirm.allergens.confirmed;

    let complianceStatus = "INCOMPLETE";
    const complianceNotes = [];

    if (allConfirmed) {
      // Check if sources are high confidence
      const allHighConfidence = 
        updatedCriticalConfirm.originCountry.confidence >= 0.8 &&
        updatedCriticalConfirm.netWeight.confidence >= 0.8 &&
        updatedCriticalConfirm.allergens.confidence >= 0.8;

      if (allHighConfidence) {
        complianceStatus = "COMPLETE";
        complianceNotes.push({
          level: "info",
          text: "All critical fields confirmed. Compliance check complete.",
        });
      } else {
        complianceStatus = "PRELIMINARY";
        complianceNotes.push({
          level: "info",
          text: "Critical fields confirmed. HS classification preliminary pending higher confidence.",
        });
      }
    } else {
      complianceNotes.push({
        level: "warn",
        text: "Confirm origin, net weight, and allergens for compliance completeness.",
      });
    }

    // Update report
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        critical_confirm: updatedCriticalConfirm,
        compliance_status: complianceStatus,
        compliance_notes: complianceNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[confirm-critical] Update failed:", updateError);
      return NextResponse.json(
        { success: false, error: "UPDATE_FAILED", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Critical fields confirmed",
      criticalConfirm: updatedCriticalConfirm,
      complianceStatus,
      complianceNotes,
    });
  } catch (error: any) {
    console.error("[confirm-critical] Error:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", details: error.message },
      { status: 500 }
    );
  }
}
