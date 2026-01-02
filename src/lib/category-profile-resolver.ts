// @ts-nocheck
/**
 * Category Profile Resolver
 * Maps report categories to category families for explainable lead cards
 * Category-agnostic: no hardcoded assumptions about specific categories
 */

export type CategoryFamily = 
  | "Food"
  | "Toys"
  | "Home"
  | "Beauty"
  | "Electronics"
  | "Apparel"
  | "Industrial"
  | "Other";

export interface CategoryProfile {
  familyLabel: CategoryFamily;
  stopwords: string[];
  riskRules?: {
    logisticsKeywords?: string[];
    lowQualityIndicators?: string[];
  };
}

/**
 * Resolve category profile from report category string
 * Uses simple keyword mapping - no hardcoded category assumptions
 */
export function resolveCategoryProfile(reportCategory: string): CategoryProfile {
  const categoryLower = (reportCategory || "").toLowerCase().trim();
  
  // Food family: candy, snack, beverage, supplement, jelly, chocolate, etc.
  if (
    categoryLower.includes("candy") ||
    categoryLower.includes("snack") ||
    categoryLower.includes("beverage") ||
    categoryLower.includes("supplement") ||
    categoryLower.includes("jelly") ||
    categoryLower.includes("chocolate") ||
    categoryLower.includes("food") ||
    categoryLower.includes("drink")
  ) {
    return {
      familyLabel: "Food",
      stopwords: ["food", "snack", "candy", "beverage", "drink"],
      riskRules: {
        logisticsKeywords: ["logistics", "shipping", "forwarder"],
        lowQualityIndicators: ["dummy", "test", "sample"],
      },
    };
  }
  
  // Toys family: toy, game, kids, plush, figure, etc.
  if (
    categoryLower.includes("toy") ||
    categoryLower.includes("game") ||
    categoryLower.includes("kids") ||
    categoryLower.includes("plush") ||
    categoryLower.includes("figure") ||
    categoryLower.includes("play")
  ) {
    return {
      familyLabel: "Toys",
      stopwords: ["toy", "game", "play", "kids"],
      riskRules: {
        logisticsKeywords: ["logistics", "shipping", "forwarder"],
        lowQualityIndicators: ["dummy", "test", "sample"],
      },
    };
  }
  
  // Beauty family: cosmetic, skincare, makeup, etc.
  if (
    categoryLower.includes("cosmetic") ||
    categoryLower.includes("skincare") ||
    categoryLower.includes("makeup") ||
    categoryLower.includes("beauty") ||
    categoryLower.includes("personal care")
  ) {
    return {
      familyLabel: "Beauty",
      stopwords: ["cosmetic", "beauty", "skincare", "makeup"],
      riskRules: {
        logisticsKeywords: ["logistics", "shipping", "forwarder"],
        lowQualityIndicators: ["dummy", "test", "sample"],
      },
    };
  }
  
  // Electronics family: electronic, charger, battery, etc.
  if (
    categoryLower.includes("electronic") ||
    categoryLower.includes("charger") ||
    categoryLower.includes("battery") ||
    categoryLower.includes("device") ||
    categoryLower.includes("tech")
  ) {
    return {
      familyLabel: "Electronics",
      stopwords: ["electronic", "device", "tech", "charger"],
      riskRules: {
        logisticsKeywords: ["logistics", "shipping", "forwarder"],
        lowQualityIndicators: ["dummy", "test", "sample"],
      },
    };
  }
  
  // Home family: kitchen, decor, furniture, etc.
  if (
    categoryLower.includes("kitchen") ||
    categoryLower.includes("decor") ||
    categoryLower.includes("furniture") ||
    categoryLower.includes("home") ||
    categoryLower.includes("household")
  ) {
    return {
      familyLabel: "Home",
      stopwords: ["home", "kitchen", "decor", "furniture"],
      riskRules: {
        logisticsKeywords: ["logistics", "shipping", "forwarder"],
        lowQualityIndicators: ["dummy", "test", "sample"],
      },
    };
  }
  
  // Apparel family: clothing, textile, etc.
  if (
    categoryLower.includes("clothing") ||
    categoryLower.includes("textile") ||
    categoryLower.includes("apparel") ||
    categoryLower.includes("garment") ||
    categoryLower.includes("fabric")
  ) {
    return {
      familyLabel: "Apparel",
      stopwords: ["clothing", "textile", "apparel", "garment"],
      riskRules: {
        logisticsKeywords: ["logistics", "shipping", "forwarder"],
        lowQualityIndicators: ["dummy", "test", "sample"],
      },
    };
  }
  
  // Industrial family: industrial, machinery, equipment, etc.
  if (
    categoryLower.includes("industrial") ||
    categoryLower.includes("machinery") ||
    categoryLower.includes("equipment") ||
    categoryLower.includes("parts") ||
    categoryLower.includes("component")
  ) {
    return {
      familyLabel: "Industrial",
      stopwords: ["industrial", "machinery", "equipment"],
      riskRules: {
        logisticsKeywords: ["logistics", "shipping", "forwarder"],
        lowQualityIndicators: ["dummy", "test", "sample"],
      },
    };
  }
  
  // Default: Other
  return {
    familyLabel: "Other",
    stopwords: [],
    riskRules: {
      logisticsKeywords: ["logistics", "shipping", "forwarder"],
      lowQualityIndicators: ["dummy", "test", "sample"],
    },
  };
}

