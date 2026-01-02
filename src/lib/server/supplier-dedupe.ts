// @ts-nocheck
/**
 * Deduplicate supplier matches by supplier_id
 * Merges duplicate suppliers into a single representative match
 */

import type { SupplierMatch } from "@/lib/intelligence-pipeline";

/**
 * Canonicalize supplier name for grouping when supplier_id is missing
 */
export function canonicalizeSupplierName(name: string): string {
  if (!name || typeof name !== "string") return "unknown";
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

/**
 * Get grouping key for a supplier match
 * Uses supplier_id if present, otherwise canonicalized supplier_name
 */
export function getSupplierGroupKey(match: SupplierMatch): string {
  if (match.supplierId && match.supplierId !== "unknown") {
    return match.supplierId;
  }
  return canonicalizeSupplierName(match.supplierName);
}

/**
 * Merge two supplier matches, keeping the best data from each
 */
function mergeSupplierMatches(
  base: SupplierMatch,
  other: SupplierMatch
): SupplierMatch {
  // Pick the match with higher rerankScore (or matchScore if rerankScore is missing)
  const baseScore = base.rerankScore ?? base.matchScore ?? 0;
  const otherScore = other.rerankScore ?? other.matchScore ?? 0;
  
  // Use the match with higher score as base
  const best = otherScore > baseScore ? other : base;
  const secondary = otherScore > baseScore ? base : other;
  
  // Merge matched anchors (deduplicate, keep up to 2)
  const baseAnchors = (best as any)._matchedAnchors || [];
  const secondaryAnchors = (secondary as any)._matchedAnchors || [];
  const safeBaseAnchors = Array.isArray(baseAnchors) ? baseAnchors : [];
  const safeSecondaryAnchors = Array.isArray(secondaryAnchors) ? secondaryAnchors : [];
  const mergedAnchors = Array.from(
    new Set([...safeBaseAnchors, ...safeSecondaryAnchors])
  ).slice(0, 2);
  
  // Merge why_lines (deduplicate, keep up to 3)
  const baseWhyLines = (best as any)._whyLines || [];
  const secondaryWhyLines = (secondary as any)._whyLines || [];
  const safeBaseWhyLines = Array.isArray(baseWhyLines) ? baseWhyLines : [];
  const safeSecondaryWhyLines = Array.isArray(secondaryWhyLines) ? secondaryWhyLines : [];
  const mergedWhyLines = Array.from(
    new Set([...safeBaseWhyLines, ...safeSecondaryWhyLines])
  ).slice(0, 3);
  
  // Keep strongest evidence_strength
  const baseStrength = (best as any)._evidenceStrength || "weak";
  const secondaryStrength = (secondary as any)._evidenceStrength || "weak";
  const strengthOrder = { strong: 3, medium: 2, weak: 1 };
  const mergedStrength = 
    strengthOrder[baseStrength as keyof typeof strengthOrder] >= 
    strengthOrder[secondaryStrength as keyof typeof strengthOrder]
      ? baseStrength
      : secondaryStrength;
  
  // Merge evidence (keep best record count, latest last seen, combine product types)
  const baseEvidence = best.evidence || {};
  const secondaryEvidence = secondary.evidence || {};
  const mergedEvidence = {
    recordCount: Math.max(
      baseEvidence.recordCount || 0,
      secondaryEvidence.recordCount || 0
    ),
    lastSeenDays: Math.min(
      baseEvidence.lastSeenDays ?? Infinity,
      secondaryEvidence.lastSeenDays ?? Infinity
    ) === Infinity ? null : Math.min(
      baseEvidence.lastSeenDays ?? Infinity,
      secondaryEvidence.lastSeenDays ?? Infinity
    ),
    productTypes: Array.from(
      new Set([
        ...(baseEvidence.productTypes || []),
        ...(secondaryEvidence.productTypes || []),
      ])
    ),
    evidenceSnippet: baseEvidence.evidenceSnippet || secondaryEvidence.evidenceSnippet || null,
  };
  
  // Merge rerank flags (deduplicate)
  const baseFlags = best._rerankFlags || [];
  const secondaryFlags = secondary._rerankFlags || [];
  const mergedFlags = Array.from(new Set([...baseFlags, ...secondaryFlags]));
  
  return {
    ...best,
    // Keep best scores
    matchScore: Math.max(base.matchScore ?? 0, other.matchScore ?? 0),
    rerankScore: Math.max(
      base.rerankScore ?? base.matchScore ?? 0,
      other.rerankScore ?? other.matchScore ?? 0
    ),
    // Merge evidence
    evidence: mergedEvidence,
    // Merge metadata
    _matchedAnchors: mergedAnchors,
    _whyLines: mergedWhyLines,
    _evidenceStrength: mergedStrength,
    _rerankFlags: mergedFlags,
  };
}

/**
 * Deduplicate supplier matches by grouping on supplier_id (or canonicalized name)
 * Returns one match per supplier, with merged data from duplicates
 */
export function deduplicateSupplierMatches(
  matches: SupplierMatch[]
): SupplierMatch[] {
  const grouped = new Map<string, SupplierMatch>();
  
  for (const match of matches) {
    const key = getSupplierGroupKey(match);
    
    if (grouped.has(key)) {
      // Merge with existing match
      const existing = grouped.get(key)!;
      const merged = mergeSupplierMatches(existing, match);
      grouped.set(key, merged);
    } else {
      // First occurrence, add as-is
      grouped.set(key, match);
    }
  }
  
  return Array.from(grouped.values());
}

