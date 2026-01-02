// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getMockReport } from "@/lib/report/mock";
import {
  buildEvidenceQuery,
  runImportEvidenceLookup,
  normalizeImportEvidence,
  getEvidenceCooldown,
} from "@/lib/report/evidence";
import { getEvidenceLevel } from "@/lib/report/scoring";
import type { Report } from "@/lib/report/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    // Get report (in production, fetch from DB)
    const report = getMockReport(reportId);
    if (!report) {
      return NextResponse.json(
        { ok: false, reason: "not_found", error: "Report not found" },
        { status: 404 }
      );
    }

    // Check verification status
    const verificationStatus = report.signals?.verificationStatus ?? "none";
    if (verificationStatus !== "none") {
      return NextResponse.json(
        { ok: false, reason: "verification_active", error: "Cannot upgrade evidence when verification is active" },
        { status: 400 }
      );
    }

    // Check cooldown
    const evidenceLevel = getEvidenceLevel(report);
    const cooldown = getEvidenceCooldown(report, evidenceLevel);

    if (cooldown.onCooldown) {
      return NextResponse.json(
        {
          ok: false,
          reason: "cooldown",
          retryAfterSeconds: cooldown.retryAfterSeconds,
          error: "Evidence upgrade is on cooldown",
        },
        { status: 429 }
      );
    }

    // Build query and run lookup
    const query = buildEvidenceQuery(report);
    const lookupResult = await runImportEvidenceLookup(query);
    const evidenceItems = normalizeImportEvidence(lookupResult);

    // Update report
    const updatedReport: Report = {
      ...report,
      baseline: {
        ...report.baseline,
        evidence: {
          ...report.baseline.evidence,
          items: evidenceItems,
          lastAttemptAt: new Date().toISOString(),
          lastSuccessAt: evidenceItems.length > 0 ? new Date().toISOString() : report.baseline.evidence.lastSuccessAt,
          lastResult: evidenceItems.length > 0 ? "found" : lookupResult.error ? "error" : "none",
          lastErrorCode: lookupResult.error ? "lookup_failed" : null,
        },
      },
      signals: {
        ...report.signals,
        hasImportEvidence: evidenceItems.length > 0,
      },
    };

    // In production, save to DB here
    // await saveReport(updatedReport);

    return NextResponse.json({
      ok: true,
      report: updatedReport,
    });
  } catch (error) {
    console.error("[Evidence Upgrade API] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        reason: "error",
        errorCode: "internal_error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

