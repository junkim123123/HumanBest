// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parseSupplierReply } from "@/lib/server/sourcing-copilot";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await ctx.params;
    const body = await req.json();
    const { message_body, supplier_id, conversation_id, message_id } = body;

    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!message_body || !supplier_id) {
      return NextResponse.json(
        { success: false, error: "message_body and supplier_id are required" },
        { status: 400 }
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

    // Fetch supplier
    const { data: supplierMatch } = await admin
      .from("product_supplier_matches")
      .select("*")
      .eq("report_id", reportId)
      .eq("supplier_id", supplier_id)
      .single();

    if (!supplierMatch) {
      return NextResponse.json(
        { success: false, error: "Supplier not found in report" },
        { status: 404 }
      );
    }

    // Parse the reply using AI
    const parsed = await parseSupplierReply(
      message_body,
      supplierMatch,
      reportData
    );

    // Find the sourcing job supplier
    const { data: jobSupplier } = await admin
      .from("sourcing_job_suppliers")
      .select("id, sourcing_job_id")
      .eq("supplier_id", supplier_id)
      .single();

    if (!jobSupplier) {
      return NextResponse.json(
        { success: false, error: "Sourcing job supplier not found" },
        { status: 404 }
      );
    }

    // Update message with parsed data if message_id provided
    if (message_id) {
      await admin
        .from("supplier_messages")
        .update({
          parsed_data: parsed,
        })
        .eq("id", message_id);
    }

    // Update job supplier status
    let newStatus = "reply_received";
    if (parsed.missing_fields.length > 0) {
      newStatus = "needs_followup";
    } else {
      newStatus = "parsed";
    }

    await admin
      .from("sourcing_job_suppliers")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobSupplier.id);

    // Create or update supplier quote
    // Check if quote already exists
    const { data: existingQuote } = await admin
      .from("supplier_quotes")
      .select("id")
      .eq("sourcing_job_supplier_id", jobSupplier.id)
      .maybeSingle();

    const quoteData = {
      sourcing_job_supplier_id: jobSupplier.id,
      message_id: message_id || null,
      supplier_id: supplier_id,
      price_per_unit: parsed.price_per_unit,
      currency: parsed.currency || "USD",
      incoterm: parsed.incoterm,
      moq: parsed.moq,
      lead_time_days: parsed.lead_time_days,
      payment_terms: parsed.payment_terms,
      packaging_notes: parsed.packaging_notes,
      missing_fields: parsed.missing_fields,
      followup_message: parsed.followup_message,
      confirmed_in_writing: false, // Must be manually confirmed
      validation_status: parsed.missing_fields.length > 0 ? "needs_review" : "pending",
      updated_at: new Date().toISOString(),
    };

    if (existingQuote) {
      // Update existing quote
      await admin
        .from("supplier_quotes")
        .update(quoteData)
        .eq("id", existingQuote.id);
    } else {
      // Create new quote
      await admin
        .from("supplier_quotes")
        .insert({
          ...quoteData,
          created_at: new Date().toISOString(),
        });
    }

    // Run validation checks
    const validationStatus = determineValidationStatus(parsed);
    await admin
      .from("supplier_quotes")
      .update({
        validation_status: validationStatus,
      })
      .eq("sourcing_job_supplier_id", jobSupplier.id);

    return NextResponse.json({
      success: true,
      parsed,
      status: newStatus,
      validation_status: validationStatus,
    });
  } catch (error) {
    console.error("[ParseReply API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function determineValidationStatus(parsed: any): "pending" | "valid" | "invalid" | "needs_review" {
  if (parsed.missing_fields.length > 3) {
    return "invalid";
  }
  if (parsed.missing_fields.length > 0) {
    return "needs_review";
  }
  if (
    parsed.price_per_unit &&
    parsed.moq &&
    parsed.lead_time_days &&
    parsed.currency
  ) {
    return "valid";
  }
  return "pending";
}








