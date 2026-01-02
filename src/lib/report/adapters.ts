// @ts-nocheck
// ============================================================================
// Model Adapters - Normalize model output to stable Report contract
// ============================================================================

import type { Report, RawModelOutput, RawGeminiOutput } from "./types";
import { REPORT_SCHEMA_VERSION } from "./types";

/**
 * Normalize Gemini output to Report
 * This is the only place that should parse Gemini-specific output
 */
export function normalizeGeminiOutput(
  raw: RawGeminiOutput,
  additionalData: {
    id: string;
    costRange: Report["baseline"]["costRange"];
    riskScores: Report["baseline"]["riskScores"];
    riskFlags: Report["baseline"]["riskFlags"];
    evidence: Report["baseline"]["evidence"];
    nextActions: Report["nextActions"];
  }
): Report {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: additionalData.id,
    productName: raw.productName || "Unknown Product",
    summary: raw.description || "",
    category: raw.category || "unknown",
    confidence: determineConfidence(raw),
    
    baseline: {
      costRange: additionalData.costRange,
      riskScores: additionalData.riskScores,
      riskFlags: additionalData.riskFlags,
      evidence: additionalData.evidence,
    },
    
    verification: {
      status: "not_requested",
    },
    
    nextActions: additionalData.nextActions,
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // Store raw output for debugging
    _rawModelOutput: raw.rawResponse,
  };
}

/**
 * Normalize OpenAI output to Report
 * Placeholder for future OpenAI integration
 */
export function normalizeOpenAIOutput(
  raw: RawOpenAIOutput,
  additionalData: {
    id: string;
    costRange: Report["baseline"]["costRange"];
    riskScores: Report["baseline"]["riskScores"];
    riskFlags: Report["baseline"]["riskFlags"];
    evidence: Report["baseline"]["evidence"];
    nextActions: Report["nextActions"];
  }
): Report {
  // TODO: Implement OpenAI-specific parsing
  // For now, return a minimal report structure
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: additionalData.id,
    productName: "Unknown Product",
    summary: "",
    category: "unknown",
    confidence: "low",
    
    baseline: {
      costRange: additionalData.costRange,
      riskScores: additionalData.riskScores,
      riskFlags: additionalData.riskFlags,
      evidence: additionalData.evidence,
    },
    
    verification: {
      status: "not_requested",
    },
    
    nextActions: additionalData.nextActions,
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    _rawModelOutput: raw.rawResponse,
  };
}

/**
 * Normalize Claude output to Report
 * Placeholder for future Claude integration
 */
export function normalizeClaudeOutput(
  raw: RawClaudeOutput,
  additionalData: {
    id: string;
    costRange: Report["baseline"]["costRange"];
    riskScores: Report["baseline"]["riskScores"];
    riskFlags: Report["baseline"]["riskFlags"];
    evidence: Report["baseline"]["evidence"];
    nextActions: Report["nextActions"];
  }
): Report {
  // TODO: Implement Claude-specific parsing
  // For now, return a minimal report structure
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: additionalData.id,
    productName: "Unknown Product",
    summary: "",
    category: "unknown",
    confidence: "low",
    
    baseline: {
      costRange: additionalData.costRange,
      riskScores: additionalData.riskScores,
      riskFlags: additionalData.riskFlags,
      evidence: additionalData.evidence,
    },
    
    verification: {
      status: "not_requested",
    },
    
    nextActions: additionalData.nextActions,
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    _rawModelOutput: raw.rawResponse,
  };
}

/**
 * Universal adapter - routes to model-specific normalizer
 */
export function normalizeModelOutput(
  raw: RawModelOutput,
  additionalData: {
    id: string;
    costRange: Report["baseline"]["costRange"];
    riskScores: Report["baseline"]["riskScores"];
    riskFlags: Report["baseline"]["riskFlags"];
    evidence: Report["baseline"]["evidence"];
    nextActions: Report["nextActions"];
  }
): Report {
  switch (raw.provider) {
    case "gemini":
      return normalizeGeminiOutput(raw, additionalData);
    case "openai":
      return normalizeOpenAIOutput(raw, additionalData);
    case "claude":
      return normalizeClaudeOutput(raw, additionalData);
    default:
      throw new Error(`Unknown model provider: ${(raw as any).provider}`);
  }
}

/**
 * Determine confidence level from model output
 */
function determineConfidence(raw: RawGeminiOutput): "low" | "medium" | "high" {
  // Simple heuristic - can be enhanced based on model confidence scores
  if (raw.hsCode && raw.keywords.length >= 5) {
    return "high";
  }
  if (raw.keywords.length >= 3) {
    return "medium";
  }
  return "low";
}














