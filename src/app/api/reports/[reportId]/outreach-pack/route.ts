// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateOutreachPack } from "@/lib/server/sourcing-copilot";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await ctx.params;
    const body = await req.json();
    const { action } = body;

    // Verify user is authenticated (free action, but still needs auth)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();

    // Fetch report
    const { data: reportData, error: reportError } = await admin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError || !reportData) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    // Get first supplier match for generating pack (can be enhanced to generate for all)
    const { data: supplierMatches } = await admin
      .from("product_supplier_matches")
      .select("*")
      .eq("report_id", reportId)
      .limit(1);

    if (!supplierMatches || supplierMatches.length === 0) {
      return NextResponse.json(
        { success: false, error: "No supplier matches found" },
        { status: 404 }
      );
    }

    const supplier = supplierMatches[0];
    const report = reportData as any;

    // Generate outreach pack
    const pack = await generateOutreachPack(supplier, report);

    // Return based on action type
    if (action === "copy_message") {
      return NextResponse.json({
        success: true,
        outreach_message: pack.outreach_message,
      });
    } else if (action === "questions_checklist") {
      return NextResponse.json({
        success: true,
        questions_checklist: pack.questions_checklist,
      });
    } else if (action === "spec_summary") {
      return NextResponse.json({
        success: true,
        spec_summary: pack.spec_summary,
      });
    } else {
      // Return full pack
      return NextResponse.json({
        success: true,
        ...pack,
      });
    }
  } catch (error) {
    console.error("[OutreachPack API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}








