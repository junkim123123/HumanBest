/**
 * Decision Support Builder
 * Constructs comprehensive decision support data for report v2
 * Includes HS candidates, duty rates, cost models, profit scenarios, quantity planning
 */

interface HsCandidate {
  code: string;
  confidence: number;
  rationale: string;
  evidenceSnippet: string;
  source: "ANALYSIS" | "MARKET_ESTIMATE" | "FALLBACK" | "USER_INPUT";
}

interface DutyData {
  status: "DRAFT" | "CONFIRMED";
  rateMin: number; // percentage
  rateMax: number; // percentage
  rationale: string;
}

interface CostPerUnit {
  min: number;
  mid: number;
  max: number;
}

interface CostComponent {
  factoryUnitPrice: CostPerUnit;
  shipping: CostPerUnit;
  duty: CostPerUnit;
  fees: CostPerUnit;
}

interface CostData {
  landedPerUnit: CostPerUnit;
  componentsPerUnit: CostComponent;
  confidenceTier: "low" | "medium" | "high";
  evidenceSummary: string;
  currency: string;
}

interface QuantityOption {
  quantity: number;
  totalLanded: CostPerUnit;
  totalProfit: CostPerUnit | null; // null if no retail price
}

interface QuantityPlannerData {
  options: QuantityOption[];
}

interface TargetMarginPrice {
  marginPercent: number;
  requiredShelfPrice: CostPerUnit;
}

interface ProfitData {
  shelfPrice: number | null;
  breakEvenPrice: CostPerUnit;
  targetMarginPrices: TargetMarginPrice[];
  profitPerUnit?: CostPerUnit;
  marginPercent?: CostPerUnit;
}

interface NexSupplyValue {
  blockers: string[];
  whatWeDo: string[];
  expectedTimelineText: string;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
}

export interface DecisionSupport {
  hs: {
    customsCategoryText: string | null;
    status: "DRAFT" | "CONFIRMED";
    candidates: HsCandidate[];
    hybridPaths?: Array<{ code: string; label: string; when: string; confidence?: number }>;
    decisionRule?: string | null;
  };
  dutyRate: DutyData;
  cost: CostData;
  quantityPlanner: QuantityPlannerData;
  profit: ProfitData;
  nexsupplyValue: NexSupplyValue;
}

/**
 * Generate fallback HS candidates based on category
 */
export function generateFallbackHsCandidates(
  category: string
): HsCandidate[] {
  const categoryMap: Record<string, HsCandidate[]> = {
    candy: [
      {
        code: "1704",
        confidence: 0.4,
        rationale: "Sugar confectionery - common fallback for candy",
        evidenceSnippet: "Category-based fallback",
        source: "FALLBACK",
      },
      {
        code: "2106",
        confidence: 0.3,
        rationale: "Prepared foods - alternative for candy products",
        evidenceSnippet: "Category-based fallback",
        source: "FALLBACK",
      },
    ],
    beverage: [
      {
        code: "2202",
        confidence: 0.45,
        rationale: "Mineral water, aerated water, flavored - common beverage",
        evidenceSnippet: "Category-based fallback",
        source: "FALLBACK",
      },
      {
        code: "2009",
        confidence: 0.35,
        rationale: "Fruit juices and vegetable juices - alternative",
        evidenceSnippet: "Category-based fallback",
        source: "FALLBACK",
      },
    ],
    electronics: [
      {
        code: "8471",
        confidence: 0.5,
        rationale: "Automatic data processing machines - common electronics",
        evidenceSnippet: "Category-based fallback",
        source: "FALLBACK",
      },
      {
        code: "8517",
        confidence: 0.4,
        rationale: "Electrical apparatus for telecommunications",
        evidenceSnippet: "Category-based fallback",
        source: "FALLBACK",
      },
    ],
    apparel: [
      {
        code: "6204",
        confidence: 0.5,
        rationale: "Women's clothing articles - common apparel code",
        evidenceSnippet: "Category-based fallback",
        source: "FALLBACK",
      },
      {
        code: "6203",
        confidence: 0.45,
        rationale: "Men's clothing articles - alternative apparel",
        evidenceSnippet: "Category-based fallback",
        source: "FALLBACK",
      },
    ],
  };

  return categoryMap[category.toLowerCase()] || [
    {
      code: "9999",
      confidence: 0.2,
      rationale: "Unknown category - recommend product classification",
      evidenceSnippet: "Category-based fallback",
      source: "FALLBACK",
    },
  ];
}

/**
 * Build decision support from report data
 */
