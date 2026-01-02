// @ts-nocheck
/**
 * Single Source of Truth for Report Quality and Input Status
 * All components must consume these functions to prevent contradictions
 */

import type { Report } from "./types";

export interface ReportQuality {
  tier: "preliminary" | "benchmark" | "trade_backed" | "verified";
  label: string;
  reason: string;
}

export interface InputFieldStatus {
  state: "missing" | "uploaded" | "failed" | "confirmed";
  source: "user_input" | "ocr" | "manual" | "none";
  value?: any;
  failureReason?: string;
}

export interface InputStatusStructure {
  productPhoto: InputFieldStatus;
  barcode: InputFieldStatus;
  label: InputFieldStatus;
  unitWeight: InputFieldStatus;
  casePack: InputFieldStatus;
}

/**
 * Compute report quality tier based on evidence and critical input completion
 * This is the ONLY place where quality tier is determined
 * 
 * Rules:
 * 1. If verified quote exists → tier verified
 * 2. Else if tradeMatchCount > 0 → tier trade_backed
 * 3. Else if similarRecordsCount > 0 → tier benchmark
 * 4. Else tier preliminary
 * 
 * Hard downgrade rules:
 * - If critical inputs missing (unitWeight or casePack) → cap at preliminary
 * - If label OCR failed and manual label not completed → cap at preliminary
 */
export function computeReportQuality(report: Report): ReportQuality {
  // Safety: if report is missing critical structure, default to preliminary
  if (!report || !report.baseline) {
    return {
      tier: "preliminary",
      label: "Preliminary estimate",
      reason: "Report incomplete",
    };
  }

  // Start with base tier from evidence
  let baseTier: "preliminary" | "benchmark" | "trade_backed" | "verified" = "preliminary";
  let reason = "Based on category benchmarks";

  // Check verification status first (highest credibility)
  if (report.verification?.status === "quoted" || report.verification?.status === "done") {
    baseTier = "verified";
    reason = "Based on verified supplier quote";
  }
  // Check for trade-backed evidence (from API data - _supplierMatches in API, or check evidenceLevel)
  else if (
    report.evidenceLevel === "exact_import" ||
    report.signals?.hasImportEvidence === true
  ) {
    baseTier = "trade_backed";
    reason = "Based on actual import records";
  }
  // Check for similar import records
  else if (
    report.evidenceLevel === "similar_import" ||
    (report.signals?.hasInternalSimilarRecords === true &&
      !report.signals?.hasImportEvidence)
  ) {
    baseTier = "benchmark";
    reason = "Based on similar product imports";
  }

  // Now apply hard downgrade rules
  const inputStatus = computeInputStatus(report);

  // If critical inputs are missing, cap at preliminary
  if (
    inputStatus.unitWeight.state === "missing" ||
    inputStatus.casePack.state === "missing"
  ) {
    baseTier = "preliminary";
    reason = "Missing critical inputs (weight or case pack)";
  }

  // If label OCR failed and manual label not completed, cap at preliminary
  if (
    report.inputStatus?.labelOcrStatus === "failed" &&
    !report.inputStatus?.labelDetailsEntered
  ) {
    baseTier = "preliminary";
    reason = "Label OCR failed and manual entry incomplete";
  }

  return {
    tier: baseTier,
    label: getLabelForTier(baseTier),
    reason,
  };
}

/**
 * Compute input field statuses
 * Each field has a state (missing/uploaded/failed/confirmed) and source
 */
