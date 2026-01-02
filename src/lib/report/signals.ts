// @ts-nocheck
/**
 * ProductSignals - Unified signals object built from uploads
 * Can be constructed without Step 1 Gemini product analysis success
 */

export type EvidenceLabel = "verified_upload" | "verified_barcode" | "verified_label" | "vision" | "user" | "assumption";

export interface EvidenceDetail {
  source: EvidenceLabel;
  confidence?: number;
}

export type CategoryHint = "food_candy" | "toys" | "electronics" | "apparel" | "general_merch";

export interface ProductSignals {
  categoryHint?: CategoryHint;
  keywords: string[];
  brand?: string;
  model?: string;
  upc?: string;
  netWeightG?: number;
  unitCount?: number;
  materials?: string[];
  warnings?: string[];
  originLabel?: string;
  powerInfo?: {
    voltage?: string;
    wattage?: string;
    battery?: boolean;
  };
}

export type ProductSignalEvidence = Record<keyof ProductSignals, EvidenceDetail>;

export interface ProductSignalsResult {
  signals: ProductSignals;
  evidence: ProductSignalEvidence;
  debug: {
    sourcesUsed: string[];
  };
}

export interface BarcodesExtractionInput {
  upc?: string;
  rawText?: string;
  success: boolean;
}

export interface LabelExtractionInput {
  terms: string[];
  brand?: string;
  model?: string;
  netWeightG?: number;
  origin?: string;
  warnings?: string[];
  materials?: string[];
  unitCount?: number;
  success: boolean;
}

/**
 * Normalize keywords: lowercase, trim, dedupe, remove very short tokens
 */
