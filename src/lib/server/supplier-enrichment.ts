// @ts-nocheck
"server-only";

import { SupabaseClient } from "@supabase/supabase-js";

export interface SupplierEnrichment {
  supplier_id: string;
  country_guess?: string | null;
  role_factory_pct?: number | null;
  role_trading_pct?: number | null;
  role_logistics_pct?: number | null;
  evidence_summary?: string | null;
  risk_tags?: string[];
  next_questions?: string[];
}

export interface SupplierMatchForEnrichment {
  supplierId: string;
  supplierName: string;
  supplierType?: "factory" | "trading" | "logistics" | "unknown";
  country?: string;
  evidence?: {
    recordCount: number;
    lastShipmentDate: string | null;
    productTypes: string[];
  };
  matchReason?: string;
  flags?: Record<string, unknown>;
}

/**
 * Calculate role likelihood percentages based on supplier type and evidence
 */
function calculateRoleLikelihoods(
  supplierType: "factory" | "trading" | "logistics" | "unknown" | undefined,
  evidence: SupplierMatchForEnrichment["evidence"]
): {
  factory: number;
  trading: number;
  logistics: number;
} {
  // If supplier type is known, assign high likelihood to that type
  if (supplierType === "factory") {
    return { factory: 85, trading: 10, logistics: 5 };
  }
  if (supplierType === "trading") {
    return { factory: 15, trading: 75, logistics: 10 };
  }
  if (supplierType === "logistics") {
    return { factory: 5, trading: 10, logistics: 85 };
  }
  
  // If unknown but has evidence, use evidence to infer
  if (evidence && evidence.recordCount > 0) {
    // If has product types that suggest manufacturing, favor factory
    if (evidence.productTypes.length > 0) {
      return { factory: 60, trading: 30, logistics: 10 };
    }
  }
  
  // Default: unknown/uncertain
  return { factory: 33, trading: 33, logistics: 34 };
}

/**
 * Build evidence summary one-liner
 */
function buildEvidenceSummary(
  supplierType: "factory" | "trading" | "logistics" | "unknown" | undefined,
  matchReason: string | undefined,
  evidence: SupplierMatchForEnrichment["evidence"]
): string {
  const parts: string[] = [];
  
  // Add match reason
  if (matchReason) {
    if (matchReason.includes("keyword")) {
      parts.push("Keyword match");
    } else if (matchReason.includes("category")) {
      parts.push("Category aligned");
    } else if (matchReason.includes("HS")) {
      parts.push("HS code match");
    } else {
      parts.push(matchReason);
    }
  }
  
  // Add evidence count
  if (evidence && evidence.recordCount > 0) {
    parts.push(`${evidence.recordCount} similar record${evidence.recordCount === 1 ? "" : "s"}`);
  }
  
  if (parts.length === 0) {
    return "Category-based inference";
  }
  
  return parts.join(", ");
}

/**
 * Build risk tags based on supplier data and evidence
 */
function buildRiskTags(
  supplierName: string,
  supplierType: "factory" | "trading" | "logistics" | "unknown" | undefined,
  evidence: SupplierMatchForEnrichment["evidence"],
  flags?: Record<string, unknown>
): string[] {
  const tags: string[] = [];
  const name = supplierName.toLowerCase();
  
  // Logistics risk
  if (supplierType === "logistics" || name.includes("logistics") || name.includes("shipping") || name.includes("freight")) {
    tags.push("logistics_company");
  }
  
  // Unconfirmed manufacturer
  if (supplierType !== "factory") {
    tags.push("unconfirmed_manufacturer");
  }
  
  // No pricing data
  // (This is checked elsewhere, but we can add if needed)
  
  // Category mismatch possibility
  // (This would need category context, skip for now)
  
  // Generic/dummy ID
  if (flags?.dummy_id || flags?.generic_manifest) {
    tags.push("low_quality_identifier");
  }
  
  // No product history
  if (!evidence || evidence.recordCount === 0) {
    tags.push("no_product_history");
  }
  
  return tags;
}

/**
 * Build next questions array (6 questions) based on category and supplier type
 * This is a generic template - can be customized per category later
 */
function buildNextQuestions(
  category: string,
  supplierType: "factory" | "trading" | "logistics" | "unknown" | undefined
): string[] {
  const questions = [
    "Confirm manufacturer status (not a trader or logistics company)",
    "Confirm unit price at MOQ and price break tiers",
    "Confirm lead time and production capacity per month",
    "Confirm packaging details and carton dimensions",
    "Confirm material composition and required testing",
    "Confirm Incoterms and what is included in price"
  ];
  
  // If logistics, modify first question
  if (supplierType === "logistics") {
    questions[0] = "Confirm if this company actually manufactures products (may be logistics only)";
  }
  
  return questions;
}

