import { analyzeProductImage, type ImageAnalysisResult } from "./image-analysis";
import { findSupplierMatches, type SupplierMatchingParams } from "./supplier-matching";
import { calculateLandedCostForMatch } from "./landed-cost";
import type { ProductAnalysis, SupplierMatch, LandedCost } from "@/types";

export interface IntelligencePipelineParams {
  imageUrl: string;
  quantity: number;
  dutyRate: number;
  shippingCost: number;
  fee: number;
}

export interface IntelligencePipelineResult {
  analysis: ImageAnalysisResult;
  supplierMatches: SupplierMatch[];
  landedCosts: Array<{
    match: SupplierMatch;
    landedCost: LandedCost;
  }>;
}

/**
 * Complete Intelligence Pipeline:
 * 1. Image Analysis (Gemini)
 * 2. Supplier Matching (ImportKey/Supabase Cache)
 * 3. Landed Cost Calculation
 */
export async function runIntelligencePipeline(
  params: IntelligencePipelineParams
): Promise<IntelligencePipelineResult> {
  // Step 1: Image Analysis
  const analysis = await analyzeProductImage(params.imageUrl);

  // Step 2: Supplier Matching
  const matchingParams: SupplierMatchingParams = {
    productName: analysis.productName,
    category: analysis.category,
    keywords: analysis.keywords,
    attributes: analysis.attributes,
  };

  const supplierMatches = await findSupplierMatches(matchingParams);

  // Step 3: Landed Cost Calculation for each match
  const landedCosts = supplierMatches.map((match) => ({
    match,
    landedCost: calculateLandedCostForMatch(
      match,
      params.quantity,
      params.dutyRate,
      params.shippingCost,
      params.fee
    ),
  }));

  return {
    analysis,
    supplierMatches,
    landedCosts,
  };
}

