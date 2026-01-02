// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await ctx.params;
  const body = await request.json();
  const admin = getSupabaseAdmin();

  try {
    // Fetch current report
    const { data: reportData, error: fetchError } = await admin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !reportData) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Update with new label details
    const updatedData = reportData.data || {};
    updatedData.labelDetailsEntered = {
      ...body,
      enteredAt: new Date().toISOString(),
    };

    const { error } = await (admin
      .from("reports") as any)
      .update({
        data: updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      console.error("[Manual Label] Update error:", error);
      return NextResponse.json(
        { error: "Failed to save label details" },
        { status: 500 }
      );
    }

    // Recalculate cost if netWeight is provided
    if (body.netWeight && reportData.baseline) {
      const unitWeightKg = body.netWeight / 1000;
      const shippingPerUnit = 20 * unitWeightKg; // Simplified

      const updatedBaseline = JSON.parse(JSON.stringify(reportData.baseline));
      if (updatedBaseline.costRange?.standard) {
        updatedBaseline.costRange.standard.shippingPerUnit = shippingPerUnit;
      }

      await (admin
        .from("reports") as any)
        .update({
          baseline: updatedBaseline,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Manual Label] Error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