export function computeInputStatus(report: Report): InputStatusStructure {
  const inputStatus = report.inputStatus || {};
  const assumedUnitsPerCase = inputStatus.unitsPerCase ?? 1;

  return {
    productPhoto: {
      state: inputStatus.productPhotoUploaded ? "uploaded" : "missing",
      source: inputStatus.productPhotoUploaded ? "user_input" : "none",
    },
    barcode: {
      state: inputStatus.barcodePhotoUploaded
        ? inputStatus.barcodeDecoded
          ? "confirmed"
          : "uploaded"
        : "missing",
      source: inputStatus.barcodePhotoUploaded ? "user_input" : "none",
      failureReason: inputStatus.barcodePhotoUploaded
        ? !inputStatus.barcodeDecoded
          ? "Barcode not readable in photo"
          : undefined
        : undefined,
    },
    label: {
      state:
        inputStatus.labelPhotoUploaded === false
          ? "missing"
          : inputStatus.labelOcrStatus === "failed"
            ? "failed"
            : inputStatus.labelPhotoUploaded
              ? "uploaded"
              : "missing",
      source: inputStatus.labelPhotoUploaded ? "user_input" : "none",
      failureReason: inputStatus.labelOcrFailureReason,
    },
    // unitWeight is confirmed ONLY if:
    // - A numeric value exists AND
    // - It came from user input OR manual entry (not from failed OCR)
    unitWeight: {
      state: getUnitWeightState(inputStatus),
      source: getUnitWeightSource(inputStatus),
      value: inputStatus.unitWeight,
    },
    // casePack is confirmed ONLY if numeric value exists from user or manual input
    casePack: {
      state: getCasePackState({ ...inputStatus, unitsPerCase: assumedUnitsPerCase }),
      source: getCasePackSource({ ...inputStatus, unitsPerCase: assumedUnitsPerCase }),
      value: assumedUnitsPerCase,
    },
  };
}

/**
 * Determine unit weight state
 * - "confirmed" ONLY if unitWeight exists from user input or manual entry
 * - "failed" if label OCR failed (cannot trust weight from failed OCR)
 * - "missing" otherwise
 */
function getUnitWeightState(
  inputStatus: Report["inputStatus"]
): "missing" | "uploaded" | "failed" | "confirmed" {
  // If OCR failed, unitWeight cannot be confirmed from label
  if (inputStatus?.labelOcrStatus === "failed") {
    return "failed";
  }

  // If user provided or manual entry provided, it's confirmed
  if (
    (inputStatus?.unitWeight && inputStatus?.unitWeight > 0) &&
    (inputStatus?.labelDetailsEntered?.netWeight ||
      typeof inputStatus?.unitWeight === "number")
  ) {
    return "confirmed";
  }

  // If label was uploaded and OCR succeeded, weight might be extracted
  if (
    inputStatus?.labelPhotoUploaded &&
    inputStatus?.labelOcrStatus === "success" &&
    inputStatus?.unitWeight &&
    inputStatus?.unitWeight > 0
  ) {
    return "confirmed";
  }

  return inputStatus?.unitWeight ? "uploaded" : "missing";
}

/**
 * Determine unit weight source
 */
function getUnitWeightSource(
  inputStatus: Report["inputStatus"]
): "user_input" | "ocr" | "manual" | "none" {
  if (inputStatus?.labelDetailsEntered?.netWeight) {
    return "manual";
  }
  if (
    inputStatus?.labelPhotoUploaded &&
    inputStatus?.labelOcrStatus === "success" &&
    inputStatus?.unitWeight
  ) {
    return "ocr";
  }
  if (inputStatus?.unitWeight) {
    return "user_input";
  }
  return "none";
}

/**
 * Determine case pack state
 * - "confirmed" ONLY if numeric value exists
 * - "missing" otherwise
 */
function getCasePackState(
  inputStatus: Report["inputStatus"]
): "missing" | "uploaded" | "failed" | "confirmed" {
  if (inputStatus?.unitsPerCase && inputStatus?.unitsPerCase > 0) {
    return "confirmed";
  }
  return "missing";
}

/**
 * Determine case pack source
 */
function getCasePackSource(
  inputStatus: Report["inputStatus"]
): "user_input" | "ocr" | "manual" | "none" {
  if (inputStatus?.labelDetailsEntered?.unitsPerCase) {
    return "manual";
  }
  if (inputStatus?.unitsPerCase) {
    return "user_input";
  }
  return "none";
}

/**
 * Get UI label for quality tier
 */
function getLabelForTier(
  tier: "preliminary" | "benchmark" | "trade_backed" | "verified"
): string {
  const labels = {
    preliminary: "Preliminary estimate",
    benchmark: "Benchmark estimate",
    trade_backed: "Trade-backed estimate",
    verified: "Verified quote",
  };
  return labels[tier];
}

