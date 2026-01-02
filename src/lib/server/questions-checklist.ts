// @ts-nocheck
/**
 * Generate category-aware questions checklist for supplier outreach
 * Category-agnostic: uses input.category only as a label, no hardcoded assumptions
 */

export interface QuestionsChecklist {
  title: string;
  items: Array<{ q: string; why: string }>;
  dynamicTitle?: string; // Optional dynamic title for agentic feel
}

export interface QuestionsChecklistInput {
  productName: string;
  category: string;
  hsCandidatesCount: number;
  hasPackagingPhoto: boolean;
  hasBarcode: boolean;
  hasUnitWeight: boolean;
  hasUnitVolume: boolean;
  hasQuotes: boolean;
  shippingMode?: "air" | "ocean" | null;
}


/**
 * Build questions checklist for supplier outreach
 * Always returns 6 items, category-agnostic
 * Dynamically reorders questions based on missing data
 */
export function buildQuestionsChecklist(
  input: QuestionsChecklistInput
): QuestionsChecklist {
  const {
    productName,
    category,
    hsCandidatesCount,
    hasPackagingPhoto,
    hasBarcode,
    hasUnitWeight,
    hasUnitVolume,
    hasQuotes,
    shippingMode,
  } = input;

  const items: Array<{ q: string; why: string }> = [];

  // Question 1: Price and unit
  if (hasQuotes) {
    items.push({
      q: "Can you confirm the unit price matches the quote and clarify the price unit?",
      why: "Unit pricing confirmation ensures the quote aligns with your cost model.",
    });
  } else {
    items.push({
      q: "What is your confirmed unit price and price unit for this item?",
      why: "Unit pricing is required to narrow the delivered cost range.",
    });
  }

  // Question 2: MOQ
  items.push({
    q: "What is the MOQ and is it flexible for a first test order?",
    why: "MOQ drives cash risk and feasibility for small reorders.",
  });

  // Question 3: Lead time
  if (hasQuotes) {
    items.push({
      q: "Can you confirm the production lead time matches the quote and fastest ready-to-ship option?",
      why: "Lead time confirmation ensures the quote timeline is realistic.",
    });
  } else {
    items.push({
      q: "What is the production lead time and fastest ready-to-ship option?",
      why: "Lead time affects reorder timing and stockout risk.",
    });
  }

  // Question 4: Specs and materials
  let q4Why = "Small spec changes can shift HS code and shipping costs.";
  if (!hasUnitWeight && !hasUnitVolume) {
    q4Why = "Specs and dimensions affect freight costs and HS classification.";
  }
  if (shippingMode === "ocean") {
    q4Why += " Carton and pallet details help optimize ocean freight.";
  }
  const specsQuestion = {
    q: "Please confirm materials, dimensions, and any variants that change cost.",
    why: q4Why,
  };

  // Question 5: Packaging details
  let q5Why = "Packaging reduces HS ambiguity and improves freight estimates.";
  if (hsCandidatesCount > 1) {
    q5Why = "Packaging photos help resolve HS code ambiguity and improve freight estimates.";
  }
  if (shippingMode === "ocean") {
    q5Why += " Carton dimensions and pallet configuration affect ocean freight costs.";
  }
  const packagingQuestion = {
    q: "Can you share packaging photos and carton pack details?",
    why: q5Why,
  };

  // Question 6: Compliance signals
  const complianceQuestion = {
    q: `Do you have the typical compliance docs for ${category} and destination?`,
    why: "Missing docs can block import or delay clearance.",
  };

  // Dynamic reordering: If unit weight missing, put specs before packaging
  // If HS candidates > 1, prioritize packaging earlier
  if (!hasUnitWeight && !hasUnitVolume) {
    // Weight missing: specs should come before packaging
    items.push(specsQuestion);
    if (hsCandidatesCount > 1) {
      // HS ambiguity: packaging should come early too
      items.push(packagingQuestion);
      items.push(complianceQuestion);
    } else {
      items.push(complianceQuestion);
      items.push(packagingQuestion);
    }
  } else if (hsCandidatesCount > 1) {
    // HS ambiguity: packaging should come before specs
    items.push(packagingQuestion);
    items.push(specsQuestion);
    items.push(complianceQuestion);
  } else {
    // Normal order
    items.push(specsQuestion);
    items.push(packagingQuestion);
    items.push(complianceQuestion);
  }

  // Dynamic title based on report signals
  const dynamicTitle = hsCandidatesCount > 1
    ? "To tighten HS code and cost range"
    : "To confirm production feasibility";

  const safeItems = Array.isArray(items) ? items : [];
  return {
    title: "What to ask",
    dynamicTitle, // Optional dynamic title for agentic feel
    items: safeItems.slice(0, 6), // Ensure exactly 6 items
  };
}

/**
 * Format checklist as plain text for copying
 */
export function formatChecklistAsText(checklist: QuestionsChecklist): string {
  const lines: string[] = [];
  lines.push(checklist.title);
  lines.push("");
  checklist.items.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.q}`);
    lines.push(`   ${item.why}`);
    lines.push("");
  });
  return lines.join("\n");
}

