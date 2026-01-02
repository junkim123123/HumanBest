// @ts-nocheck
/**
 * resolveHsCodeCandidates
 * Consistent HS code resolution with evidence source metadata and priority order:
 * 1) Step 1 (image analysis) hsCode when present
 * 2) Market estimate hs candidates
 * 3) Deterministic category fallback (best-guess) when nothing else
 * 4) Final fallback 9999 only if all are missing
 */

export type HsCandidate = {
  code: string;
  confidence: number;
  reason: string;
  source: "STEP1" | "MARKET_ESTIMATE" | "CATEGORY_FALLBACK" | "FALLBACK";
  evidenceSnippet?: string;
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  // Deterministic fallbacks by broad category keywords
  candy: "1704.90",
  confection: "1704.90",
  food: "2106.90",
  snack: "2106.90",
  toy: "9503.00",
  toys: "9503.00",
  plush: "9503.00",
  electronics: "8509.80",
  gadget: "8509.80",
  apparel: "6203.00",
  clothing: "6203.00",
  garment: "6203.00",
};

function pickCategoryFallback(category?: string): string | null {
  if (!category) return null;
  const lower = category.toLowerCase();
  for (const [key, code] of Object.entries(CATEGORY_FALLBACKS)) {
    if (lower.includes(key)) return code;
  }
  return null;
}

export function resolveHsCodeCandidates(params: {
  analysisHs?: string | null;
  marketHsCandidates?: Array<{ code: string; confidence?: number; reason?: string; evidenceSnippet?: string }>;
  category?: string;
}): HsCandidate[] {
  const { analysisHs, marketHsCandidates = [], category } = params;
  const seen = new Set<string>();
  const resolved: HsCandidate[] = [];

  // 1) Step 1 hsCode
  if (analysisHs && typeof analysisHs === "string" && analysisHs.trim().length >= 4) {
    const code = analysisHs.trim();
    if (!seen.has(code)) {
      seen.add(code);
      resolved.push({
        code,
        confidence: 0.95,
        reason: "From image analysis",
        source: "STEP1",
      });
    }
  }

  // 2) Market estimate candidates
  for (const candidate of marketHsCandidates) {
    if (!candidate || !candidate.code) continue;
    const code = String(candidate.code).trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    resolved.push({
      code,
      confidence: candidate.confidence ?? 0.75,
      reason: candidate.reason || "From market estimate",
      source: "MARKET_ESTIMATE",
      evidenceSnippet: candidate.evidenceSnippet,
    });
  }

  // 3) Deterministic category fallback
  if (resolved.length === 0) {
    const fallback = pickCategoryFallback(category);
    if (fallback) {
      resolved.push({
        code: fallback,
        confidence: 0.35,
        reason: "Category fallback",
        source: "CATEGORY_FALLBACK",
      });
    }
  }

  // 4) Final 9999 fallback only when nothing else
  if (resolved.length === 0) {
    resolved.push({
      code: "9999",
      confidence: 0.2,
      reason: "No HS signals available",
      source: "FALLBACK",
    });
  }

  return resolved;
}
