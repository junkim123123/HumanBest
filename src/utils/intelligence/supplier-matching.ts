import { createClient } from "@/utils/supabase/server";
import type { SupplierMatch } from "@/types";

export interface SupplierMatchingParams {
  productName: string;
  category: string;
  keywords: string[];
  attributes: Record<string, string>;
}

export async function findSupplierMatches(
  params: SupplierMatchingParams
): Promise<SupplierMatch[]> {
  const supabase = await createClient();

  // Search in Supabase cache first
  // This is a placeholder - implement actual search logic based on your schema
  const { data, error } = await supabase
    .from("supplier_products")
    .select("*")
    .ilike("product_name", `%${params.productName}%`)
    .limit(10);

  if (error) {
    console.error("Error fetching supplier matches:", error);
    return [];
  }

  // Transform and score matches
  const matches: SupplierMatch[] = (data || []).map((item) => ({
    supplierId: item.supplier_id,
    supplierName: item.supplier_name || "Unknown Supplier",
    productName: item.product_name,
    unitPrice: item.unit_price || 0,
    moq: item.moq || 1,
    leadTime: item.lead_time || 0,
    matchScore: calculateMatchScore(item, params),
    importKeyId: item.import_key_id || null,
  }));

  // Sort by match score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

function calculateMatchScore(
  item: Record<string, unknown>,
  params: SupplierMatchingParams
): number {
  let score = 0;

  // Name similarity (0-50 points)
  const nameSimilarity = calculateStringSimilarity(
    params.productName.toLowerCase(),
    (item.product_name as string)?.toLowerCase() || ""
  );
  score += nameSimilarity * 50;

  // Category match (0-30 points)
  if (item.category === params.category) {
    score += 30;
  }

  // Keyword matches (0-20 points)
  const keywordMatches = params.keywords.filter((keyword) =>
    (item.product_name as string)?.toLowerCase().includes(keyword.toLowerCase())
  );
  score += (keywordMatches.length / params.keywords.length) * 20;

  return Math.min(100, Math.round(score));
}

function calculateStringSimilarity(str1: string, str2: string): number {
  // Simple similarity calculation - you may want to use a more sophisticated algorithm
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

