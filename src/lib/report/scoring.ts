// @ts-nocheck
// ============================================================================
// Evidence Level and Overall Confidence Scoring
// Model-agnostic, signal-based rules
// ============================================================================

import type { Report } from "./types";

export type EvidenceLevel = "baseline" | "evidence" | "verified";

/**
 * Get verification status from report signals
 */
export function getVerificationStatus(
  report: Report
): "none" | "requested" | "verifying" | "quoted" | "completed" {
  return report.signals?.verificationStatus ?? "none";
}

/**
 * Determine Evidence Level based on signals only
 * Model output is ignored - only signals matter
 */
export function getEvidenceLevel(report: Report): EvidenceLevel {
  const { verificationStatus, hasImportEvidence, hasInternalSimilarRecords } =
    report.signals;

  // Rule A: Verified is highest priority
  if (verificationStatus !== "none") {
    return "verified";
  }

  // Rule B: Evidence if any external/internal proof exists
  if (hasImportEvidence || hasInternalSimilarRecords) {
    return "evidence";
  }

  // Rule C: Baseline is default
  return "baseline";
}

/**
 * Calculate Overall Confidence (0-100) based on signals
 * This is separate from model confidence and used for UI display
 */
export function getOverallConfidence(report: Report): number {
  const hasImportEvidence = report.signals?.hasImportEvidence ?? false;
  const hasInternalSimilarRecords = report.signals?.hasInternalSimilarRecords ?? false;
  const hasSupplierCandidates = report.signals?.hasSupplierCandidates ?? false;
  const verificationStatus = getVerificationStatus(report);

  const categoryConfidence = report.categoryConfidence ?? 0.7;

  // Start at 55
  let score = 55;

  // +10 if category classification is confident
  if (categoryConfidence >= 0.85) {
    score += 10;
  }

  // +15 if import evidence exists
  if (hasImportEvidence) {
    score += 15;
  }

  // +10 if internal similar records exist
  if (hasInternalSimilarRecords) {
    score += 10;
  }

  // +5 if supplier candidates exist
  if (hasSupplierCandidates) {
    score += 5;
  }

  // +20 if verification is quoted or completed
  if (verificationStatus === "quoted" || verificationStatus === "completed") {
    score += 20;
  }

  // Clamp to 35-95
  score = Math.max(35, Math.min(95, score));

  // Apply max caps by evidence level
  const evidenceLevel = getEvidenceLevel(report);
  if (evidenceLevel === "baseline") {
    score = Math.min(75, score);
  } else if (evidenceLevel === "evidence") {
    score = Math.min(88, score);
  } else if (evidenceLevel === "verified") {
    score = Math.min(95, score);
  }

  return Math.round(score);
}

/**
 * Get evidence chips to display based on signals
 */
export function getEvidenceChips(report: Report): string[] {
  const chips: string[] = [];

  // Always show LLM baseline
  chips.push("LLM baseline");

  // Category rules if category confidence is high
  if ((report.categoryConfidence ?? 0) >= 0.7) {
    chips.push("Category rules");
  }

  // Import record if exists
  if (report.signals?.hasImportEvidence) {
    chips.push("Import record");
  }

  // Internal records if exists
  if (report.signals?.hasInternalSimilarRecords) {
    chips.push("Internal records");
  }

  // Network verified if verification is active
  const verificationStatus = getVerificationStatus(report);
  if (verificationStatus !== "none") {
    chips.push("Network verified");
  }

  return chips;
}

/**
 * Get evidence level info for UI display
 */
export interface EvidenceLevelInfo {
  level: EvidenceLevel;
  label: string;
  description: string;
  color: string;
}

export function getEvidenceLevelInfo(report: Report): EvidenceLevelInfo {
  const level = getEvidenceLevel(report);

  const infoMap: Record<EvidenceLevel, EvidenceLevelInfo> = {
    baseline: {
      level: "baseline",
      label: "Baseline",
      description: "Market range from LLM and category signals",
      color: "bg-slate-100 text-slate-700 border-slate-300",
    },
    evidence: {
      level: "evidence",
      label: "Evidence-backed",
      description: "US import records or internal similar records found",
      color: "bg-blue-100 text-blue-700 border-blue-300",
    },
    verified: {
      level: "verified",
      label: "Verified",
      description: "Confirmed quotes from verified factories",
      color: "bg-green-100 text-green-700 border-green-300",
    },
  };

  return infoMap[level];
}

