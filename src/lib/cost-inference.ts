// @ts-nocheck
/**
 * Cost Inference System
 * Provides deterministic defaults for cost model inputs when user values are missing.
 * Uses category priors, HS code data, and stable heuristics.
 */

import type { ImageAnalysisResult, MarketEstimate } from "./intelligence-pipeline";
import type { CategoryKey } from "./category-profiles";
import { determineCategoryKey, getCategoryProfile } from "./category-profiles";

export type InferenceSource = "assumed" | "from_category" | "from_customs" | "from_hs_estimate" | "user" | "vision" | "label";

type ConfidenceLabel = "low" | "medium" | "high";

export interface RangeTriple {
  p10: number;
  p50: number;
  p90: number;
}

export interface InferredInput<T> {
  value: T;
  source: InferenceSource;
  confidence: number; // 0-100
  explanation: string;
  provenance?: "user" | "label_verified" | "vision_inferred" | "category_default";
  range?: RangeTriple;
}

export interface InferredInputs {
  shippingMode: InferredInput<"air" | "ocean">;
  unitWeightG: InferredInput<number>;
  unitVolumeM3: InferredInput<number>;
  cartonPack: InferredInput<number>;
  billableWeightKg: InferredInput<number>;
  dutyRate: InferredInput<number>;
  feesPerUnit: InferredInput<number>;
  shippingPerUnit: InferredInput<number>;
}

const toConfidenceLabel = (confidence: number): ConfidenceLabel => {
  if (confidence >= 80) return "high";
  if (confidence >= 60) return "medium";
  return "low";
};

const buildRange = (value: number, confidence: number, floor = 0): RangeTriple => {
  const label = toConfidenceLabel(confidence);
  const spread = label === "high" ? 0.08 : label === "medium" ? 0.18 : 0.35;
  const p10 = Math.max(floor, Number((value * (1 - spread)).toFixed(4)));
  const p90 = Math.max(floor, Number((value * (1 + spread)).toFixed(4)));
  return { p10, p50: Number(value.toFixed(4)), p90 };
};