/**
 * Generate enrichment data for a supplier match
 */
export function generateSupplierEnrichment(
  match: SupplierMatchForEnrichment,
  category: string
): SupplierEnrichment {
  const roleLikelihoods = calculateRoleLikelihoods(match.supplierType, match.evidence);
  const evidenceSummary = buildEvidenceSummary(match.supplierType, match.matchReason, match.evidence);
  const riskTags = buildRiskTags(match.supplierName, match.supplierType, match.evidence, match.flags);
  const nextQuestions = buildNextQuestions(category, match.supplierType);
  
  return {
    supplier_id: match.supplierId,
    country_guess: match.country || null,
    role_factory_pct: roleLikelihoods.factory,
    role_trading_pct: roleLikelihoods.trading,
    role_logistics_pct: roleLikelihoods.logistics,
    evidence_summary: evidenceSummary,
    risk_tags: riskTags,
    next_questions: nextQuestions,
  };
}

/**
 * Upsert supplier enrichment data to database
 */
export async function upsertSupplierEnrichment(
  admin: SupabaseClient,
  enrichment: SupplierEnrichment
): Promise<void> {
  try {
    const { error } = await admin
      .from("supplier_enrichment")
      .upsert(
        {
          supplier_id: enrichment.supplier_id,
          country_guess: enrichment.country_guess,
          role_factory_pct: enrichment.role_factory_pct,
          role_trading_pct: enrichment.role_trading_pct,
          role_logistics_pct: enrichment.role_logistics_pct,
          evidence_summary: enrichment.evidence_summary,
          risk_tags: enrichment.risk_tags || [],
          next_questions: enrichment.next_questions || [],
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "supplier_id",
        }
      );

    if (error) {
      // Check if it's a missing table error (42P01)
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn(
          "[SupplierEnrichment] Table supplier_enrichment does not exist. " +
          "Run migration: supabase/migrations/add_supplier_enrichment.sql"
        );
      } else {
        console.error("[SupplierEnrichment] Failed to upsert enrichment:", error);
      }
      // Don't throw - enrichment errors shouldn't break the pipeline
    }
  } catch (error: any) {
    // Check if it's a missing table error
    if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
      console.warn(
        "[SupplierEnrichment] Table supplier_enrichment does not exist. " +
        "Run migration: supabase/migrations/add_supplier_enrichment.sql"
      );
    } else {
      console.error("[SupplierEnrichment] Unexpected error:", error);
    }
    // Don't throw - continue processing
  }
}

/**
 * Fetch supplier enrichment data for multiple supplier IDs
 */
export async function fetchSupplierEnrichments(
  admin: SupabaseClient,
  supplierIds: string[]
): Promise<Map<string, SupplierEnrichment>> {
  if (supplierIds.length === 0) {
    return new Map();
  }

  const result = new Map<string, SupplierEnrichment>();

  // Check if table exists before querying (avoid PGRST205 errors)
  try {
    const { error: tableCheckError } = await admin
      .from("supplier_enrichment")
      .select("supplier_id")
      .limit(1);

    if (tableCheckError) {
      // Table doesn't exist or not accessible (42P01 = relation does not exist, PGRST205 = not found)
      if (tableCheckError.code === "42P01" || 
          tableCheckError.code === "PGRST205" ||
          tableCheckError.message?.includes("does not exist") ||
          tableCheckError.message?.includes("not found")) {
        // Return empty map silently - table doesn't exist
        return result;
      }
      // Other error, log but return empty
      console.warn("[SupplierEnrichment] Table check error:", tableCheckError.message);
      return result;
    }

    // Table exists, proceed with query
    const { data, error } = await admin
      .from("supplier_enrichment")
      .select("*")
      .in("supplier_id", supplierIds);

    if (error) {
      // Don't log PGRST205 errors (table not found)
      if (error.code !== "PGRST205" && error.code !== "42P01") {
        console.warn("[SupplierEnrichment] Query error:", error.message);
      }
      return result;
    }

    if (!data) {
      return result;
    }

    for (const row of data) {
      result.set(row.supplier_id as string, {
        supplier_id: row.supplier_id as string,
        country_guess: row.country_guess as string | null,
        role_factory_pct: row.role_factory_pct as number | null,
        role_trading_pct: row.role_trading_pct as number | null,
        role_logistics_pct: row.role_logistics_pct as number | null,
        evidence_summary: row.evidence_summary as string | null,
        risk_tags: (row.risk_tags as string[]) || [],
        next_questions: (row.next_questions as string[]) || [],
      });
    }
  } catch (error: any) {
    // Don't log PGRST205 errors
    if (error?.code !== "PGRST205" && error?.code !== "42P01") {
      console.warn("[SupplierEnrichment] Unexpected error:", error?.message || error);
    }
  }

  return result;
}

