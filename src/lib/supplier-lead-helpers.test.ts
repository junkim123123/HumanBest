// @ts-nocheck
/**
 * Test helpers and QA utilities for supplier lead quality
 * Validates isLogisticsOnly() classification and material fallback logic
 * 
 * Usage for dev/testing:
 *   import { runLeadsQAChecks } from "@/lib/supplier-lead-helpers.test";
 *   runLeadsQAChecks(); // Logs test results
 */

import { isLogisticsOnly } from "./supplier-lead-helpers";

/**
 * Test cases for isLogisticsOnly() function
 * Ensures logistics companies are correctly identified
 */
export const LOGISTICS_TEST_CASES = [
  // Should be excluded (logistics-only)
  {
    name: "Shipping company with SHIPPING keyword",
    params: {
      supplierName: "Global Shipping Solutions",
      flags: {},
      categoryKey: "electronics",
    },
    expected: true,
  },
  {
    name: "Logistics company with LOGISTICS keyword",
    params: {
      supplierName: "ABC Logistics Ltd",
      flags: {},
      categoryKey: "food",
    },
    expected: true,
  },
  {
    name: "Freight forwarder with FREIGHT keyword",
    params: {
      supplierName: "Freight Forward Trading",
      flags: {},
      categoryKey: "apparel",
    },
    expected: true,
  },
  {
    name: "Express shipping with EXPRESS keyword",
    params: {
      supplierName: "Express Delivery Services",
      flags: {},
      categoryKey: "beauty",
    },
    expected: true,
  },
  {
    name: "Company with type_logistics flag",
    params: {
      supplierName: "Some Generic Company",
      flags: { type_logistics: true },
      categoryKey: "toy",
    },
    expected: true,
  },
  {
    name: "Container line with CONTAINER keyword",
    params: {
      supplierName: "Container Line Shipping Co",
      flags: {},
      categoryKey: "electronics",
    },
    expected: true,
  },

  // Should NOT be excluded (not logistics-only)
  {
    name: "Regular manufacturer",
    params: {
      supplierName: "ABC Electronics Manufacturing",
      flags: {},
      categoryKey: "electronics",
    },
    expected: false,
  },
  {
    name: "Trading company without logistics keywords",
    params: {
      supplierName: "Global Trading Co",
      flags: {},
      categoryKey: "apparel",
    },
    expected: false,
  },
  {
    name: "Actual logistics category (allowed exception)",
    params: {
      supplierName: "Specialized Logistics Services",
      flags: { type_logistics: true },
      categoryKey: "logistics",
    },
    expected: false,
  },
  {
    name: "Company with LINE keyword but non-logistics name",
    params: {
      supplierName: "Fashion Line Apparel",
      flags: {},
      categoryKey: "apparel",
    },
    expected: false, // "Line" in context of fashion is not logistics
  },
];

/**
 * Run all QA checks and log results
 * Returns count of passed/failed tests
 */
export function runLeadsQAChecks(): { passed: number; failed: number } {
  console.log("\n=== Supplier Leads Quality Assurance ===\n");

  let passed = 0;
  let failed = 0;

  // Test isLogisticsOnly() function
  console.log("Testing isLogisticsOnly() classification...\n");

  LOGISTICS_TEST_CASES.forEach((testCase, idx) => {
    const result = isLogisticsOnly(testCase.params);
    const isPass = result === testCase.expected;

    if (isPass) {
      passed++;
      console.log(`✓ Test ${idx + 1}: ${testCase.name}`);
    } else {
      failed++;
      console.log(
        `✗ Test ${idx + 1}: ${testCase.name}`
      );
      console.log(`  Expected: ${testCase.expected}, Got: ${result}`);
      console.log(`  Params:`, testCase.params);
    }
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

  return { passed, failed };
}

/**
 * Validate material fallback tightening for food category
 * Ensures food-specific queries require head nouns
 */
export function validateFoodMaterialTightening(material: string, category: string): {
  valid: boolean;
  reason: string;
} {
  const isFoodLike = category.toLowerCase().includes("food") ||
    category.toLowerCase().includes("candy") ||
    category.toLowerCase().includes("snack");

  if (!isFoodLike) {
    return {
      valid: true,
      reason: "Not a food category, standard material fallback applies",
    };
  }

  // For food, material fallback should require 2+ tokens
  const tokens = material
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);

  if (tokens.length < 2) {
    return {
      valid: false,
      reason: `Food category requires 2+ material tokens, found ${tokens.length}: ${tokens.join(", ")}`,
    };
  }

  return {
    valid: true,
    reason: `Food category: ${tokens.length} tokens sufficient for 2-token material search`,
  };
}

/**
 * Quick unit-style assertions for development
 * Usage: assertIsLogisticsOnly("ABC Logistics", {}, "electronics")
 */
export function assertIsLogisticsOnly(
  supplierName: string,
  flags: Record<string, unknown>,
  categoryKey: string,
  shouldBeTrue: boolean = true
): void {
  const result = isLogisticsOnly({ supplierName, flags, categoryKey });
  const passed = result === shouldBeTrue;

  if (!passed) {
    const expectation = shouldBeTrue ? "logistics" : "not logistics";
    throw new Error(
      `Assertion failed: "${supplierName}" in "${categoryKey}" should be ${expectation}, but got opposite result`
    );
  }
}

/**
 * Debug helper: Show which logistics keywords triggered exclusion
 */
export function debugLogisticsKeywords(supplierName: string): {
  matched: string[];
  isLogistics: boolean;
} {
  const logisticsKeywords = [
    "CONTAINER",
    "LOGISTICS",
    "FREIGHT",
    "LINE",
    "SHIPPING",
    "EXPRESS",
  ];
  const upperName = supplierName.toUpperCase();
  const matched = logisticsKeywords.filter((kw) => upperName.includes(kw));

  return {
    matched,
    isLogistics: matched.length > 0,
  };
}

// Dev-only export: Run checks when imported in development mode
if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
  // Only run in server-side development (not in browser)
  // Uncomment to enable automatic checks on import:
  // runLeadsQAChecks();
}