// Category-specific cost priors (per unit in USD)
const CATEGORY_PRIORS: Record<CategoryKey, {
  weightG: number;
  volumeM3: number;
  cartonPack: number;
  dutyRate: number;
  feesPerUnit: number;
  baseShippingAir: number;
  baseShippingOcean: number;
}> = {
  toy: {
    weightG: 150,
    volumeM3: 0.0008, // 20cm x 20cm x 20cm
    cartonPack: 24,
    dutyRate: 0.00, // Most toys duty-free
    feesPerUnit: 0.25,
    baseShippingAir: 0.45,
    baseShippingOcean: 0.12,
  },
  food: {
    weightG: 200,
    volumeM3: 0.0006,
    cartonPack: 12,
    dutyRate: 0.05,
    feesPerUnit: 0.35,
    baseShippingAir: 0.60,
    baseShippingOcean: 0.15,
  },
  hybrid: {
    weightG: 180,
    volumeM3: 0.0007,
    cartonPack: 18,
    dutyRate: 0.03,
    feesPerUnit: 0.30,
    baseShippingAir: 0.52,
    baseShippingOcean: 0.13,
  },
  electronics: {
    weightG: 300,
    volumeM3: 0.001,
    cartonPack: 6,
    dutyRate: 0.025,
    feesPerUnit: 0.45,
    baseShippingAir: 0.90,
    baseShippingOcean: 0.20,
  },
  apparel: {
    weightG: 250,
    volumeM3: 0.0012,
    cartonPack: 12,
    dutyRate: 0.165, // Average apparel duty
    feesPerUnit: 0.30,
    baseShippingAir: 0.50,
    baseShippingOcean: 0.10,
  },
  beauty: {
    weightG: 120,
    volumeM3: 0.0004,
    cartonPack: 24,
    dutyRate: 0.065,
    feesPerUnit: 0.40,
    baseShippingAir: 0.38,
    baseShippingOcean: 0.08,
  },
  home_kitchen: {
    weightG: 400,
    volumeM3: 0.0015,
    cartonPack: 12,
    dutyRate: 0.08,
    feesPerUnit: 0.35,
    baseShippingAir: 0.80,
    baseShippingOcean: 0.18,
  },
  furniture: {
    weightG: 5000,
    volumeM3: 0.05,
    cartonPack: 1,
    dutyRate: 0.00,
    feesPerUnit: 1.20,
    baseShippingAir: 8.50,
    baseShippingOcean: 2.00,
  },
  hardware: {
    weightG: 350,
    volumeM3: 0.001,
    cartonPack: 12,
    dutyRate: 0.05,
    feesPerUnit: 0.40,
    baseShippingAir: 0.75,
    baseShippingOcean: 0.16,
  },
  chemical: {
    weightG: 500,
    volumeM3: 0.001,
    cartonPack: 12,
    dutyRate: 0.06,
    feesPerUnit: 0.50,
    baseShippingAir: 1.20,
    baseShippingOcean: 0.25,
  },
  packaging: {
    weightG: 100,
    volumeM3: 0.001,
    cartonPack: 100,
    dutyRate: 0.03,
    feesPerUnit: 0.10,
    baseShippingAir: 0.30,
    baseShippingOcean: 0.06,
  },
  industrial_parts: {
    weightG: 800,
    volumeM3: 0.002,
    cartonPack: 6,
    dutyRate: 0.045,
    feesPerUnit: 0.60,
    baseShippingAir: 1.50,
    baseShippingOcean: 0.30,
  },
  jewelry_accessories: {
    weightG: 50,
    volumeM3: 0.0002,
    cartonPack: 36,
    dutyRate: 0.115,
    feesPerUnit: 0.35,
    baseShippingAir: 0.20,
    baseShippingOcean: 0.04,
  },
  stationery_office: {
    weightG: 100,
    volumeM3: 0.0005,
    cartonPack: 24,
    dutyRate: 0.04,
    feesPerUnit: 0.20,
    baseShippingAir: 0.30,
    baseShippingOcean: 0.06,
  },
  pet: {
    weightG: 300,
    volumeM3: 0.001,
    cartonPack: 12,
    dutyRate: 0.05,
    feesPerUnit: 0.35,
    baseShippingAir: 0.70,
    baseShippingOcean: 0.15,
  },
};

// HS2-based duty rate lookup (common HS2 chapters)
const HS2_DUTY_RATES: Record<string, { rate: number; description: string }> = {
  "17": { rate: 0.05, description: "Sugars and sugar confectionery" },
  "18": { rate: 0.04, description: "Cocoa and cocoa preparations" },
  "19": { rate: 0.055, description: "Cereal, flour, starch, milk preparations" },
  "20": { rate: 0.08, description: "Vegetable, fruit, nut preparations" },
  "21": { rate: 0.06, description: "Miscellaneous edible preparations" },
  "33": { rate: 0.065, description: "Essential oils and perfumery" },
  "39": { rate: 0.065, description: "Plastics and articles thereof" },
  "42": { rate: 0.10, description: "Leather articles" },
  "61": { rate: 0.165, description: "Knitted apparel" },
  "62": { rate: 0.165, description: "Woven apparel" },
  "63": { rate: 0.115, description: "Made-up textile articles" },
  "64": { rate: 0.125, description: "Footwear" },
  "73": { rate: 0.05, description: "Iron or steel articles" },
  "84": { rate: 0.025, description: "Machinery" },
  "85": { rate: 0.025, description: "Electrical machinery" },
  "94": { rate: 0.00, description: "Furniture" },
  "95": { rate: 0.00, description: "Toys and sports equipment" },
};

/**
 * Infer all cost model inputs from available data
 */
