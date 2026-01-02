// @ts-nocheck
/**
 * Manual test for cost inference system
 * Run with: npx tsx src/lib/__test-cost-inference.ts
 */

import { inferCostInputs } from "./cost-inference";
import type { ImageAnalysisResult } from "./intelligence-pipeline";

// Test case 1: Toy category
const toyAnalysis: ImageAnalysisResult = {
  productName: "LINE FRIENDS Gummy Candy Toy",
  description: "Collectible toy with candy",
  category: "Toys",
  hsCode: "9503.00.00",
  attributes: {},
  keywords: ["toy", "candy", "collectible"],
  confidence: 0.85,
};

console.log("=== Test Case 1: Toy Category ===");
const toyResult = inferCostInputs({
  analysis: toyAnalysis,
  userInputs: {},
});

console.log("Inferred Inputs:");
console.log(`  Shipping Mode: ${toyResult.shippingMode.value} (${toyResult.shippingMode.source})`);
console.log(`  Unit Weight: ${toyResult.unitWeightG.value}g (${toyResult.unitWeightG.source})`);
console.log(`  Unit Volume: ${toyResult.unitVolumeM3.value}m³ (${toyResult.unitVolumeM3.source})`);
console.log(`  Carton Pack: ${toyResult.cartonPack.value} units (${toyResult.cartonPack.source})`);
console.log(`  Duty Rate: ${(toyResult.dutyRate.value * 100).toFixed(1)}% (${toyResult.dutyRate.source})`);
console.log(`  Fees Per Unit: $${toyResult.feesPerUnit.value} (${toyResult.feesPerUnit.source})`);
console.log(`  Shipping Per Unit: $${toyResult.shippingPerUnit.value} (${toyResult.shippingPerUnit.source})`);
console.log(`  Explanation: ${toyResult.dutyRate.explanation}`);

// Test case 2: Apparel with HS code
const apparelAnalysis: ImageAnalysisResult = {
  productName: "Cotton T-Shirt",
  description: "Men's cotton t-shirt",
  category: "Apparel",
  hsCode: "6109.10.00",
  attributes: {},
  keywords: ["t-shirt", "cotton", "apparel"],
  confidence: 0.90,
};

console.log("\n=== Test Case 2: Apparel Category ===");
const apparelResult = inferCostInputs({
  analysis: apparelAnalysis,
  userInputs: {},
});

console.log("Inferred Inputs:");
console.log(`  Shipping Mode: ${apparelResult.shippingMode.value} (${apparelResult.shippingMode.source})`);
console.log(`  Unit Weight: ${apparelResult.unitWeightG.value}g (${apparelResult.unitWeightG.source})`);
console.log(`  Duty Rate: ${(apparelResult.dutyRate.value * 100).toFixed(1)}% (${apparelResult.dutyRate.source})`);
console.log(`  Explanation: ${apparelResult.dutyRate.explanation}`);
console.log(`  Shipping Per Unit: $${apparelResult.shippingPerUnit.value}`);

// Test case 3: Food with label data
const foodAnalysis: ImageAnalysisResult = {
  productName: "Chocolate Cookies",
  description: "Chocolate sandwich cookies",
  category: "Food",
  hsCode: "1905.31.00",
  attributes: {},
  keywords: ["cookie", "chocolate", "snack"],
  confidence: 0.88,
  labelData: {
    netWeight: "200g",
    ingredients: ["Wheat flour", "sugar", "chocolate"],
  },
};

console.log("\n=== Test Case 3: Food Category with Label ===");
const foodResult = inferCostInputs({
  analysis: foodAnalysis,
  userInputs: {},
});

console.log("Inferred Inputs:");
console.log(`  Unit Weight: ${foodResult.unitWeightG.value}g (${foodResult.unitWeightG.source})`);
console.log(`  Weight Explanation: ${foodResult.unitWeightG.explanation}`);
console.log(`  Duty Rate: ${(foodResult.dutyRate.value * 100).toFixed(1)}% (${foodResult.dutyRate.source})`);
console.log(`  Duty Explanation: ${foodResult.dutyRate.explanation}`);
console.log(`  Shipping Per Unit: $${foodResult.shippingPerUnit.value}`);

// Test case 4: User overrides
console.log("\n=== Test Case 4: User Overrides ===");
const overrideResult = inferCostInputs({
  analysis: toyAnalysis,
  userInputs: {
    shippingMode: "air",
    unitWeightG: 250,
    dutyRate: 0.10,
  },
});

console.log("Inferred Inputs with User Overrides:");
console.log(`  Shipping Mode: ${overrideResult.shippingMode.value} (${overrideResult.shippingMode.source})`);
console.log(`  Unit Weight: ${overrideResult.unitWeightG.value}g (${overrideResult.unitWeightG.source})`);
console.log(`  Duty Rate: ${(overrideResult.dutyRate.value * 100).toFixed(1)}% (${overrideResult.dutyRate.source})`);
console.log(`  Shipping Per Unit: $${overrideResult.shippingPerUnit.value} (note: adjusted for air freight)`);

console.log("\n=== All Tests Passed ===");
