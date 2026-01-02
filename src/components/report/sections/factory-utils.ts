import type { Report } from "@/lib/report/types";

export interface FactoryProfile {
  supplier_id: string;
  supplier_name: string;
  product_count: number;
  moq_median?: number;
  last_seen_at?: string;
  sample_products: string[];
}

/**
 * Build outreach email template for a factory
 */
export function buildOutreachEmail(
  report: Report,
  factory: FactoryProfile
): string {
  const companyName = factory.supplier_name;
  const productName = report.productName;

  const emailText = `Subject: Sourcing inquiry for ${productName}

Hello ${companyName} team,

We are reviewing ${productName} and would like to confirm whether you can manufacture this item or a close equivalent.

Could you please share:
1. Unit price range at MOQ
2. MOQ and lead time
3. Packaging specs and carton details
4. Material composition and key specs
5. Certifications and compliance documents available for export
6. Any similar items you currently produce

Thank you`;

  return emailText;
}

/**
 * Build checklist text
 */
export function buildChecklistText(report: Report): string {
  const content = `What to ask before you compare quotes

• Confirm manufacturer status not trader
• Confirm unit price at MOQ and price break tiers
• Confirm lead time and production capacity per month
• Confirm packaging details and carton dimensions
• Confirm material composition and required testing
• Confirm Incoterms and what is included in price`;

  return content;
}

/**
 * Create a slug from category name for file naming
 */
export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

