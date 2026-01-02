// @ts-nocheck
// ============================================================================
// Evidence Level Calculation
// ============================================================================

import type { Report } from "./types";

export type EvidenceLevel = "baseline" | "evidence_backed" | "verified";

export interface EvidenceLevelInfo {
  level: EvidenceLevel;
  label: string;
  description: string;
  chips: string[];
}

/**
 * Calculate evidence level from report data
 * This is the UI-level confidence, separate from model confidence
 */
export function calculateEvidenceLevel(report: Report): EvidenceLevelInfo {
  // Level 3: Verified
  if (
    report.verification.status === "quoted" ||
    report.verification.status === "done"
  ) {
    return {
      level: "verified",
      label: "Verified",
      description: "Confirmed quotes from 3 verified factories",
      chips: ["Network verified", "Factory quotes confirmed"],
    };
  }

  // Level 2: Evidence-backed
  const hasImportRecords = report.baseline.evidence.types.includes(
    "similar_records"
  );
  const hasMultipleEvidence =
    report.baseline.evidence.types.length >= 2 ||
    (hasImportRecords && report.baseline.evidence.types.length >= 1);

  if (hasImportRecords || hasMultipleEvidence) {
    const chips: string[] = [];
    if (hasImportRecords) {
      chips.push("Import record found");
    }
    if (report.baseline.evidence.types.includes("category_based")) {
      chips.push("Category baseline");
    }
    if (report.baseline.evidence.types.includes("regulation_check")) {
      chips.push("Regulation check");
    }

    return {
      level: "evidence_backed",
      label: "Evidence-backed",
      description: "US import records or multiple evidence types found",
      chips,
    };
  }

  // Level 1: Baseline
  const baselineChips: string[] = [];
  if (report.baseline.evidence.types.includes("category_based")) {
    baselineChips.push("Category baseline");
  }
  baselineChips.push("LLM baseline");

  return {
    level: "baseline",
    label: "Baseline",
    description: "Market range from LLM and category signals",
    chips: baselineChips,
  };
}

/**
 * Get overall confidence score (0-100) based on evidence level
 * This is separate from model confidence and used for UI display
 */
export function getOverallConfidence(
  report: Report,
  modelConfidence: "low" | "medium" | "high"
): number {
  const evidenceLevel = calculateEvidenceLevel(report);
  const modelConfidenceScore = {
    low: 40,
    medium: 60,
    high: 80,
  }[modelConfidence];

  // Boost confidence based on evidence level
  const evidenceBoost = {
    baseline: 0,
    evidence_backed: 15,
    verified: 30,
  }[evidenceLevel.level];

  return Math.min(100, modelConfidenceScore + evidenceBoost);
}














