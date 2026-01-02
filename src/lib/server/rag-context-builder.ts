// @ts-nocheck
"server-only";

import type { ImageAnalysisResult, MarketEstimate, SupplierMatch } from "@/lib/intelligence-pipeline";
import type { CategoryProfile } from "@/lib/intelligence-pipeline";
import { getCategoryProfile, determineCategoryKey } from "@/lib/category-profiles";

/**
 * Safe array helper - returns empty array if input is not an array
 */
function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Build RAG context for Gemini prompts
 * Includes similar imports, category profile, HS candidates, missing inputs, and supplier matches
 */
export interface RAGContext {
  topSimilarImports: Array<{
    hs_code: string | null;
    unit_desc: string;
    unit_price: number;
    currency: string;
    origin: string | null;
    weight: number | null;
    invoice_snippet: string | null;
  }>;
  categoryProfile: {
    key: string;
    rules: string[];
    stopwords: string[];
  };
  hsCandidates: Array<{
    code: string;
    confidence: number;
  }>;
  missingInputs: string[];
  supplierMatches: {
    verified: number;
    candidate: number;
  };
}

/**
 * Build RAG context from pipeline data
 */
export async function buildRAGContext(params: {
  analysis: ImageAnalysisResult;
  marketEstimate?: MarketEstimate;
  supplierMatches?: SupplierMatch[];
  similarImports?: Array<{
    hs_code?: string | null;
    product_name?: string;
    product_description?: string;
    unit_price?: number;
    currency?: string;
    origin_country?: string | null;
    weight?: number | null;
    invoice_snippet?: string | null;
  }>;
}): Promise<RAGContext> {
  const { analysis, marketEstimate, supplierMatches, similarImports } = params;

  // Get category profile
  const categoryKey = determineCategoryKey({
    category: analysis.category,
    keywords: analysis.keywords,
    hsCode: analysis.hsCode,
    productName: analysis.productName,
  });
  const categoryProfile = getCategoryProfile(categoryKey) || {
    key: categoryKey,
    label: categoryKey,
    allowHs2: [],
    denyHs2: [],
    globalStopwords: [],
  } as any;

  // Build top similar imports (up to 5, sanitized)
  const topSimilarImports = safeArray(similarImports).slice(0, 5).map((record) => ({
    hs_code: record.hs_code || null,
    unit_desc: (record.product_name || record.product_description || "").substring(0, 100),
    unit_price: record.unit_price || 0,
    currency: record.currency || "USD",
    origin: record.origin_country || null,
    weight: record.weight || null,
    invoice_snippet: sanitizeInvoiceSnippet(record.invoice_snippet || null),
  }));

  // Get HS candidates from market estimate
  const hsCandidates = safeArray(marketEstimate?.hsCodeCandidates).map((candidate: any) => ({
    code: candidate.code,
    confidence: candidate.confidence,
  }));

  // Determine missing inputs
  const missingInputs: string[] = [];
  if (!analysis.labelData?.netWeight) missingInputs.push("unit_weight");
  if (!analysis.labelData || Object.keys(analysis.labelData).length === 0) missingInputs.push("packaging_photo");
  if (!analysis.barcode) missingInputs.push("barcode");
  if (!analysis.hsCode) missingInputs.push("hs_code");

  // Count supplier matches (handle both SupplierMatch and enriched match formats)
  const verifiedCount = (supplierMatches || []).filter((m: any) => {
    const tier = m.tier || (m.isInferred ? "candidate" : "recommended");
    const evidenceStrength = m.evidenceStrength || m.flags?.evidence_strength || "weak";
    return tier === "recommended" && (evidenceStrength === "strong" || evidenceStrength === "medium");
  }).length;
  const candidateCount = (supplierMatches || []).length - verifiedCount;

  return {
    topSimilarImports,
    categoryProfile: {
      key: categoryProfile.key,
      rules: [
        `Category: ${categoryProfile.label || categoryKey}`,
        `Allowed HS2 codes: ${safeArray(categoryProfile.allowHs2).join(", ") || "none"}`,
        `Denied HS2 codes: ${safeArray(categoryProfile.denyHs2).join(", ") || "none"}`,
      ],
      stopwords: safeArray(categoryProfile.globalStopwords).slice(0, 10), // Limit to top 10
    },
    hsCandidates,
    missingInputs,
    supplierMatches: {
      verified: verifiedCount,
      candidate: candidateCount,
    },
  };
}

/**
 * Sanitize invoice snippet to remove PII
 */
function sanitizeInvoiceSnippet(snippet: string | null): string | null {
  if (!snippet) return null;
  
  // Remove email patterns
  let sanitized = snippet.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[email]");
  
  // Remove phone patterns
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[phone]");
  
  // Remove addresses (lines with common address keywords)
  sanitized = sanitized.replace(/.*\b(street|avenue|road|boulevard|drive|lane|suite|unit|apt|apartment)\b.*/gi, "[address]");
  
  // Cap length to 200 chars
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 197) + "...";
  }
  
  return sanitized;
}

