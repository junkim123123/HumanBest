// @ts-nocheck
/**
 * Margin Calculator for comparing direct-from-factory sourcing
 * vs domestic wholesale pricing
 */

export interface MarginScenario {
  worst: number;
  base: number;
  best: number;
}

export interface MarginCalculationResult {
  domesticPrice: number;
  scenarios: MarginScenario;
  categoryType: "grocery" | "specialty" | "general";
  systemMessage?: string;
  consultingMessage?: string;
}

/**
 * Category-specific margin multipliers
 * These represent the markup that domestic wholesalers typically apply
 */
const MARGIN_MULTIPLIERS = {
  grocery: {
    worst: 1.01, // 1% margin (very thin margins in grocery)
    base: 1.02,  // 2% margin
    best: 1.03,  // 3% margin
  },
  specialty: {
    worst: 1.20, // 20% margin
    base: 1.30,  // 30% margin
    best: 1.40,  // 40% margin
  },
  general: {
    worst: 1.30, // 30% margin
    base: 1.50,  // 50% margin
    best: 1.80,  // 80% margin
  },
} as const;

/**
 * Determine category type based on category strings and food percentage
 */
function determineCategoryType(
  category?: string,
  genericCategory?: string,
  foodPercentage?: number
): "grocery" | "specialty" | "general" {
  // If food percentage is significant, treat as grocery
  if (foodPercentage !== undefined && foodPercentage > 50) {
    return "grocery";
  }

  const categoryLower = (category || "").toLowerCase();
  const genericLower = (genericCategory || "").toLowerCase();
  const combined = `${categoryLower} ${genericLower}`.toLowerCase();

  // Grocery/food categories
  const groceryKeywords = [
    "food",
    "grocery",
    "beverage",
    "snack",
    "candy",
    "chocolate",
    "coffee",
    "tea",
    "spice",
    "condiment",
    "sauce",
    "oil",
    "canned",
    "frozen",
    "fresh",
    "organic",
    "dairy",
    "meat",
    "seafood",
    "produce",
  ];

  // Specialty categories (higher margins, niche products)
  const specialtyKeywords = [
    "specialty",
    "premium",
    "luxury",
    "artisan",
    "handmade",
    "custom",
    "designer",
    "boutique",
    "niche",
    "collectible",
    "vintage",
    "antique",
  ];

  // Check for grocery
  if (
    groceryKeywords.some((keyword) => combined.includes(keyword)) ||
    categoryLower.includes("food") ||
    genericLower.includes("food")
  ) {
    return "grocery";
  }

  // Check for specialty
  if (
    specialtyKeywords.some((keyword) => combined.includes(keyword)) ||
    categoryLower.includes("specialty") ||
    genericLower.includes("specialty")
  ) {
    return "specialty";
  }

  // Default to general retail
  return "general";
}

/**
 * Calculate domestic wholesale price and margin scenarios
 * based on category type and landed cost
 */
export function calculateMarginScenarios(
  landedCost: number,
  category?: string,
  genericCategory?: string,
  quantity: number = 100,
  foodPercentage?: number
): MarginCalculationResult {
  const categoryType = determineCategoryType(
    category,
    genericCategory,
    foodPercentage
  );

  const multipliers = MARGIN_MULTIPLIERS[categoryType];

  // Calculate domestic wholesale price using base multiplier
  // This represents what you'd typically pay a domestic wholesaler
  const domesticPrice = landedCost * multipliers.base;

  // Calculate scenarios: savings compared to domestic price
  // Worst case: minimal savings (domestic price is close to landed cost)
  // Base case: standard savings
  // Best case: maximum savings
  const scenarios: MarginScenario = {
    worst: domesticPrice - landedCost * multipliers.worst,
    base: domesticPrice - landedCost,
    best: domesticPrice - landedCost * multipliers.best,
  };

  // Generate system messages based on category
  let systemMessage: string | undefined;
  let consultingMessage: string | undefined;

  if (categoryType === "grocery") {
    systemMessage =
      "Grocery margins are typically 1-3%. Direct sourcing can still provide significant savings on volume.";
    consultingMessage =
      "For grocery items, we recommend starting with smaller test orders to validate FDA compliance and storage requirements. Consider working with a customs broker experienced in food imports to minimize delays.";
  } else if (categoryType === "specialty") {
    systemMessage =
      "Specialty goods typically have 20-40% wholesale margins. Direct sourcing can capture significant value.";
    consultingMessage =
      "Specialty products often benefit from direct relationships with manufacturers. Consider MOQ negotiations and quality control processes specific to your niche market.";
  } else {
    systemMessage =
      "General retail items typically have 30-80% wholesale margins. Direct sourcing offers substantial savings potential.";
    consultingMessage =
      "For general retail items, bulk ordering and logistics optimization can maximize your savings. Consider consolidating shipments to reduce per-unit shipping costs.";
  }

  // Add quantity-based messaging
  if (quantity >= 1000) {
    consultingMessage += ` With your order quantity of ${quantity} units, you're well-positioned for volume discounts and optimized shipping rates.`;
  } else if (quantity < 100) {
    consultingMessage += ` For smaller orders (${quantity} units), consider consolidating with other products to reduce shipping costs per unit.`;
  }

  return {
    domesticPrice,
    scenarios,
    categoryType,
    systemMessage,
    consultingMessage,
  };
}

