// @ts-nocheck
/**
 * Lightweight company type heuristic based on supplier name keywords
 * Shared between server and client - pure functions only, no server-only imports
 */

export type CompanyType = 
  | "machinery"
  | "industrial"
  | "logistics"
  | "bio_chemical"
  | "retail_brand"
  | "manufacturer"
  | "trader"
  | "unknown";

/**
 * Infer company type from supplier name using keyword matching
 */
export function inferCompanyType(supplierName: string): CompanyType {
  if (!supplierName || typeof supplierName !== "string") {
    return "unknown";
  }

  const nameLower = supplierName.toLowerCase();

  // Machinery patterns
  if (
    nameLower.includes("machinery") ||
    nameLower.includes("machine") ||
    nameLower.includes("equipment") ||
    nameLower.includes("tool") ||
    nameLower.includes("machinery co") ||
    nameLower.includes("machinery ltd")
  ) {
    return "machinery";
  }

  // Industrial patterns
  if (
    nameLower.includes("industrial") ||
    nameLower.includes("industry") ||
    nameLower.includes("steel") ||
    nameLower.includes("metal") ||
    nameLower.includes("chemical") ||
    nameLower.includes("petroleum") ||
    nameLower.includes("mining")
  ) {
    // Check if it's bio/chemical specifically
    if (nameLower.includes("bio") || nameLower.includes("pharma")) {
      return "bio_chemical";
    }
    return "industrial";
  }

  // Logistics patterns
  if (
    nameLower.includes("logistics") ||
    nameLower.includes("freight") ||
    nameLower.includes("shipping") ||
    nameLower.includes("forwarding") ||
    nameLower.includes("transport") ||
    nameLower.includes("cargo") ||
    nameLower.includes("express") ||
    nameLower.includes("courier") ||
    nameLower.includes("sea air") ||
    nameLower.includes("air sea")
  ) {
    return "logistics";
  }

  // Bio/Chemical patterns
  if (
    nameLower.includes("bio") ||
    nameLower.includes("pharma") ||
    nameLower.includes("chemical") ||
    nameLower.includes("pharmaceutical")
  ) {
    return "bio_chemical";
  }

  // Retail/Brand patterns
  if (
    nameLower.includes("retail") ||
    nameLower.includes("brand") ||
    nameLower.includes("trading") ||
    nameLower.includes("import export") ||
    nameLower.includes("import/export")
  ) {
    return "retail_brand";
  }

  // Manufacturer patterns (positive signals)
  if (
    nameLower.includes("manufacturing") ||
    nameLower.includes("manufacture") ||
    nameLower.includes("mfg") ||
    nameLower.includes("factory") ||
    nameLower.includes("co ltd") ||
    nameLower.includes("limited") ||
    nameLower.includes("ltd") ||
    nameLower.includes("co.,") ||
    nameLower.includes("industries")
  ) {
    return "manufacturer";
  }

  // Trader patterns
  if (
    nameLower.includes("trading") ||
    nameLower.includes("trade") ||
    nameLower.includes("import") ||
    nameLower.includes("export") ||
    nameLower.includes("supply")
  ) {
    return "trader";
  }

  return "unknown";
}

/**
 * Check if a company type should be excluded for a given category
 */
export function shouldExcludeCompanyType(
  companyType: CompanyType,
  category: string
): boolean {
  const categoryLower = category.toLowerCase();

  // Food category: exclude machinery, industrial, logistics
  if (categoryLower.includes("food") || categoryLower.includes("candy") || categoryLower.includes("snack")) {
    return companyType === "machinery" || 
           companyType === "industrial" || 
           companyType === "logistics";
  }

  // Toys category: exclude machinery, industrial, logistics, bio_chemical
  if (categoryLower.includes("toy") || categoryLower.includes("game")) {
    return companyType === "machinery" || 
           companyType === "industrial" || 
           companyType === "logistics" ||
           companyType === "bio_chemical";
  }

  // Beauty category: exclude machinery, industrial, logistics
  if (categoryLower.includes("beauty") || categoryLower.includes("cosmetic")) {
    return companyType === "machinery" || 
           companyType === "industrial" || 
           companyType === "logistics";
  }

  // Home category: exclude machinery, industrial, logistics, bio_chemical
  if (categoryLower.includes("home") || categoryLower.includes("kitchen")) {
    return companyType === "machinery" || 
           companyType === "industrial" || 
           companyType === "logistics" ||
           companyType === "bio_chemical";
  }

  return false;
}

/**
 * Get exclusion reason for a company type
 */
export function getExclusionReason(companyType: CompanyType): string {
  switch (companyType) {
    case "machinery":
      return "Machinery company, not a product manufacturer";
    case "industrial":
      return "Industrial supplier, not relevant for consumer goods";
    case "logistics":
      return "Logistics/forwarding company, not a manufacturer";
    case "bio_chemical":
      return "Bio/chemical company, not relevant for this category";
    default:
      return "Not relevant for this category";
  }
}

