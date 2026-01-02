// @ts-nocheck
// ============================================================================
// Evidence Lookup and Normalization
// Model-agnostic evidence discovery from import records
// ============================================================================

import type { Report, EvidenceItem } from "./types";

export interface EvidenceQuery {
  productName: string;
  category: string;
  keywords: string[];
  hsCandidates: string[];
  brandText?: string;
}

/**
 * Build evidence query from report
 */
export function buildEvidenceQuery(report: Report): EvidenceQuery {
  const hsCandidates: string[] = [];
  
  // Extract HS codes from risk flags
  if (report.baseline.riskFlags.tariff.hsCodeRange) {
    hsCandidates.push(...report.baseline.riskFlags.tariff.hsCodeRange);
  }

  // Extract keywords from summary and category
  const keywords: string[] = [];
  if (report.summary) {
    // Simple keyword extraction (can be enhanced)
    const words = report.summary
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["with", "from", "that", "this", "have", "been"].includes(w))
      .slice(0, 10);
    keywords.push(...words);
  }
  keywords.push(report.category.toLowerCase());

  return {
    productName: report.productName,
    category: report.category,
    keywords,
    hsCandidates,
  };
}

/**
 * Run import evidence lookup (mock implementation)
 * In production, this would query Supabase or external import record APIs
 */
export async function runImportEvidenceLookup(
  query: EvidenceQuery
): Promise<{ items: EvidenceItem[]; error?: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock logic: return evidence if keywords contain certain terms
  const hasStrongMatch = query.keywords.some((k) =>
    ["toy", "candy", "jelly", "plush", "figure", "electronic"].includes(k)
  );

  if (!hasStrongMatch) {
    return { items: [] };
  }

  // Generate mock evidence items
  const items: EvidenceItem[] = [
    {
      id: `ev_${Date.now()}_1`,
      source: "us_import_records",
      title: "Similar import activity observed",
      summary: `Recent imports of ${query.category} products with similar characteristics found in US import records.`,
      strength: "medium",
      observed: {
        lastSeenDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        likelyOrigins: ["China", "Vietnam", "Thailand"],
        typicalLotRange: {
          min: 500,
          max: 5000,
          unit: "units",
        },
        matchedBy: query.hsCandidates.length > 0 ? ["hs", "keywords"] : ["keywords", "category"],
      },
    },
  ];

  // Add second item if category is specific
  if (query.category === "toy" || query.category === "hybrid") {
    items.push({
      id: `ev_${Date.now()}_2`,
      source: "us_import_records",
      title: "Category pattern match",
      summary: "Import patterns consistent with similar products in this category.",
      strength: "low",
      observed: {
        lastSeenDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        likelyOrigins: ["China"],
        typicalLotRange: {
          min: 1000,
          max: 10000,
          unit: "units",
        },
        matchedBy: ["category"],
      },
    });
  }

  return { items };
}

/**
 * Normalize raw import evidence into EvidenceItem array
 */
export function normalizeImportEvidence(
  raw: { items: EvidenceItem[]; error?: string }
): EvidenceItem[] {
  if (raw.error) {
    return [];
  }
  return raw.items;
}

/**
 * Check if evidence upgrade is on cooldown
 */
export function getEvidenceCooldown(
  report: Report,
  evidenceLevel: "baseline" | "evidence" | "verified"
): { onCooldown: boolean; retryAfterSeconds: number | null } {
  const { lastAttemptAt, lastSuccessAt } = report.baseline.evidence;

  // If verified, no upgrade allowed
  if (evidenceLevel === "verified") {
    return { onCooldown: true, retryAfterSeconds: null };
  }

  const now = Date.now();

  // Check last attempt cooldown (12 hours for baseline, 24 hours for evidence)
  if (lastAttemptAt) {
    const attemptTime = new Date(lastAttemptAt).getTime();
    const cooldownHours = evidenceLevel === "baseline" ? 12 : 24;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const elapsed = now - attemptTime;

    if (elapsed < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - elapsed) / 1000);
      return { onCooldown: true, retryAfterSeconds: retryAfter };
    }
  }

  // Check last success cooldown (24 hours if evidence already exists)
  if (evidenceLevel === "evidence" && lastSuccessAt) {
    const successTime = new Date(lastSuccessAt).getTime();
    const cooldownMs = 24 * 60 * 60 * 1000;
    const elapsed = now - successTime;

    if (elapsed < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - elapsed) / 1000);
      return { onCooldown: true, retryAfterSeconds: retryAfter };
    }
  }

  return { onCooldown: false, retryAfterSeconds: null };
}

