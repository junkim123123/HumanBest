// @ts-nocheck
"server-only";

/**
 * Normalize supplier name for consistent matching
 * - Lowercase
 * - Strip punctuation
 * - Remove common suffixes (ltd, limited, inc, incorporated, corp, corporation, llc, co, company, group, enterprise)
 * - Trim whitespace
 */
export function normalizeSupplierName(supplierName: string): string {
  if (!supplierName) return "";
  
  let normalized = supplierName.trim().toLowerCase();
  
  // Remove common suffixes (case-insensitive)
  const suffixes = [
    /\s+ltd\.?$/i,
    /\s+limited$/i,
    /\s+inc\.?$/i,
    /\s+incorporated$/i,
    /\s+corp\.?$/i,
    /\s+corporation$/i,
    /\s+llc\.?$/i,
    /\s+co\.?$/i,
    /\s+company$/i,
    /\s+group$/i,
    /\s+enterprise$/i,
    /\s+intl\.?$/i,
    /\s+international$/i,
  ];
  
  for (const suffix of suffixes) {
    normalized = normalized.replace(suffix, "");
  }
  
  // Strip punctuation (keep spaces)
  normalized = normalized.replace(/[.,;:!?'"()[\]{}]/g, "");
  
  // Normalize whitespace (multiple spaces to single space)
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  return normalized;
}