export function inferCostInputs(params: {
  analysis: ImageAnalysisResult;
  marketEstimate?: MarketEstimate;
  userInputs?: Partial<{
    shippingMode: "air" | "ocean";
    unitWeightG: number;
    unitVolumeM3: number;
    cartonPack: number;
    dutyRate: number;
  }>;
}): InferredInputs {
  const { analysis, marketEstimate, userInputs } = params;

  // Determine category
  const categoryKey = determineCategoryKey({
    category: analysis.category,
    keywords: analysis.keywords,
    hsCode: analysis.hsCode,
    productName: analysis.productName,
  });
  const categoryPrior = CATEGORY_PRIORS[categoryKey];

  // Extract HS2 from analysis or market estimate
  const hs2 = extractHs2(analysis, marketEstimate);
  const hs2DutyData = hs2 ? HS2_DUTY_RATES[hs2] : null;

  // Infer shipping mode (default: ocean for efficiency)
  const shippingMode = inferShippingMode(categoryKey, userInputs?.shippingMode);

  // Infer unit weight
  const unitWeightG = inferUnitWeight(analysis, categoryPrior, marketEstimate, userInputs?.unitWeightG);

  // Infer unit volume
  const unitVolumeM3 = inferUnitVolume(analysis, categoryPrior, userInputs?.unitVolumeM3);

  // Infer carton pack
  const cartonPack = inferCartonPack(categoryPrior, userInputs?.cartonPack);

  // Compute billable weight using volumetric divisor (5,000 cm rule => 200 kg per m3)
  const billableWeightKg = computeBillableWeightKg(unitWeightG, unitVolumeM3);

  // Infer duty rate
  const dutyRate = inferDutyRate(hs2DutyData, categoryPrior, marketEstimate, userInputs?.dutyRate);

  // Infer fees per unit
  const feesPerUnit = inferFeesPerUnit(categoryPrior, analysis);

  // Infer shipping per unit (depends on mode, weight, volume)
  const shippingPerUnit = inferShippingPerUnit({
    shippingMode,
    unitWeight: unitWeightG,
    unitVolume: unitVolumeM3,
    billableWeightKg,
    categoryPrior,
  });

  return {
    shippingMode,
    unitWeightG,
    unitVolumeM3,
    cartonPack,
    billableWeightKg,
    dutyRate,
    feesPerUnit,
    shippingPerUnit,
  };
}

function extractHs2(analysis: ImageAnalysisResult, marketEstimate?: MarketEstimate): string | null {
  // Priority 1: analysis HS code
  if (analysis.hsCode) {
    const digits = analysis.hsCode.replace(/\D/g, "");
    if (digits.length >= 2) return digits.slice(0, 2);
  }

  // Priority 2: market estimate HS candidates (top candidate)
  if (marketEstimate?.hsCodeCandidates && marketEstimate.hsCodeCandidates.length > 0) {
    const topCandidate = marketEstimate.hsCodeCandidates[0];
    const digits = topCandidate.code.replace(/\D/g, "");
    if (digits.length >= 2) return digits.slice(0, 2);
  }

  return null;
}

function inferShippingMode(
  categoryKey: CategoryKey,
  userInput?: "air" | "ocean"
): InferredInput<"air" | "ocean"> {
  if (userInput) {
    return {
      value: userInput,
      source: "user",
      confidence: 100,
      explanation: "User specified shipping mode",
      provenance: "user",
      range: { p10: userInput === "air" ? 1 : 1, p50: userInput === "air" ? 1 : 1, p90: userInput === "air" ? 1 : 1 },
    };
  }

  // Default to ocean (more common, lower cost)
  return {
    value: "ocean",
    source: "assumed",
    confidence: 70,
    explanation: "Ocean shipping assumed (most common for imports)",
    provenance: "category_default",
    range: { p10: 1, p50: 1, p90: 1 },
  };
}

function inferUnitWeight(
  analysis: ImageAnalysisResult,
  categoryPrior: typeof CATEGORY_PRIORS[CategoryKey],
  marketEstimate?: MarketEstimate,
  userInput?: number
): InferredInput<number> {
  if (userInput) {
    return {
      value: userInput,
      source: "user",
      confidence: 100,
      explanation: "User specified weight",
      provenance: "user",
      range: buildRange(userInput, 100),
    };
  }

  // Try to extract from label data
  if (analysis.labelData?.netWeight) {
    const extracted = parseWeightFromLabel(analysis.labelData.netWeight);
    if (extracted) {
      return {
        value: extracted,
        source: "from_customs",
        confidence: 85,
        explanation: `Extracted from product label: ${analysis.labelData.netWeight}`,
        provenance: "label_verified",
        range: buildRange(extracted, 85),
      };
    }
  }

  // Try market estimate observed suppliers
  // Note: observedSuppliers don't currently include weight data
  // This is a placeholder for future enhancement
  if (marketEstimate?.observedSuppliers && marketEstimate.observedSuppliers.length > 0) {
    // Weight data not available in observedSuppliers yet
    // Fall through to category prior
  }

  // Fall back to category prior
  return {
    value: categoryPrior.weightG,
    source: "from_category",
    confidence: 60,
    explanation: `Category average for similar products`,
    provenance: "category_default",
    range: buildRange(categoryPrior.weightG, 60),
  };
}

