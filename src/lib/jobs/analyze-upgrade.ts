// @ts-nocheck
/**
 * Analyze Upgrade Job
 * Background job to retry heavy analysis steps and upgrade partial reports to completed
 * Runs after the fast facts extraction is done
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { runIntelligencePipeline } from "@/lib/intelligence-pipeline";
import { buildReportFromPipeline } from "@/lib/report/build-report";

export interface AnalyzeUpgradeJobInput {
  reportId: string;
  requestId: string;
  retryCount?: number;
}

export async function processAnalyzeUpgradeJob(input: AnalyzeUpgradeJobInput): Promise<void> {
  const { reportId, requestId, retryCount = 0 } = input;
  const MAX_RETRIES = 3;

  console.log(`[Upgrade ${requestId}] Starting heavy analysis for report ${reportId} (attempt ${retryCount + 1})`);

  try {
    const supabase = getSupabaseAdmin();

    // Load the report
    const { data: report, error: loadError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (loadError || !report) {
      console.warn(`[Upgrade ${requestId}] Report ${reportId} not found`);
      return;
    }

    const reportData = report as any;

    // Skip if already completed
    if (reportData.status === "completed") {
      console.log(`[Upgrade ${requestId}] Report ${reportId} already completed, skipping`);
      return;
    }

    // Run full intelligence pipeline to complete remaining steps
    // The pipeline will use existing partial results from the report
    const result = await runIntelligencePipeline(
      {
        imageUrl: reportData.pipeline_result?.productImagePath || reportData.image_url,
        imagePublicUrl: reportData.image_url,
        quantity: reportData.data?.quantity || 100,
        dutyRate: reportData.data?.dutyRate || 0.15,
        shippingCost: reportData.data?.shippingCost || 150,
        fee: reportData.data?.fee || 0,
      },
      (msg) => console.log(`[Upgrade ${requestId}] ${msg}`)
    );

    // Build updated report from pipeline result
    const updatedReport = buildReportFromPipeline({
      reportId,
      inputKey: reportData.input_key,
      pipeline: result,
    });

    // Update report to completed with new data
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        status: "completed",
        product_name: updatedReport.productName,
        category: updatedReport.category,
        confidence: updatedReport.confidence,
        signals: updatedReport.signals,
        baseline: updatedReport.baseline,
        data: updatedReport.data,
        pipeline_result: result,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateError) {
      throw updateError;
    }

    console.log(`[Upgrade ${requestId}] Report ${reportId} upgraded to completed`);
  } catch (error: any) {
    console.error(`[Upgrade ${requestId}] Error upgrading report: ${error.message}`);

    // Retry with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const nextRetry = retryCount + 1;
      const delayMs = Math.min(1000 * Math.pow(2, nextRetry), 60000);

      console.log(`[Upgrade ${requestId}] Will retry in ${delayMs}ms (attempt ${nextRetry + 1}/${MAX_RETRIES + 1})`);

      // Schedule next retry
      // TODO: Queue job system - for now just log intent
      // Later this would be: queueJob('analyze-upgrade', input, { delayMs })

      // Update report metadata with last error
      const supabase = getSupabaseAdmin();
      await supabase
        .from("reports")
        .update({
          last_error_code: error.code || "UPGRADE_FAILED",
          last_error_step: "heavy-analysis",
          retry_count: nextRetry,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .catch((dbErr) => {
          console.warn(`[Upgrade ${requestId}] Failed to update report error metadata: ${dbErr.message}`);
        });
    } else {
      console.error(`[Upgrade ${requestId}] Max retries (${MAX_RETRIES}) exceeded for report ${reportId}`);

      // Mark as failed
      const supabase = getSupabaseAdmin();
      await supabase
        .from("reports")
        .update({
          status: "completed", // Keep as completed even with partial data
          last_error_code: "MAX_RETRIES_EXCEEDED",
          last_error_step: "heavy-analysis",
          retry_count: retryCount,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .catch((dbErr) => {
          console.warn(`[Upgrade ${requestId}] Failed to mark report as failed: ${dbErr.message}`);
        });
    }
  }
}

/**
 * Trigger an analyze upgrade job for a report
 * Used by the frontend to manually retry or by the API after fast facts
 */
export async function triggerAnalyzeUpgrade(reportId: string, requestId: string): Promise<void> {
  console.log(`[Upgrade ${requestId}] Queuing upgrade job for report ${reportId}`);

  // TODO: Queue system - for now just process immediately
  // Later: queueJob('analyze-upgrade', { reportId, requestId, retryCount: 0 })
  try {
    await processAnalyzeUpgradeJob({ reportId, requestId, retryCount: 0 });
  } catch (error) {
    console.warn(`[Upgrade ${requestId}] Failed to queue upgrade: ${error}`);
  }
}