function normalizeKeywords(raw: string[]): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const normalized = raw
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length >= 3 || k === "usb")
    .filter((k) => k.length > 0);

  // Dedupe while preserving order
  const seen = new Set<string>();
  return normalized.filter((k) => {
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Build ProductSignals from upload extraction results
 * Does NOT require Step 1 Gemini product analysis to succeed
 * 
 * Accepts:
 * - barcodeExtraction: OCR result from barcode
 * - barcodeVisionResult: Vision fallback for barcode
 * - labelExtraction: OCR result from label
 * - labelVisionResult: Vision fallback for label
 * - visionTags: Keywords from vision analysis
 * - weightInferenceG: Inferred weight
 * - step1Keywords: Keywords from Step 1 Gemini analysis (optional)
 */
export function buildSignalsFromUploads(input: {
  barcodeExtraction?: BarcodesExtractionInput;
  barcodeVisionResult?: any;
  labelExtraction?: LabelExtractionInput;
  labelVisionResult?: any;
  visionTags?: string[];
  weightInferenceG?: number;
  step1Keywords?: string[];
}): ProductSignalsResult {
  const { 
    barcodeExtraction, 
    barcodeVisionResult,
    labelExtraction, 
    labelVisionResult,
    visionTags = [], 
    weightInferenceG,
    step1Keywords = [],
  } = input;

  const signals: ProductSignals = {
    keywords: [],
  };

  const evidence: Partial<ProductSignalEvidence> = {};
  const sourcesUsed: string[] = [];

  // =========== Barcode extraction (OCR first, fallback to Vision) ===========
  if (barcodeExtraction?.success && barcodeExtraction.upc) {
    signals.upc = barcodeExtraction.upc;
    evidence.upc = { source: "verified_barcode", confidence: 0.9 };
    sourcesUsed.push("barcode_ocr");
  } else if (barcodeVisionResult?.success && barcodeVisionResult.upc) {
    signals.upc = barcodeVisionResult.upc;
    evidence.upc = { source: "verified_barcode", confidence: barcodeVisionResult.confidence ?? 0.8 };
    sourcesUsed.push("barcode_vision");
  }

  // =========== Label extraction (OCR first, fallback to Vision) ===========
  if (labelExtraction?.success) {
    sourcesUsed.push("label_ocr");

    if (labelExtraction.brand) {
      signals.brand = labelExtraction.brand;
      evidence.brand = { source: "verified_label", confidence: labelExtraction.brand_confidence || 0.8 };
    }

    if (labelExtraction.model) {
      signals.model = labelExtraction.model;
      evidence.model = { source: "verified_label", confidence: labelExtraction.model_confidence || 0.8 };
    }

    if (labelExtraction.netWeightG) {
      signals.netWeightG = labelExtraction.netWeightG;
      evidence.netWeightG = { source: "verified_label", confidence: labelExtraction.netWeight_confidence || 0.8 };
    }

    if (labelExtraction.origin) {
      signals.originLabel = labelExtraction.origin;
      evidence.originLabel = { source: "verified_label", confidence: labelExtraction.origin_confidence || 0.8 };
    }

    if (labelExtraction.warnings && labelExtraction.warnings.length > 0) {
      signals.warnings = labelExtraction.warnings;
      evidence.warnings = { source: "verified_label", confidence: 0.7 };
    }

    if (labelExtraction.materials && labelExtraction.materials.length > 0) {
      signals.materials = labelExtraction.materials;
      evidence.materials = { source: "verified_label", confidence: 0.7 };
    }

    if (labelExtraction.unitCount) {
      signals.unitCount = labelExtraction.unitCount;
      evidence.unitCount = { source: "verified_label", confidence: 0.7 };
    }

    // Extract keywords from label terms
    const labelKeywords = normalizeKeywords(labelExtraction.terms);
    signals.keywords = labelKeywords;
    evidence.keywords = { source: "verified_label", confidence: 0.75 };
  } else if (labelVisionResult?.success) {
    // Fallback to Vision extraction for label
    sourcesUsed.push("label_vision");

    if (labelVisionResult.brand) {
      signals.brand = labelVisionResult.brand;
      evidence.brand = { source: "vision", confidence: 0.5 };
    }

    if (labelVisionResult.model) {
      signals.model = labelVisionResult.model;
      evidence.model = { source: "vision", confidence: 0.5 };
    }

    if (labelVisionResult.netWeightG) {
      signals.netWeightG = labelVisionResult.netWeightG;
      evidence.netWeightG = { source: "vision", confidence: 0.5 };
    }

    if (labelVisionResult.origin) {
      signals.originLabel = labelVisionResult.origin;
      evidence.originLabel = { source: "vision", confidence: 0.5 };
    }

    if (labelVisionResult.warnings && labelVisionResult.warnings.length > 0) {
      signals.warnings = labelVisionResult.warnings;
      evidence.warnings = { source: "vision", confidence: 0.5 };
    }

    if (labelVisionResult.materials && labelVisionResult.materials.length > 0) {
      signals.materials = labelVisionResult.materials;
      evidence.materials = { source: "vision", confidence: 0.5 };
    }

    if (labelVisionResult.unitCount) {
      signals.unitCount = labelVisionResult.unitCount;
      evidence.unitCount = { source: "vision", confidence: 0.5 };
    }

    const visionKeywords = normalizeKeywords(labelVisionResult.terms || []);
    signals.keywords = visionKeywords;
    evidence.keywords = { source: "vision", confidence: 0.5 };
  }

  // =========== Vision tags (low priority, merge with existing keywords) ===========
  if (visionTags && visionTags.length > 0) {
    sourcesUsed.push("vision_tags");
    const visionKeywords = normalizeKeywords(visionTags);
    // Merge with existing keywords (dedupe)
    const merged = new Set([...signals.keywords, ...visionKeywords]);
    signals.keywords = Array.from(merged);
    // Only mark as vision if we didn't already have keywords from higher-priority sources
    if (!evidence.keywords) {
      evidence.keywords = { source: "vision", confidence: 0.35 };
    }
  }

  // =========== Step 1 Keywords (lowest priority, always merge) ===========
  if (step1Keywords && step1Keywords.length > 0) {
    sourcesUsed.push("step1_keywords");
    const step1Normalized = normalizeKeywords(step1Keywords);
    // Merge with existing keywords (dedupe)
    const merged = new Set([...signals.keywords, ...step1Normalized]);
    signals.keywords = Array.from(merged);
    // Only mark keywords as model_inferred if we didn't already have evidence
    if (!evidence.keywords) {
      evidence.keywords = { source: "user", confidence: 0.4 };
    }
  }

  // =========== Weight inference ===========
  if (!signals.netWeightG && weightInferenceG) {
    signals.netWeightG = weightInferenceG;
    evidence.netWeightG = { source: "vision", confidence: 0.35 };
    sourcesUsed.push("weight_inference");
  }

  // Ensure keywords always exists
  if (!signals.keywords) {
    signals.keywords = [];
    evidence.keywords = { source: "assumption", confidence: 0.2 };
  }

  // Fill in missing evidence entries with assumption
  const allFields: (keyof ProductSignals)[] = [
    "categoryHint",
    "keywords",
    "brand",
    "model",
    "upc",
    "netWeightG",
    "unitCount",
    "materials",
    "warnings",
    "originLabel",
    "powerInfo",
  ];

  for (const field of allFields) {
    if (signals[field] !== undefined && !evidence[field]) {
      (evidence as any)[field] = { source: "assumption", confidence: 0.2 };
    }
  }

  return {
    signals,
    evidence: evidence as ProductSignalEvidence,
    debug: {
      sourcesUsed,
    },
  };
}