/**
 * Determine if compliance messaging should indicate completion
 * Returns true ONLY if label is confirmed or OCR succeeded
 */
export function isComplianceCheckComplete(report: Report): boolean {
  const inputStatus = report.inputStatus || {};

  // If no label uploaded, compliance is incomplete
  if (!inputStatus.labelPhotoUploaded) {
    return false;
  }

  // If OCR succeeded, compliance complete
  if (inputStatus.labelOcrStatus === "success") {
    return true;
  }

  // If OCR failed but manual entry was done (legacy), compliance complete
  if (
    inputStatus.labelOcrStatus === "failed" &&
    inputStatus.labelDetailsEntered
  ) {
    return true;
  }

  // NEW: If Vision extraction was confirmed, compliance complete
  if (
    inputStatus.labelExtractionSource === "VISION" &&
    inputStatus.labelExtractionStatus === "CONFIRMED"
  ) {
    return true;
  }

  // Otherwise, incomplete (OCR failed, Vision draft not confirmed, or pending)
  return false;
}

/**
 * Get compliance messaging based on label state
 */
export function getComplianceMessage(report: Report): {
  message: string;
  isComplete: boolean;
} {
  const inputStatus = report.inputStatus || {};
  const isComplete = isComplianceCheckComplete(report);

  if (!inputStatus.labelPhotoUploaded) {
    return {
      message: "Compliance check pending - label photo needed",
      isComplete: false,
    };
  }

  // OCR failed, Vision draft available but not confirmed
  if (
    inputStatus.labelOcrStatus === "failed" &&
    inputStatus.labelExtractionSource === "VISION" &&
    inputStatus.labelExtractionStatus === "DRAFT"
  ) {
    return {
      message:
        "Compliance check incomplete - confirm 3 critical fields from Vision extraction",
      isComplete: false,
    };
  }

  // OCR failed, Vision confirmed
  if (
    inputStatus.labelOcrStatus === "failed" &&
    inputStatus.labelExtractionSource === "VISION" &&
    inputStatus.labelExtractionStatus === "CONFIRMED"
  ) {
    return {
      message: "Compliance checked against Vision-extracted label data",
      isComplete: true,
    };
  }

  // OCR failed, manual entry done (legacy)
  if (
    inputStatus.labelOcrStatus === "failed" &&
    inputStatus.labelDetailsEntered
  ) {
    return {
      message: "Compliance checked against manually entered label data",
      isComplete: true,
    };
  }

  // OCR failed, no recovery
  if (
    inputStatus.labelOcrStatus === "failed" &&
    !inputStatus.labelDetailsEntered &&
    inputStatus.labelExtractionSource !== "VISION"
  ) {
    return {
      message:
        "Compliance check incomplete - label OCR failed, manual entry needed",
      isComplete: false,
    };
  }

  if (inputStatus.labelOcrStatus === "success") {
    return {
      message: "Compliance checked against label data",
      isComplete: true,
    };
  }

  return {
    message: "Category-based compliance checks only (label not available)",
    isComplete: false,
  };
}

/**
 * Count confirmed missing critical inputs
 * Used for decision card and missing inputs panel
 */
export function countMissingCriticalInputs(report: Report): number {
  const inputStatus = computeInputStatus(report);
  let count = 0;

  if (inputStatus.unitWeight.state === "missing") {
    count++;
  }
  if (inputStatus.casePack.state === "missing") {
    count++;
  }

  return count;
}

/**
 * Get list of missing critical inputs for display
 */
export function getMissingCriticalInputs(
  report: Report
): Array<{ field: string; label: string }> {
  const inputStatus = computeInputStatus(report);
  const missing: Array<{ field: string; label: string }> = [];

  if (inputStatus.unitWeight.state === "missing") {
    missing.push({ field: "unitWeight", label: "Unit weight" });
  }
  if (inputStatus.casePack.state === "missing") {
    missing.push({ field: "casePack", label: "Units per case" });
  }

  return missing;
}
