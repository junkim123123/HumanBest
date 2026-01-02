// @ts-nocheck
// ============================================================================
// Runtime Validation - Protect API boundaries
// ============================================================================

import type { Report, ReportResponse } from "./types";
import { REPORT_SCHEMA_VERSION } from "./types";

/**
 * Validate a Report object at runtime
 * Returns validated report with defaults applied, or throws if critical fields missing
 */
export function validateReport(data: unknown): Report {
  if (!data || typeof data !== "object") {
    throw new Error("Report must be an object");
  }

  const obj = data as Record<string, unknown>;

  // Schema version (default to current if missing)
  const schemaVersion = (obj.schemaVersion as number) ?? REPORT_SCHEMA_VERSION;

  // Required fields
  if (!obj.id || typeof obj.id !== "string") {
    throw new Error("Report must have a valid id");
  }
  if (!obj.productName || typeof obj.productName !== "string") {
    throw new Error("Report must have a valid productName");
  }
  if (!obj.category || typeof obj.category !== "string") {
    throw new Error("Report must have a valid category");
  }

  // Validate baseline structure
  if (!obj.baseline || typeof obj.baseline !== "object") {
    throw new Error("Report must have a baseline object");
  }

  const baseline = obj.baseline as Record<string, unknown>;

  // Validate cost range
  if (!baseline.costRange || typeof baseline.costRange !== "object") {
    throw new Error("Report baseline must have costRange");
  }

  const costRange = baseline.costRange as Record<string, unknown>;
  if (!costRange.standard || !costRange.conservative) {
    throw new Error("Report costRange must have standard and conservative");
  }

  // Validate risk scores
  if (!baseline.riskScores || typeof baseline.riskScores !== "object") {
    throw new Error("Report baseline must have riskScores");
  }

  // Validate verification (with defaults)
  const verification = obj.verification || { status: "not_requested" };
  if (
    typeof verification === "object" &&
    verification !== null &&
    !["not_requested", "requested", "verifying", "quoted", "done"].includes(
      (verification as Record<string, unknown>).status as string
    )
  ) {
    throw new Error("Report verification.status must be a valid status");
  }

  // Apply defaults and return validated report
  const defaultSignals = {
    hasImportEvidence: false,
    hasInternalSimilarRecords: false,
    hasSupplierCandidates: false,
    verificationStatus: "none" as const,
  };

  return {
    schemaVersion,
    id: obj.id as string,
    productName: obj.productName as string,
    summary: (obj.summary as string) || "",
    category: obj.category as string,
    confidence: (obj.confidence as "low" | "medium" | "high") || "medium",
    categoryConfidence: (obj.categoryConfidence as number) ?? 0.7,
    signals: (obj.signals as Report["signals"]) || defaultSignals,
    
    baseline: {
      costRange: baseline.costRange as Report["baseline"]["costRange"],
      riskScores: baseline.riskScores as Report["baseline"]["riskScores"],
      riskFlags: baseline.riskFlags as Report["baseline"]["riskFlags"],
      evidence: baseline.evidence as Report["baseline"]["evidence"],
    },
    
    verification: verification as Report["verification"],
    
    nextActions: (obj.nextActions as Report["nextActions"]) || [],
    
    createdAt: (obj.createdAt as string) || new Date().toISOString(),
    updatedAt: (obj.updatedAt as string) || new Date().toISOString(),
    
    _rawModelOutput: obj._rawModelOutput,
  };
}

/**
 * Validate a ReportResponse at runtime
 */
export function validateReportResponse(data: unknown): ReportResponse {
  if (!data || typeof data !== "object") {
    throw new Error("ReportResponse must be an object");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.success !== "boolean") {
    throw new Error("ReportResponse must have a boolean success field");
  }

  if (!obj.success) {
    return {
      success: false,
      error: (obj.error as string) || "Unknown error",
    };
  }

  if (!obj.data) {
    throw new Error("ReportResponse must have data when success is true");
  }

  return {
    success: true,
    data: validateReport(obj.data),
  };
}

/**
 * Repair a report with missing fields using defaults
 * Use this when you want to gracefully handle partial data
 */
export function repairReport(data: Partial<Report>): Report {
  const defaults: Report = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: data.id || `temp_${Date.now()}`,
    productName: data.productName || "Unknown Product",
    summary: data.summary || "",
    category: data.category || "unknown",
    confidence: data.confidence || "medium",
    categoryConfidence: data.categoryConfidence ?? 0.7,
    signals: data.signals || {
      hasImportEvidence: false,
      hasInternalSimilarRecords: false,
      hasSupplierCandidates: false,
      verificationStatus: "none",
    },
    
    baseline: data.baseline || {
      costRange: {
        conservative: {
          unitPrice: 0,
          shippingPerUnit: 0,
          dutyPerUnit: 0,
          feePerUnit: 0,
          totalLandedCost: 0,
        },
        standard: {
          unitPrice: 0,
          shippingPerUnit: 0,
          dutyPerUnit: 0,
          feePerUnit: 0,
          totalLandedCost: 0,
        },
      },
      riskScores: {
        tariff: 0,
        compliance: 0,
        supply: 0,
        total: 0,
      },
      riskFlags: {
        tariff: {
          hsCodeRange: [],
          adCvdPossible: false,
          originSensitive: false,
        },
        compliance: {
          requiredCertifications: [],
          labelingRisks: [],
          recallHints: [],
        },
        supply: {
          moqRange: { min: 0, max: 0, typical: 0 },
          leadTimeRange: { min: 0, max: 0, typical: 0 },
          qcChecks: [],
        },
      },
      evidence: {
        types: [],
        assumptions: {
          packaging: "",
          weight: "",
          volume: "",
          incoterms: "",
          shippingMode: "",
        },
        items: [],
        lastAttemptAt: null,
        lastSuccessAt: null,
        lastResult: null,
        lastErrorCode: null,
      },
    },
    
    verification: data.verification || {
      status: "not_requested",
    },
    
    nextActions: data.nextActions || [],
    
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };

  return {
    ...defaults,
    ...data,
    baseline: {
      ...defaults.baseline,
      ...(data.baseline || {}),
    },
    verification: {
      ...defaults.verification,
      ...(data.verification || {}),
    },
    signals: {
      ...defaults.signals,
      ...(data.signals || {}),
    },
  };
}

