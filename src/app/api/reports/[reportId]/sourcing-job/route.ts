// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSourcingJob, generateOutreachPack } from "@/lib/server/sourcing-copilot";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await ctx.params;
    const body = await req.json();
    const { supplier_ids } = body;

    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO: Check if user has paid subscription
    // For now, allow all authenticated users

    if (!supplier_ids || !Array.isArray(supplier_ids) || supplier_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "supplier_ids array is required" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // Verify report exists
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

    // Create sourcing job
    const jobId = await createSourcingJob(
      admin,
      reportId,
      user.id,
      supplier_ids
    );

    // Fetch supplier matches to generate outreach packs
    const { data: suppliers } = await admin
      .from("product_supplier_matches")
      .select("*")
      .eq("report_id", reportId)
      .in("supplier_id", supplier_ids);

    // Generate outreach packs and update job suppliers
    const updates = await Promise.all(
      (suppliers || []).map(async (supplier: any) => {
        try {
          const pack = await generateOutreachPack(supplier, reportData);
          
          // Get job supplier ID
          const { data: jobSupplier } = await admin
            .from("sourcing_job_suppliers")
            .select("id")
            .eq("sourcing_job_id", jobId)
            .eq("supplier_id", supplier.supplier_id)
            .single();

          if (jobSupplier) {
            // Update with outreach pack
            await admin
              .from("sourcing_job_suppliers")
              .update({
                outreach_pack: pack,
                status: "outreach_sent", // Assuming outreach is sent immediately
                updated_at: new Date().toISOString(),
              })
              .eq("id", jobSupplier.id);

            // TODO: Actually send the email (integrate with email service)
            // For now, we just mark it as outreach_sent
          }
        } catch (error) {
          console.error(`[SourcingJob] Failed to generate pack for ${supplier.supplier_id}:`, error);
        }
      })
    );

    // Update job status
    await admin
      .from("sourcing_jobs")
      .update({
        status: "outreach_sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return NextResponse.json({
      success: true,
      job_id: jobId,
      message: "Sourcing job created and outreach packs generated",
    });
  } catch (error) {
    console.error("[SourcingJob API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}








