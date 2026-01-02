// @ts-nocheck
/**
 * Fast Analyze Helper
 * Logic for creating partial reports quickly and queueing background upgrades
 */

import { extractFastFacts } from "@/lib/intelligence-pipeline-fast";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { triggerAnalyzeUpgrade } from "@/lib/jobs/analyze-upgrade";

export interface FastAnalyzeParams {
  reportId: string;
  userId: string;
  imageDataUrl: string;
  barcodeDataUrl: string;
  labelDataUrl: string;
  requestId: string;
}

/**
 * Create a partial report with fast facts and queue background upgrade
 * Returns in < 1 second with basic extracted information
 */
export async function createPartialReportAndQueueUpgrade(params: FastAnalyzeParams) {
  const { reportId, userId, imageDataUrl, barcodeDataUrl, labelDataUrl, requestId } = params;

  console.log(`[FastAnalyze ${requestId}] Creating partial report for ${reportId}`);
  const startTime = Date.now();

  try {
    // Extract fast facts (should be < 500ms total)
    const facts = await extractFastFacts(imageDataUrl, barcodeDataUrl, labelDataUrl, requestId);

    console.log(`[FastAnalyze ${requestId}] Fast facts extracted in ${Date.now() - startTime}ms`);

    // Update report with partial status and facts
    const supabase = getSupabaseAdmin();

    const partialPipelineResult = {
      queued: true,
      phase: "fast_facts",
      extractedAt: facts.extractedAt,
      fastFacts: {
        productName: facts.productName,
        description: facts.description,
        category: facts.category,
        barcode: facts.barcode,
        labelText: facts.labelText,
        netWeight: facts.netWeight,
        keywords: facts.keywords,
        confidence: facts.confidence,
      },
      analysis: {
        productName: facts.productName,
        description: facts.description,
        category: facts.category,
        keywords: facts.keywords,
        confidence: facts.confidence,
        barcode: facts.barcode,
      },
    };

    const { error: updateError } = await supabase
      .from("reports")
      .update({
        status: "partial",
        product_name: facts.productName,
        category: facts.category,
        confidence: facts.confidence,
        pipeline_result: partialPipelineResult,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", userId);

    if (updateError) {
      console.error(`[FastAnalyze ${requestId}] Failed to update report with partial data:`, updateError.message);
      throw updateError;
    }

    console.log(
      `[FastAnalyze ${requestId}] Partial report created in ${Date.now() - startTime}ms, queuing upgrade...`
    );

    // Queue background upgrade job (non-blocking)
    // In a production system, this would be queued to a job processor (Bull, RabbitMQ, etc.)
    // For now, we trigger it asynchronously without waiting
    triggerAnalyzeUpgrade(reportId, requestId).catch((err) => {
      console.warn(`[FastAnalyze ${requestId}] Failed to trigger background upgrade: ${err}`);
    });

    return {
      success: true,
      reportId,
      status: "partial",
      facts,
      message: "Fast facts extracted. AI is analyzing in background.",
    };
  } catch (error) {
    console.error(`[FastAnalyze ${requestId}] Error creating partial report:`, error);
    
    // Update report to failed state
    const supabase = getSupabaseAdmin();
    await supabase
      .from("reports")
      .update({
        status: "failed",
        last_error_code: error instanceof Error ? error.name : "FAST_ANALYZE_FAILED",
        last_error_step: "fast_facts_extraction",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", userId)
      .catch((dbErr) => {
        console.warn(`[FastAnalyze ${requestId}] Failed to mark report as failed: ${dbErr}`);
      });

    throw error;
  }
}