function parseWeightFromLabel(netWeight: string): number | null {
  // Parse common weight formats: "150g", "0.15kg", "5.3 oz", etc.
  const match = netWeight.match(/(\d+\.?\d*)\s*(g|kg|oz|lb)/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  // Convert to grams
  if (unit === "g") return value;
  if (unit === "kg") return value * 1000;
  if (unit === "oz") return value * 28.35;
  if (unit === "lb") return value * 453.59;

  return null;
}

function inferUnitVolume(
  analysis: ImageAnalysisResult,
  categoryPrior: typeof CATEGORY_PRIORS[CategoryKey],
  userInput?: number
): InferredInput<number> {
  if (userInput) {
    return {
      value: userInput,
      source: "user",
      confidence: 100,
      explanation: "User specified volume",
      provenance: "user",
      range: buildRange(userInput, 100, 0.0001),
    };
  }

  // Volume is rarely available, use category prior
  return {
    value: categoryPrior.volumeM3,
    source: "from_category",
    confidence: 50,
    explanation: "Category average volume",
    provenance: "category_default",
    range: buildRange(categoryPrior.volumeM3, 50, 0.0001),
  };
}

function inferCartonPack(
  categoryPrior: typeof CATEGORY_PRIORS[CategoryKey],
  userInput?: number
): InferredInput<number> {
  return {
    value: userInput ?? 1,
    source: userInput ? "user" : "assumed",
    confidence: userInput ? 100 : 30,
    explanation: userInput
      ? "User specified units per shipment"
      : "Auto-set to 1 unit shipment per requirement",
    provenance: userInput ? "user" : "category_default",
    range: { p10: 1, p50: userInput ?? 1, p90: userInput ?? 1 },
  };
}

function inferDutyRate(
  hs2DutyData: { rate: number; description: string } | null,
  categoryPrior: typeof CATEGORY_PRIORS[CategoryKey],
  marketEstimate?: MarketEstimate,
  userInput?: number
): InferredInput<number> {
  if (userInput !== undefined) {
    return {
      value: userInput,
      source: "assumed",
      confidence: 100,
      explanation: "User specified duty rate",
      provenance: "user",
      range: buildRange(userInput, 100),
    };
  }

  // Priority 1: HS2-based duty rate
  if (hs2DutyData) {
    return {
      value: hs2DutyData.rate,
      source: "from_hs_estimate",
      confidence: 80,
      explanation: `Based on HS chapter: ${hs2DutyData.description}`,
      provenance: "label_verified",
      range: buildRange(hs2DutyData.rate, 80),
    };
  }

  // Priority 2: Market estimate duty hints (if available)
  // Note: Market estimate doesn't currently provide duty rates, but we plan to add it

  // Priority 3: Category prior
  return {
    value: categoryPrior.dutyRate,
    source: "from_category",
    confidence: 65,
    explanation: "Average duty rate for category",
    provenance: "category_default",
    range: buildRange(categoryPrior.dutyRate, 65),
  };
}

function inferFeesPerUnit(
  categoryPrior: typeof CATEGORY_PRIORS[CategoryKey],
  analysis: ImageAnalysisResult
): InferredInput<number> {
  // Fees are consistent per category
  return {
    value: categoryPrior.feesPerUnit,
    source: "from_category",
    confidence: 70,
    explanation: "Typical customs and handling fees",
    provenance: "category_default",
    range: buildRange(categoryPrior.feesPerUnit, 70),
  };
}

function computeBillableWeightKg(
  unitWeight: InferredInput<number>,
  unitVolume: InferredInput<number>
): InferredInput<number> {
  const volumetricKg = (volume: number) => volume * 200; // 1 m3 = 200 kg using 5,000 divisor
  const weightKg = (grams: number) => grams / 1000;

  const value = Math.max(weightKg(unitWeight.value), volumetricKg(unitVolume.value));
  const range: RangeTriple = {
    p10: Math.max(weightKg(unitWeight.range?.p10 ?? unitWeight.value), volumetricKg(unitVolume.range?.p10 ?? unitVolume.value)),
    p50: Math.max(weightKg(unitWeight.range?.p50 ?? unitWeight.value), volumetricKg(unitVolume.range?.p50 ?? unitVolume.value)),
    p90: Math.max(weightKg(unitWeight.range?.p90 ?? unitWeight.value), volumetricKg(unitVolume.range?.p90 ?? unitVolume.value)),
  };

  const confidence = Math.min(unitWeight.confidence, unitVolume.confidence);
  return {
    value,
    source: unitWeight.source,
    confidence,
    explanation: "Billable weight from physical and volumetric weight",
    provenance: unitWeight.provenance || unitVolume.provenance || "category_default",
    range,
  };
}

function inferShippingPerUnit(params: {
  shippingMode: InferredInput<"air" | "ocean">;
  unitWeight: InferredInput<number>;
  unitVolume: InferredInput<number>;
  billableWeightKg: InferredInput<number>;
  categoryPrior: typeof CATEGORY_PRIORS[CategoryKey];
}): InferredInput<number> {
  const { shippingMode, unitWeight, unitVolume, billableWeightKg, categoryPrior } = params;

  // Base shipping cost from category
  const baseShipping =
    shippingMode.value === "air" ? categoryPrior.baseShippingAir : categoryPrior.baseShippingOcean;

  // Adjust for weight deviation from category average (±20% per 50% weight difference)
  const weightRatio = unitWeight.value / categoryPrior.weightG;
  const weightAdjustment = (weightRatio - 1) * 0.4; // 40% sensitivity

  // Adjust for volume deviation (similar logic)
  const volumeRatio = unitVolume.value / categoryPrior.volumeM3;
  const volumeAdjustment = (volumeRatio - 1) * 0.3; // 30% sensitivity

  // Combined adjustment (cap at ±50%)
  const totalAdjustment = Math.max(-0.5, Math.min(0.5, weightAdjustment + volumeAdjustment));

  const adjustedShipping = baseShipping * (1 + totalAdjustment);

  // Build range using weight/volume ranges
  const adjustWith = (weightVal: number, volumeVal: number) => {
    const wRatio = weightVal / categoryPrior.weightG;
    const vRatio = volumeVal / categoryPrior.volumeM3;
    const wAdj = (wRatio - 1) * 0.4;
    const vAdj = (vRatio - 1) * 0.3;
    const combined = Math.max(-0.5, Math.min(0.5, wAdj + vAdj));
    return Number((baseShipping * (1 + combined)).toFixed(2));
  };

  const range: RangeTriple = {
    p10: adjustWith(unitWeight.range?.p10 ?? unitWeight.value, unitVolume.range?.p10 ?? unitVolume.value),
    p50: Number(adjustedShipping.toFixed(2)),
    p90: adjustWith(unitWeight.range?.p90 ?? unitWeight.value, unitVolume.range?.p90 ?? unitVolume.value),
  };

  const explanation =
    shippingMode.value === "air"
      ? "Air freight estimate based on weight and volume"
      : "Ocean freight estimate (FCL/LCL blended)";

  return {
    value: Number(adjustedShipping.toFixed(2)),
    source: shippingMode.source === "user" ? "user" : "from_category",
    confidence: Math.min(shippingMode.confidence, billableWeightKg.confidence, 65),
    explanation,
    provenance: shippingMode.provenance || "category_default",
    range,
  };
}

/**
 * Get shipping mode multiplier for air vs ocean
 */
export function getShippingModeMultiplier(mode: "air" | "ocean"): number {
  return mode === "air" ? 3.5 : 1.0;
}
