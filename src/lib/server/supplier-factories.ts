// @ts-nocheck
"server-only";

import { SupabaseClient } from "@supabase/supabase-js";

export interface FactoryProfile {
  supplier_id: string;
  supplier_name: string;
  product_count: number;
  moq_median?: number;
  last_seen_at?: string;
  sample_products: string[];
}

/**
 * Fetch factory profiles for a given category from supplier_products table
 * Identifies factories by name patterns (factory, manufacturing, mfg, etc.)
 * Returns up to 10 unique factories with their profile data
 */
export async function fetchFactoriesForCategory(
  admin: SupabaseClient,
  category: string
): Promise<FactoryProfile[]> {
  try {
    // Query supplier_products for this category
    // We'll filter by factory name patterns in memory since Supabase doesn't support OR with ilike easily
    const { data, error } = await admin
      .from("supplier_products")
      .select("supplier_id, supplier_name, product_name, moq, updated_at, created_at")
      .eq("category", category)
      .limit(500); // Get enough records to identify unique factories

    if (error) {
      console.error("[fetchFactoriesForCategory] Query error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Filter by factory name patterns
    const factoryPatterns = [
      "factory",
      "manufacturing",
      "mfg",
      "mfg.",
      "produce",
      "production",
    ];

    // Filter by factory name patterns and group by supplier_id
    const factoryMap = new Map<string, {
      supplier_id: string;
      supplier_name: string;
      products: string[];
      moqs: number[];
      maxDate: string | null;
    }>();

    for (const row of data) {
      const supplierName = (row.supplier_name as string || "").toLowerCase();
      const isFactory = factoryPatterns.some(pattern => 
        supplierName.includes(pattern.replace(/%/g, ""))
      );

      if (isFactory) {
        const sid = row.supplier_id as string;
        if (!factoryMap.has(sid)) {
          factoryMap.set(sid, {
            supplier_id: sid,
            supplier_name: row.supplier_name as string,
            products: [],
            moqs: [],
            maxDate: null,
          });
        }

        const factory = factoryMap.get(sid)!;
        const productName = row.product_name as string;
        if (!factory.products.includes(productName)) {
          factory.products.push(productName);
        }

        const moq = row.moq as number;
        if (moq && moq > 0) {
          factory.moqs.push(moq);
        }

        const date = (row.updated_at || row.created_at) as string;
        if (date && (!factory.maxDate || date > factory.maxDate)) {
          factory.maxDate = date;
        }
      }
    }

    // Convert to FactoryProfile array, sort by product count, limit to 10
    const factories: FactoryProfile[] = Array.from(factoryMap.values())
      .map((factory) => {
        const sortedMoqs = factory.moqs.sort((a, b) => a - b);
        const moqMedian = sortedMoqs.length > 0 
          ? sortedMoqs[Math.floor(sortedMoqs.length / 2)] 
          : undefined;

        return {
          supplier_id: factory.supplier_id,
          supplier_name: factory.supplier_name,
          product_count: factory.products.length,
          moq_median: moqMedian,
          last_seen_at: factory.maxDate || undefined,
          sample_products: Array.isArray(factory.products) ? factory.products.slice(0, 3) : [], // Up to 3 sample products
        };
      })
      .sort((a, b) => b.product_count - a.product_count)
      .slice(0, 10);

    return factories;
  } catch (error) {
    console.error("[fetchFactoriesForCategory] General error:", error);
    return [];
  }
}
