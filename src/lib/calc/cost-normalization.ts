// @ts-nocheck
/**
 * Cost range normalization utilities
 * Ensures monotonic ordering: min <= mid <= max
 */

export interface MoneyRange {
  min: number;
  mid: number;
  max: number;
}

/**
 * Normalize a money range to ensure monotonic ordering
 * - Ensures: min <= mid <= max
 * - Swaps values if needed
 * - Clamps mid if outside [min, max]
 * - Logs warning if normalization was needed
 */
export function normalizeRange(range: MoneyRange, label?: string): MoneyRange {
  let { min, mid, max } = range;
  let wasModified = false;

  // Swap min and max if min > max
  if (min > max) {
    [min, max] = [max, min];
    wasModified = true;
  }

  // Clamp mid to [min, max]
  if (mid < min) {
    mid = min;
    wasModified = true;
  } else if (mid > max) {
    mid = max;
    wasModified = true;
  }

  // Log warning if normalization was needed
  if (wasModified) {
    const context = label ? ` (${label})` : '';
    console.warn(`[CostRange] Normalized range${context}:`, {
      original: range,
      normalized: { min, mid, max },
    });
  }

  return { min, mid, max };
}

/**
 * Normalize all cost ranges in a baseline object
 */
export function normalizeBaseline(baseline: any): any {
  if (!baseline?.costRange) return baseline;

  const normalized = { ...baseline };
  const { conservative, standard } = normalized.costRange;

  if (conservative?.totalLandedCost) {
    // Extract min, mid, max from conservative and standard if available
    // Conservative is typically the min, Standard is mid, and estimated max is standard * 1.2
    // But we need to ensure they're in the right order
    if (conservative.totalLandedCost && standard?.totalLandedCost) {
      const minCost = Math.min(conservative.totalLandedCost, standard.totalLandedCost);
      const maxCost = Math.max(conservative.totalLandedCost, standard.totalLandedCost);

      // Create a normalized structure if needed
      normalized._costRangeNormalized = {
        min: minCost,
        mid: standard.totalLandedCost,
        max: maxCost,
      };
    }
  }

  return normalized;
}
