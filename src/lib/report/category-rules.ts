// @ts-nocheck
/**
 * Category Rules - Deterministic mapping of keywords to categories
 */

import { CategoryHint, ProductSignals } from "./signals";

// ============================================================================
// Category Keyword Mappings
// ============================================================================

const CATEGORY_KEYWORDS: Record<CategoryHint, string[]> = {
  food_candy: [
    "candy",
    "confectionery",
    "gummy",
    "jelly",
    "marshmallow",
    "chocolate",
    "lollipop",
    "gum",
    "sugar",
    "snack",
    "sweet",
    "toffee",
    "caramel",
    "licorice",
    "taffy",
    "brittle",
    "fudge",
  ],
  toys: [
    "toy",
    "figure",
    "collectible",
    "blind box",
    "capsule",
    "kids",
    "game",
    "puzzle",
    "slime",
    "doll",
    "action figure",
    "plush",
    "building block",
    "lego",
    "funko",
    "collectible figure",
  ],
  electronics: [
    "usb",
    "rechargeable",
    "battery",
    "charger",
    "led",
    "fan",
    "power",
    "voltage",
    "watt",
    "adapter",
    "cable",
    "plug",
    "cord",
    "connector",
    "electronic",
    "powered",
    "electric",
    "wireless",
    "bluetooth",
  ],
  apparel: [
    "cotton",
    "polyester",
    "size",
    "shirt",
    "socks",
    "hoodie",
    "jacket",
    "fabric",
    "garment",
    "clothing",
    "apparel",
    "wear",
    "outfit",
    "dress",
    "pants",
    "shirt",
    "textile",
  ],
  general_merch: [],
};

// ============================================================================
// Keyword Overrides (for deterministic routing)
// ============================================================================

/**
 * Keywords that should EXCLUDE certain categories
 * Used to prevent mis-classification (e.g., bath items to toy)
 */
const EXCLUDE_CATEGORY_KEYWORDS: Record<CategoryHint, string[]> = {
  toys: [
    "bath",
    "sponge",
    "scrubber",
    "loofah",
    "hygienic",
    "mesh sponge",
    "shower",
    "bathing",
    "wash",
  ],
  food_candy: [],
  electronics: [],
  apparel: [],
  general_merch: [],
};

// ============================================================================
// Inference Function
// ============================================================================

export interface CategoryInferenceResult {
  categoryHint?: CategoryHint;
  matchedRules: string[];
}

/**
 * Infer category hint from keywords and signals
 * Uses deterministic keyword matching with override rules
 */
export function inferCategoryHint(
  keywords: string[],
  signals: ProductSignals
): CategoryInferenceResult {
  const matchedRules: string[] = [];
  const scores: Record<CategoryHint, number> = {
    food_candy: 0,
    toys: 0,
    electronics: 0,
    apparel: 0,
    general_merch: 0,
  };

  // Special handling for electronics based on powerInfo
  if (signals.powerInfo) {
    scores.electronics += 3;
    matchedRules.push("power_info_detected");
  }

  // Keyword matching for each category
  if (!keywords || keywords.length === 0) {
    if (matchedRules.length === 0) {
      return {
        categoryHint: undefined,
        matchedRules: ["no_keywords_matched"],
      };
    }
    // If we matched on other signals but no keywords, continue
  }

  for (const keyword of keywords) {
    const kwLower = keyword.toLowerCase().trim();

    for (const [category, categoryKeywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (categoryKeywords.some((ck) => kwLower.includes(ck) || ck.includes(kwLower))) {
        scores[category as CategoryHint] += 1;
        matchedRules.push(`keyword_${category}_"${keyword}"`);
      }
    }
  }

  // Check for exclusions (negative matches that demote categories)
  for (const keyword of keywords) {
    const kwLower = keyword.toLowerCase().trim();

    for (const [category, excludeKeywords] of Object.entries(EXCLUDE_CATEGORY_KEYWORDS)) {
      if (excludeKeywords.some((ek) => kwLower.includes(ek) || ek.includes(kwLower))) {
        scores[category as CategoryHint] = Math.max(0, scores[category as CategoryHint] - 2);
        matchedRules.push(`exclude_${category}_"${keyword}"`);
      }
    }
  }

  // Find highest scoring category
  let topCategory: CategoryHint | undefined;
  let topScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > topScore) {
      topScore = score;
      topCategory = category as CategoryHint;
    }
  }

  // If no category scored or only general_merch, check if we should use general_merch
  if (!topCategory || (topCategory === "general_merch" && topScore === 0)) {
    if (keywords.length > 0) {
      return {
        categoryHint: "general_merch",
        matchedRules: [...matchedRules, "fallback_to_general_merch"],
      };
    }
    return {
      categoryHint: undefined,
      matchedRules: [...matchedRules, "no_category_matched"],
    };
  }

  return {
    categoryHint: topCategory,
    matchedRules,
  };
}

// ============================================================================
// Category Priority Mappings
// ============================================================================

export interface CategoryPriorities {
  importantFields: string[];
  keywordBoost: string[];
}

/**
 * Get important fields and keyword boosts for a category
 * Used to prioritize signals during supplier matching
 */
export function getCategoryPriorities(categoryHint?: CategoryHint): CategoryPriorities {
  switch (categoryHint) {
    case "food_candy":
      return {
        importantFields: ["netWeightG", "originLabel", "brand", "warnings"],
        keywordBoost: ["candy", "chocolate", "gummy", "confectionery", "sweet"],
      };

    case "toys":
      return {
        importantFields: ["brand", "model", "materials", "unitCount"],
        keywordBoost: ["toy", "figure", "collectible", "kids", "game"],
      };

    case "electronics":
      return {
        importantFields: ["model", "brand", "powerInfo", "warnings", "materials"],
        keywordBoost: ["usb", "rechargeable", "battery", "charger", "led", "wireless"],
      };

    case "apparel":
      return {
        importantFields: ["materials", "brand", "originLabel", "unitCount"],
        keywordBoost: ["cotton", "polyester", "fabric", "garment", "clothing"],
      };

    case "general_merch":
    default:
      return {
        importantFields: ["brand", "model", "keywords"],
        keywordBoost: [],
      };
  }
}
