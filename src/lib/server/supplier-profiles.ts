// @ts-nocheck
"server-only";

import { SupabaseClient } from "@supabase/supabase-js";

export interface SupplierProfile {
  supplier_id: string;
  normalized_name: string;
  display_name: string;
  role: "factory" | "trading" | "logistics" | "unknown" | null;
  role_reason: string | null;
  website_domain: string | null;
  country: string | null;
  city: string | null;
  last_seen_date: string | null;
  shipment_count_90d: number | null;
  shipment_count_12m: number | null;
  top_hs_codes: string[] | null;
  top_origins: string[] | null;
  top_destinations: string[] | null;
  consignee_count: number | null;
}

/**
 * Fetch supplier profiles with import stats for a list of supplier IDs
 */
export async function fetchSupplierProfiles(
  admin: SupabaseClient,
  supplierIds: string[]
): Promise<Map<string, SupplierProfile>> {
  if (supplierIds.length === 0) {
    return new Map();
  }

  const result = new Map<string, SupplierProfile>();

  // Check if table exists before querying (avoid PGRST205 errors)
  try {
    const { error: tableCheckError } = await admin
      .from("suppliers")
      .select("supplier_id")
      .limit(1);

    if (tableCheckError) {
      // Table doesn't exist or not accessible
      if (tableCheckError.code === "42P01" || 
          tableCheckError.code === "PGRST205" ||
          tableCheckError.message?.includes("does not exist") ||
          tableCheckError.message?.includes("not found")) {
        // Return empty map silently - table doesn't exist
        return result;
      }
      // Other error, log but return empty
      console.warn("[SupplierProfiles] Table check error:", tableCheckError.message);
      return result;
    }

    // Table exists, proceed with query
    const { data: suppliers, error } = await admin
      .from("suppliers")
      .select(`
        supplier_id,
        normalized_name,
        display_name,
        role,
        role_reason,
        website_domain,
        country,
        city
      `)
      .in("supplier_id", supplierIds);

    if (error) {
      // Don't log PGRST205 errors (table not found)
      if (error.code !== "PGRST205" && error.code !== "42P01") {
        console.warn("[SupplierProfiles] Query error:", error.message);
      }
      return result;
    }

    if (!suppliers || suppliers.length === 0) {
      return result;
    }

    // Fetch import stats for these suppliers
    const { data: stats, error: statsError } = await admin
      .from("supplier_import_stats")
      .select("*")
      .in("supplier_id", supplierIds);

    if (statsError) {
      console.error("[SupplierProfiles] Stats query error:", statsError);
      // Continue without stats
    }

    // Create stats map
    const statsMap = new Map<string, any>();
    if (stats) {
      for (const stat of stats) {
        statsMap.set(stat.supplier_id, stat);
      }
    }

    // Combine suppliers with their stats
    for (const supplier of suppliers) {
      const stat = statsMap.get(supplier.supplier_id);
      result.set(supplier.supplier_id, {
        supplier_id: supplier.supplier_id,
        normalized_name: supplier.normalized_name,
        display_name: supplier.display_name,
        role: supplier.role,
        role_reason: supplier.role_reason,
        website_domain: supplier.website_domain,
        country: supplier.country,
        city: supplier.city,
        last_seen_date: stat?.last_seen_date || null,
        shipment_count_90d: stat?.shipment_count_90d || null,
        shipment_count_12m: stat?.shipment_count_12m || null,
        top_hs_codes: stat?.top_hs_codes || null,
        top_origins: stat?.top_origins || null,
        top_destinations: stat?.top_destinations || null,
        consignee_count: stat?.consignee_count || null,
      });
    }
  } catch (error: any) {
    // Don't log PGRST205 errors
    if (error?.code !== "PGRST205" && error?.code !== "42P01") {
      console.warn("[SupplierProfiles] Unexpected error:", error?.message || error);
    }
  }

  return result;
}



