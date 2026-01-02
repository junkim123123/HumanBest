// @ts-nocheck
/**
 * Helper functions for computing supplier lead metadata
 * Used to generate why_lines and evidence_strength for explainable lead cards
 * Category-agnostic: no hardcoded category assumptions
 */

/**
 * Determine if a supplier match should be excluded as logistics-only
 * Returns true if the supplier primarily provides logistics services and is not the target category
 */
export function isLogisticsOnly(params: {
  flags?: Record<string, unknown>;
  supplierName?: string;
  categoryKey?: string;
}): boolean {
  const { flags = {}, supplierName = "", categoryKey = "" } = params;

  // Hard flag: type_logistics already set
  if (flags.type_logistics === true) {
    // Unless this is actually a logistics category (which would be rare)
    return categoryKey !== "logistics";
  }

  // Strong logistics indicators in supplier name
  const logisticsKeywords = ["CONTAINER", "LOGISTICS", "FREIGHT", "LINE", "SHIPPING", "EXPRESS"];
  const upperName = supplierName.toUpperCase();
  const hasLogisticsKeyword = logisticsKeywords.some(kw => upperName.includes(kw));

  // Only exclude if we found logistics indicators AND category is not logistics
  return hasLogisticsKeyword && categoryKey !== "logistics";
}

/**
 * Truncate a string to max length, adding ellipsis if needed
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Build why_lines array (up to 3 lines) explaining why this lead appears
 * Category-agnostic format
 */
export function buildWhyLines(params: {
  anchorHits: number;
  brandPhraseHits: number;
  matchedAnchors: string[];
  category: string;
  productCount?: number;
  priceCoverage?: number;
}): string[] {
  const lines: string[] = [];
  const { anchorHits, brandPhraseHits, matchedAnchors, category, productCount, priceCoverage } = params;

  // Line A: Match signal (keyword / phrase / inference)
  if (anchorHits > 0) {
    const anchorExamples = matchedAnchors
      .slice(0, 2)
      .map(anchor => anchor.length > 24 ? anchor.substring(0, 21) + "..." : anchor);
    const examplesText = anchorExamples.length > 0 ? ` (${anchorExamples.join(", ")})` : "";
    const line = `Keyword match, ${anchorHits} anchor${anchorHits === 1 ? "" : "s"}${examplesText}`;
    lines.push(truncate(line, 72));
  } else if (brandPhraseHits > 0) {
    lines.push(truncate("Phrase match from product wording", 72));
  } else {
    lines.push(truncate("Category inference based on similar items", 72));
  }

  // Line B: Category alignment (always show)
  const lineB = `Category aligned with ${category}`;
  lines.push(truncate(lineB, 72));

  // Line C: Dataset support
  if (productCount !== undefined && productCount > 0) {
    if (priceCoverage !== undefined && priceCoverage > 0) {
      const line = `Internal dataset: ${productCount} related item${productCount === 1 ? "" : "s"}, pricing coverage ${Math.round(priceCoverage)}%`;
      lines.push(truncate(line, 72));
    } else if (priceCoverage !== undefined && priceCoverage === 0) {
      const line = `Internal dataset: ${productCount} related item${productCount === 1 ? "" : "s"}, no pricing yet`;
      lines.push(truncate(line, 72));
    } else {
      const line = `Internal dataset: ${productCount} related item${productCount === 1 ? "" : "s"}`;
      lines.push(truncate(line, 72));
    }
  } else if (productCount !== undefined && productCount === 0) {
    lines.push(truncate("Internal dataset: limited history for this supplier", 72));
  } else {
    lines.push(truncate("Internal dataset: not enough history yet", 72));
  }

  return lines.slice(0, 3); // Max 3 lines
}

/**
 * Compute evidence strength based on match signals using scoring system
 * Category-agnostic heuristic
 */
export function computeEvidenceStrength(params: {
  anchorHits: number;
  similarRecordsCount?: number; // Report-level similar records count (optional)
  recordCount?: number; // Match-level evidence record count
  productCount?: number;
  priceCoverage?: number;
  isLogistics: boolean;
  hasDummyId?: boolean;
  hasLowQuality?: boolean;
}): "strong" | "medium" | "weak" {
  const { 
    anchorHits, 
    similarRecordsCount, 
    recordCount, 
    productCount, 
    priceCoverage,
    isLogistics, 
    hasDummyId,
    hasLowQuality 
  } = params;

  let score = 0;

  // Positive signals
  if (anchorHits >= 2) {
    score += 3;
  } else if (anchorHits === 1) {
    score += 2;
  }

  // Similar records count (use report-level if available, otherwise match-level)
  const effectiveRecordCount = similarRecordsCount ?? recordCount ?? 0;
  if (effectiveRecordCount >= 20) {
    score += 2;
  } else if (effectiveRecordCount >= 5) {
    score += 1;
  }

  // Supplier intel signals
  if (productCount !== undefined) {
    if (productCount >= 10) {
      score += 2;
    } else if (productCount >= 3) {
      score += 1;
    }
  }

  if (priceCoverage !== undefined && priceCoverage > 0) {
    score += 1;
  }

  // Negative signals (penalties)
  if (isLogistics || hasDummyId || hasLowQuality) {
    score -= 3;
  }

  // Map score to strength
  if (score >= 5) {
    return "strong";
  } else if (score >= 2) {
    return "medium";
  } else {
    return "weak";
  }
}

