// @ts-nocheck
import { SupabaseClient } from "@supabase/supabase-js";

export interface SupplierIntel {
  records_count: number;
  product_count: number;
  last_seen_at: string | null;
  priced_count: number;
  price_coverage_pct: number;
  price_min: number | null;
  price_median: number | null;
  price_max: number | null;
  moq_median: number | null;
  top_hs_codes: string[];
  top_origins: string[];
  total_quantity: number | null;
  total_weight: number | null;
  sample_products: string[];
}

/**
 * Fetch supplier intel for given supplier IDs from supplier_products table
 * Returns a map keyed by supplier_id with intel data
 * Uses simple queries without RPC functions for reliability
 */
export async function fetchSupplierIntel(
  admin: SupabaseClient,
  supplierIds: string[]
): Promise<Map<string, SupplierIntel>> {
  if (supplierIds.length === 0) {
    return new Map();
  }

  const result = new Map<string, SupplierIntel>();

  try {
    // Fetch all relevant data in one query
    const { data: allData, error: queryError } = await admin
      .from("supplier_products")
      .select("supplier_id, supplier_name, product_name, unit_price, moq, hs_code, updated_at, created_at, product_description")
      .in("supplier_id", supplierIds);

    if (queryError || !allData) {
      console.error("[SupplierIntel] Query error:", queryError);
      return result;
    }

    // Group by supplier_id and compute metrics
    const bySupplier = new Map<string, {
      records: any[];
      products: Set<string>;
      prices: number[];
      moqs: number[];
      hsCodes: Map<string, number>;
      maxDate: string | null;
    }>();

    for (const row of allData) {
      const sid = row.supplier_id as string;
      if (!bySupplier.has(sid)) {
        bySupplier.set(sid, {
          records: [],
          products: new Set(),
          prices: [],
          moqs: [],
          hsCodes: new Map(),
          maxDate: null,
        });
      }
      const group = bySupplier.get(sid)!;
      group.records.push(row);
      group.products.add(row.product_name as string);

      const price = row.unit_price as number;
      if (price && price > 0) {
        group.prices.push(price);
      }

      const moq = row.moq as number;
      if (moq && moq > 0) {
        group.moqs.push(moq);
      }

      const hsCode = row.hs_code as string | null;
      if (hsCode && hsCode !== "00000000" && hsCode.trim() !== "") {
        group.hsCodes.set(hsCode, (group.hsCodes.get(hsCode) || 0) + 1);
      }

      const date = (row.updated_at || row.created_at) as string;
      if (date && (!group.maxDate || date > group.maxDate)) {
        group.maxDate = date;
      }
    }

    // Build result with computed metrics
    for (const [sid, group] of bySupplier.entries()) {
      const prices = group.prices.sort((a, b) => a - b);
      const moqs = group.moqs.sort((a, b) => a - b);
      const hsCodesEntries = Array.from(group.hsCodes.entries());
      const topHs = hsCodesEntries
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([code]) => code);

      // Get sample products (newest first, up to 2)
      const samples = Array.from(group.products)
        .map((pname) => {
          const record = group.records.find((r) => r.product_name === pname);
          return {
            name: pname,
            created_at: (record?.created_at || record?.updated_at) as string,
          };
        })
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 2)
        .map((s) => s.name);

      result.set(sid, {
        records_count: group.records.length,
        product_count: group.products.size,
        last_seen_at: group.maxDate,
        priced_count: prices.length,
        price_coverage_pct: group.records.length > 0 ? (prices.length / group.records.length) * 100 : 0,
        price_min: prices.length > 0 ? prices[0] : null,
        price_median: prices.length > 0 ? prices[Math.floor(prices.length / 2)] : null,
        price_max: prices.length > 0 ? prices[prices.length - 1] : null,
        moq_median: moqs.length > 0 ? moqs[Math.floor(moqs.length / 2)] : null,
        top_hs_codes: topHs,
        top_origins: [], // TODO: Parse from product_description if needed
        total_quantity: null, // TODO: Parse from product_description if needed
        total_weight: null, // TODO: Parse from product_description if needed
        sample_products: samples,
      });
    }
  } catch (error) {
    console.error("[SupplierIntel] Unexpected error:", error);
    // Return partial result if any
  }

  return result;
}

/**
 * Infer supplier type from internal intel data
 * Uses only existing data - no external APIs
 */
export interface SupplierTypeInference {
  type: "Manufacturer" | "Trading" | "Logistics" | "Unknown";
  confidence: "high" | "medium" | "low";
  reason: string;
}

export function inferSupplierType(
  intel: SupplierIntel | null,
  supplierName: string,
  flags?: Record<string, unknown>
): SupplierTypeInference {
  const nameLower = (supplierName || "").toLowerCase();
  
  // Check for logistics patterns in name or flags
  const hasLogisticsPattern = 
    nameLower.includes("logistics") ||
    nameLower.includes("forwarding") ||
    nameLower.includes("freight") ||
    nameLower.includes("shipping") ||
    nameLower.includes("cargo") ||
    nameLower.includes("transport") ||
    flags?.type_logistics === true;
  
  if (hasLogisticsPattern) {
    return {
      type: "Logistics",
      confidence: "high",
      reason: "Signals suggest a logistics or forwarding company.",
    };
  }
  
  // Check for factory/manufacturing patterns
  const hasFactoryPattern =
    nameLower.includes("factory") ||
    nameLower.includes("manufacturing") ||
    nameLower.includes("mfg") ||
    nameLower.includes("industrial") ||
    nameLower.includes("co ltd") ||
    nameLower.includes("plant") ||
    nameLower.includes("production") ||
    nameLower.includes("works");
  
  // Manufacturer heuristics: high product count, good pricing coverage, factory patterns
  if (intel) {
    const hasHighProductCount = intel.product_count >= 10;
    const hasGoodPricing = intel.price_coverage_pct > 0;
    const hasFactorySignals = hasFactoryPattern;
    
    if (hasHighProductCount && hasGoodPricing && hasFactorySignals) {
      return {
        type: "Manufacturer",
        confidence: "high",
        reason: "Name and dataset signals suggest a manufacturing operator.",
      };
    }
    
    if (hasHighProductCount && hasGoodPricing) {
      return {
        type: "Manufacturer",
        confidence: "medium",
        reason: "Dataset signals suggest a manufacturing operator.",
      };
    }
    
    // Trading heuristics: moderate product count, weak pricing, or many distinct categories
    const hasModerateProductCount = intel.product_count >= 3 && intel.product_count < 10;
    const hasWeakPricing = intel.price_coverage_pct === 0 || intel.price_coverage_pct < 30;
    
    if (hasModerateProductCount && (hasWeakPricing || intel.top_hs_codes.length > 3)) {
      return {
        type: "Trading",
        confidence: "medium",
        reason: "Signals suggest a trading or intermediary supplier.",
      };
    }
    
    if (hasFactorySignals && hasModerateProductCount) {
      return {
        type: "Manufacturer",
        confidence: "medium",
        reason: "Name signals suggest a manufacturing operator.",
      };
    }
  }
  
  // Default: Unknown
  return {
    type: "Unknown",
    confidence: "low",
    reason: "Not enough evidence to classify yet.",
  };
}