/**
 * Format cooldown time for display
 */
export function formatCooldownTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ============================================================================
// Normalized evidence for uploads and extractions (barcode, label, weight, origin)
// ============================================================================

export type EvidenceMethod = "OCR" | "VISION" | null;
export type WeightSource = "USER_INPUT" | "LABEL_TEXT" | "OCR" | "VISION_INFERENCE" | "DEFAULT" | null;
export type OriginSource = "LABEL_TEXT" | "OCR" | "VISION" | "USER_INPUT" | null;

export interface NormalizedEvidence {
  barcode: {
    uploaded: boolean;
    detected: boolean;
    value: string | null;
    method: EvidenceMethod;
    failureReason: string | null;
  };
  label: {
    uploaded: boolean;
    extracted: boolean;
    rawText: string | null;
    terms: string[];
    method: EvidenceMethod;
    failureReason: string | null;
  };
  weight: {
    grams: number | null;
    source: WeightSource;
  };
  origin: {
    countryCode: string | null;
    source: OriginSource;
  };
}

const toCleanTerms = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const toNumberOrNull = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return n;
};

export function normalizeEvidence(report: any): NormalizedEvidence {
  const reportAny = report || {};
  const pipelineResult = reportAny.pipeline_result || {};
  const uploadAudit =
    pipelineResult.uploadAudit ||
    reportAny.uploadAudit ||
    reportAny.data?.uploadAudit ||
    {};
  const inputStatus =
    reportAny._proof?.inputStatus ||
    reportAny.inputStatus ||
    reportAny.data?.inputStatus ||
    {};
  const storedEvidence =
    reportAny.evidenceNormalized ||
    reportAny.data?.evidenceNormalized ||
    pipelineResult.evidenceNormalized;

  const labelAudit = pipelineResult.label_audit || {};
  const labelData = pipelineResult.analysis?.labelData || {};
  const labelDraft = inputStatus.labelDraft || reportAny._draft?.labelDraft || {};
  const inferredInputs = reportAny.baseline?.evidence?.inferredInputs || {};

  const labelExtractionSource: EvidenceMethod =
    storedEvidence?.label?.method ??
    (reportAny as any).label_extraction_source ??
    (pipelineResult as any).label_extraction_source ??
    inputStatus.labelExtractionSource ??
    null;

  const barcodeValue =
    storedEvidence?.barcode?.value ??
    inputStatus.barcode ??
    reportAny.upc ??
    reportAny.barcodeValue ??
    pipelineResult?.analysis?.barcode ??
    null;

  const barcodeUploaded =
    storedEvidence?.barcode?.uploaded ??
    Boolean(
      inputStatus.barcodePhotoUploaded ??
        uploadAudit.barcodeImage ??
        uploadAudit.barcodePhotoUploaded ??
        reportAny.hasBarcodeImage ??
        reportAny.data?.barcode_image_url
    );

  const barcodeDetected = storedEvidence?.barcode?.detected ?? Boolean(barcodeValue);
  const barcodeMethod: EvidenceMethod = storedEvidence?.barcode?.method ?? (inputStatus.barcodeExtractionSource ? (inputStatus.barcodeExtractionSource === "OCR" ? "OCR" : "VISION") : null);
  const barcodeFailureReason = storedEvidence?.barcode?.failureReason ?? inputStatus.barcodeFailureReason ?? (barcodeUploaded && !barcodeDetected ? (inputStatus.barcodeExtractionStatus === "FAILED" ? inputStatus.barcodeExtractionFailureReason || "UNREADABLE" : "UNREADABLE") : null);

  const termsFromAudit = toCleanTerms(labelAudit.labelTerms);
  const termsFromLabel = toCleanTerms(labelData.ingredients).concat(toCleanTerms(labelData.allergens || labelData.material || labelData.terms));
  const labelTerms = storedEvidence?.label?.terms ?? (termsFromAudit.length > 0 ? termsFromAudit : termsFromLabel);
  const rawText = storedEvidence?.label?.rawText ?? (typeof labelData.rawText === "string" ? labelData.rawText : typeof labelData.text === "string" ? labelData.text : null);

  const labelUploaded =
    storedEvidence?.label?.uploaded ??
    Boolean(
      inputStatus.labelPhotoUploaded ??
        uploadAudit.labelImage ??
        uploadAudit.labelPhotoUploaded ??
        reportAny.hasLabelImage ??
        reportAny.data?.label_image_url
    );

  const labelExtracted = storedEvidence?.label?.extracted ?? Boolean(labelTerms.length > 0 || rawText);
  const labelFailureReason =
    storedEvidence?.label?.failureReason ??
    labelAudit.labelOcrFailureReason ??
    (reportAny as any).label_ocr_failure_reason ??
    inputStatus.labelOcrFailureReason ??
    null;

  const labelMethod: EvidenceMethod = labelExtractionSource ?? (inputStatus.labelOcrStatus === "success" || inputStatus.labelOcrStatus === "SUCCESS" ? "OCR" : labelExtracted ? "VISION" : null);

  const userWeight = toNumberOrNull(reportAny.weightConfirmed?.value ?? inputStatus.unitWeight);
  const labelWeight = toNumberOrNull(labelData.netWeight ?? labelDraft?.netWeightDraft?.value);
  const inferredWeight = toNumberOrNull(reportAny.productSignalEvidence?.netWeightG?.value ?? reportAny.productSignalEvidence?.netWeightG ?? pipelineResult?.analysis?.weight);
  const defaultWeight = toNumberOrNull(inferredInputs?.unitWeightG?.value);

  const weightGrams =
    storedEvidence?.weight?.grams ??
    userWeight ??
    labelWeight ??
    inferredWeight ??
    defaultWeight ??
    null;

  let weightSource: WeightSource = storedEvidence?.weight?.source ?? null;
  if (!weightSource) {
    if (userWeight) {
      weightSource = "USER_INPUT";
    } else if (labelWeight) {
      weightSource = labelMethod === "OCR" ? "OCR" : "LABEL_TEXT";
    } else if (inferredWeight) {
      weightSource = "VISION_INFERENCE";
    } else if (defaultWeight) {
      weightSource = "DEFAULT";
    }
  }

  const originCountry =
    storedEvidence?.origin?.countryCode ??
    inputStatus.originCountry ??
    inputStatus.countryOfOrigin ??
    labelDraft?.originCountryDraft?.value ??
    labelData?.originCountry ??
    reportAny.countryOfOrigin ??
    reportAny.originCountry ??
    null;

  let originSource: OriginSource = storedEvidence?.origin?.source ?? null;
  if (!originSource && originCountry) {
    if (inputStatus.originCountry || inputStatus.countryOfOrigin) {
      originSource = "USER_INPUT";
    } else if (labelData.originCountry || labelDraft?.originCountryDraft?.value) {
      originSource = labelMethod === "OCR" ? "LABEL_TEXT" : "VISION";
    }
  }

  return {
    barcode: {
      uploaded: Boolean(barcodeUploaded),
      detected: Boolean(barcodeDetected),
      value: barcodeValue ? String(barcodeValue) : null,
      method: barcodeMethod,
      failureReason: barcodeFailureReason ?? null,
    },
    label: {
      uploaded: Boolean(labelUploaded),
      extracted: Boolean(labelExtracted),
      rawText: rawText || null,
      terms: labelTerms,
      method: labelMethod,
      failureReason: labelFailureReason ?? null,
    },
    weight: {
      grams: weightGrams,
      source: weightSource ?? null,
    },
    origin: {
      countryCode: originCountry || null,
      source: originSource ?? null,
    },
  };
}













