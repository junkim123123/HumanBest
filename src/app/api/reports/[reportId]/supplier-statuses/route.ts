// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await ctx.params;

    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();

    // Find active sourcing jobs for this report
    const { data: jobs } = await admin
      .from("sourcing_jobs")
      .select("id")
      .eq("report_id", reportId)
      .eq("user_id", user.id)
      .in("status", ["pending", "outreach_sent", "replies_received", "quotes_confirmed"]);

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        statuses: {},
      });
    }

    const jobIds = jobs.map((j: any) => j.id);

    // Fetch job suppliers with statuses
    const { data: jobSuppliers } = await admin
      .from("sourcing_job_suppliers")
      .select("id, supplier_id, status")
      .in("sourcing_job_id", jobIds);

    // Build status map from job suppliers
    const statusMap: Record<string, any> = {};
    (jobSuppliers || []).forEach((js: any) => {
      statusMap[js.supplier_id] = {
        status: js.status,
        has_quote: false,
        confirmed_in_writing: false,
        validation_status: null,
      };
    });

    // Fetch quotes and update status map
    if (jobSuppliers && jobSuppliers.length > 0) {
      const jobSupplierIds = jobSuppliers.map((js: any) => js.id);
      const { data: quotes } = await admin
        .from("supplier_quotes")
        .select("sourcing_job_supplier_id, supplier_id, confirmed_in_writing, validation_status")
        .in("sourcing_job_supplier_id", jobSupplierIds);

      // Update status map with quote information
      (quotes || []).forEach((quote: any) => {
        const jobSupplier = jobSuppliers.find((js: any) => js.id === quote.sourcing_job_supplier_id);
        if (jobSupplier && statusMap[jobSupplier.supplier_id]) {
          statusMap[jobSupplier.supplier_id] = {
            ...statusMap[jobSupplier.supplier_id],
            has_quote: true,
            confirmed_in_writing: quote.confirmed_in_writing || false,
            validation_status: quote.validation_status || null,
          };
        }
      });
    }

    return NextResponse.json({
      success: true,
      statuses: statusMap,
    });
  } catch (error) {
    console.error("[SupplierStatuses API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