export function buildDecisionSupport(params: {
  // HS candidates
  hsCodeCandidates?: Array<{
    code: string;
    confidence?: number;
    reason?: string;
    description?: string;
  }>;
  customsCategoryText?: string | null;
  // Cost data
  baseline: {
    costRange: {
      standard: {
        unitPrice: number;
        shippingPerUnit: number;
        dutyPerUnit: number;
        feePerUnit: number;
      };
      conservative: {
        unitPrice: number;
        shippingPerUnit: number;
        dutyPerUnit: number;
        feePerUnit: number;
      };
    };
    evidence: {
      types: string[];
    };
  };
  shelfPrice?: number | null;
  evidenceLevel?: "verified_quote" | "exact_import" | "similar_import" | "category_based";
  similarRecordsCount?: number;
  category?: string;
  priceUnit?: string;
  // Supplier data
  supplierMatchCount?: number;
}): DecisionSupport {
  const standard = params.baseline.costRange.standard;
  const conservative = params.baseline.costRange.conservative;
  const currency = params.priceUnit?.includes("per unit") ? "USD" : "USD";

  // ============ HS Section ============
  let candidates: HsCandidate[] = [];
  if (params.hsCodeCandidates && params.hsCodeCandidates.length > 0) {
    candidates = params.hsCodeCandidates.map((c) => ({
      code: c.code,
      confidence: (c.confidence ?? 0.8) * 100, // Convert to percentage
      rationale: c.reason || "From market estimate",
      evidenceSnippet: c.description || c.reason || "HS code candidate",
      source: (c as any).source || "MARKET_ESTIMATE",
    }));
  } else {
    // Generate fallbacks
    candidates = generateFallbackHsCandidates(params.category || "product");
    candidates = candidates.map((c) => ({
      ...c,
      confidence: c.confidence * 100, // Convert to percentage
    }));
  }

  const hsDutyStatus =
    candidates.some((c) => c.source !== "FALLBACK") &&
    params.evidenceLevel === "verified_quote"
      ? ("CONFIRMED" as const)
      : ("DRAFT" as const);

  const hybridPaths = (() => {
    if ((params.category || "").toLowerCase() !== "hybrid") return undefined;
    if (candidates.length < 2) return undefined;
    const primary = candidates[0];
    const secondary = candidates[1];
    return [
      {
        code: primary.code,
        label: "Candy / edible pathway",
        when: "Use when ingredients or nutrition facts are present and product is primarily consumed.",
        confidence: primary.confidence,
      },
      {
        code: secondary.code,
        label: "Toy / collectible pathway",
        when: "Use when the item is primarily a toy/collectible and candy is incidental or absent.",
        confidence: secondary.confidence,
      },
    ];
  })();

  // ============ Duty Rate Section ============
  // Estimate duty range based on HS code category
  const dutyMin = standard.dutyPerUnit > 0 ? 8 : 5;
  const dutyMax = conservative.dutyPerUnit > 0 ? 25 : 15;

  // ============ Cost Section ============
  const computeMedian = (
    val1: number,
    val2: number
  ): { min: number; mid: number; max: number } => {
    const min = Math.min(val1, val2);
    const max = Math.max(val1, val2);
    const mid = (val1 + val2) / 2;
    return { min, mid, max };
  };

  const landedPerUnit = computeMedian(
    standard.unitPrice +
      standard.shippingPerUnit +
      standard.dutyPerUnit +
      standard.feePerUnit,
    conservative.unitPrice +
      conservative.shippingPerUnit +
      conservative.dutyPerUnit +
      conservative.feePerUnit
  );

  const costConfidenceTier =
    params.evidenceLevel === "verified_quote" ||
    params.evidenceLevel === "exact_import"
      ? "high"
      : params.evidenceLevel === "similar_import"
        ? "medium"
        : "low";

  const evidenceSummaryText = (() => {
    const count = params.similarRecordsCount || 0;
    if (params.evidenceLevel === "verified_quote") {
      return "Verified supplier quote on file";
    } else if (params.evidenceLevel === "exact_import") {
      return "Exact import match found in recent shipments";
    } else if (count > 0) {
      return `Based on ${count} similar import record${count === 1 ? "" : "s"}`;
    }
    return "Category-based estimate, not verified";
  })();

  // ============ Quantity Planner Section ============
  const quantities = [100, 300, 1000];
  const quantityOptions: QuantityOption[] = quantities.map((qty) => {
    const totalLanded = {
      min: landedPerUnit.min * qty,
      mid: landedPerUnit.mid * qty,
      max: landedPerUnit.max * qty,
    };

    const totalProfit =
      params.shelfPrice && params.shelfPrice > 0
        ? {
            min: (params.shelfPrice - landedPerUnit.max) * qty,
            mid: (params.shelfPrice - landedPerUnit.mid) * qty,
            max: (params.shelfPrice - landedPerUnit.min) * qty,
          }
        : null;

    return { quantity: qty, totalLanded, totalProfit };
  });

  // ============ Profit Section ============
  // Break-even = landed cost
  const breakEvenPrice = { ...landedPerUnit };

  // Target margin prices (for 30%, 40%, 50% margins)
  const margins = [30, 40, 50];
  const targetMarginPrices: TargetMarginPrice[] = margins.map((margin) => {
    const marginDecimal = margin / 100;
    return {
      marginPercent: margin,
      requiredShelfPrice: {
        min: landedPerUnit.min / (1 - marginDecimal),
        mid: landedPerUnit.mid / (1 - marginDecimal),
        max: landedPerUnit.max / (1 - marginDecimal),
      },
    };
  });

  // Profit per unit and margin percent (if retail price provided)
  let profitPerUnit: CostPerUnit | undefined;
  let marginPercent: CostPerUnit | undefined;

  if (params.shelfPrice && params.shelfPrice > 0) {
    profitPerUnit = {
      min: params.shelfPrice - landedPerUnit.max,
      mid: params.shelfPrice - landedPerUnit.mid,
      max: params.shelfPrice - landedPerUnit.min,
    };

    marginPercent = {
      min: (profitPerUnit.min / params.shelfPrice) * 100,
      mid: (profitPerUnit.mid / params.shelfPrice) * 100,
      max: (profitPerUnit.max / params.shelfPrice) * 100,
    };
  }

  // ============ NexSupply Value Section ============
  const blockers: string[] = [];
  const whatWeDo: string[] = [];

  // Build blockers list
  if (!params.shelfPrice || params.shelfPrice <= 0) {
    blockers.push("Retail price not provided - profit margin unclear");
  }
  if (
    !params.hsCodeCandidates ||
    params.hsCodeCandidates.length === 0
  ) {
    blockers.push("HS code not confirmed - duty rate uncertain");
  }
  if (costConfidenceTier === "low") {
    blockers.push("Limited price evidence - range is wide");
  }
  if ((params.supplierMatchCount || 0) === 0) {
    blockers.push("No verified suppliers found yet");
  }

  if (blockers.length === 0) {
    blockers.push("All key data confirmed");
  }

  // Build whatWeDo list
  whatWeDo.push(
    "Find verified suppliers with competitive quotes"
  );
  whatWeDo.push("Verify HS code and estimate duty rates");
  whatWeDo.push("Calculate landed cost and profit margins");
  whatWeDo.push("Monitor import trends and pricing");

  const expectedTimeline =
    costConfidenceTier === "high"
      ? "2-3 business days to receive quotes"
      : costConfidenceTier === "medium"
        ? "3-5 business days for verification"
        : "5-7 business days for full analysis";

  return {
    hs: {
      customsCategoryText: params.customsCategoryText || null,
      status: hsDutyStatus,
      candidates,
      hybridPaths,
      decisionRule: hybridPaths
        ? "If it ships or is marketed as candy-first, classify under the food HS code. If packaging and marketing emphasize the toy/collectible, use the toy HS code and keep candy separate."
        : null,
    },
    dutyRate: {
      status: hsDutyStatus,
      rateMin: dutyMin,
      rateMax: dutyMax,
      rationale: `Estimated duty range based on HS code category (${candidates[0]?.code || "pending"})`,
    },
    cost: {
      landedPerUnit,
      componentsPerUnit: {
        factoryUnitPrice: computeMedian(
          standard.unitPrice,
          conservative.unitPrice
        ),
        shipping: computeMedian(
          standard.shippingPerUnit,
          conservative.shippingPerUnit
        ),
        duty: computeMedian(
          standard.dutyPerUnit,
          conservative.dutyPerUnit
        ),
        fees: computeMedian(
          standard.feePerUnit,
          conservative.feePerUnit
        ),
      },
      confidenceTier: costConfidenceTier,
      evidenceSummary: evidenceSummaryText,
      currency,
    },
    quantityPlanner: {
      options: quantityOptions,
    },
    profit: {
      shelfPrice: params.shelfPrice || null,
      breakEvenPrice,
      targetMarginPrices,
      ...(profitPerUnit && { profitPerUnit }),
      ...(marginPercent && { marginPercent }),
    },
    nexsupplyValue: {
      blockers,
      whatWeDo,
      expectedTimelineText: expectedTimeline,
      ctaPrimaryText: "Start verification with NexSupply",
      ctaSecondaryText: "View more suppliers",
    },
  };
}
