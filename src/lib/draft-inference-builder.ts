/**
 * Default draft inference builder
 * Creates a complete draftInference object with sensible defaults
 * Each field has value, confidence, evidenceSnippet, and source
 */

export interface DraftFieldValue<T> {
  value: T;
  confidence: number; // 0-100
  evidenceSnippet: string;
  source: "DEFAULT" | "VISION" | "GEMINI" | "DATABASE" | "USER_INPUT";
}

export interface DraftInference {
  labelDraft: {
    originCountryDraft: DraftFieldValue<string | null>;
    netWeightDraft: DraftFieldValue<string | null>;
    allergensDraft: DraftFieldValue<string[] | null>;
    brandDraft: DraftFieldValue<string | null>;
    productNameDraft: DraftFieldValue<string | null>;
  };
  barcodeDraft: DraftFieldValue<string | null>;
  weightDraft: DraftFieldValue<number | null> & { unit: string };
  casePackDraft: DraftFieldValue<Array<{ value: number; unit: string }> | null>;
  customsCategoryDraft: DraftFieldValue<string | null>;
  hsCandidatesDraft: DraftFieldValue<
    Array<{ code: string; confidence: number; reason: string }> | null
  >;
}

/**
 * Create a default draftInference with sensible category-based defaults
 */
export function createDefaultDraftInference(
  category?: string
): DraftInference {
  const categoryLower = (category || "").toLowerCase();

  // Default weight by category (in grams)
  let defaultWeight = 50;
  let defaultCasePack = [12, 24, 48];

  if (categoryLower.includes("candy") || categoryLower.includes("confection")) {
    defaultWeight = 25;
    defaultCasePack = [120, 240, 480];
  } else if (
    categoryLower.includes("snack") ||
    categoryLower.includes("chip") ||
    categoryLower.includes("pretzel")
  ) {
    defaultWeight = 30;
    defaultCasePack = [30, 60, 120];
  } else if (
    categoryLower.includes("beverage") ||
    categoryLower.includes("drink") ||
    categoryLower.includes("water")
  ) {
    defaultWeight = 250;
    defaultCasePack = [24, 30, 48];
  } else if (
    categoryLower.includes("electronics") ||
    categoryLower.includes("gadget")
  ) {
    defaultWeight = 400;
    defaultCasePack = [10, 20, 50];
  } else if (categoryLower.includes("fan")) {
    defaultWeight = 1200;
    defaultCasePack = [5, 10, 20];
  }

  return {
    labelDraft: {
      originCountryDraft: {
        value: null,
        confidence: 0,
        evidenceSnippet: "Not visible on label",
        source: "DEFAULT",
      },
      netWeightDraft: {
        value: null,
        confidence: 0,
        evidenceSnippet: "Not visible on label",
        source: "DEFAULT",
      },
      allergensDraft: {
        value: null,
        confidence: 0,
        evidenceSnippet: "Not visible on label",
        source: "DEFAULT",
      },
      brandDraft: {
        value: null,
        confidence: 0,
        evidenceSnippet: "Not visible on label",
        source: "DEFAULT",
      },
      productNameDraft: {
        value: null,
        confidence: 0,
        evidenceSnippet: "Not visible on label",
        source: "DEFAULT",
      },
    },
    barcodeDraft: {
      value: null,
      confidence: 0,
      evidenceSnippet: "Not captured",
      source: "DEFAULT",
    },
    weightDraft: {
      value: defaultWeight,
      unit: "g",
      confidence: 20, // Low confidence on category default
      evidenceSnippet: `Category default for ${category || "product"}`,
      source: "DEFAULT",
    },
    casePackDraft: {
      value: defaultCasePack.map((qty) => ({
        value: qty,
        unit: "units per carton",
      })),
      confidence: 15,
      evidenceSnippet: `Category defaults for ${category || "product"}`,
      source: "DEFAULT",
    },
    customsCategoryDraft: {
      value: null,
      confidence: 0,
      evidenceSnippet: "Requires manual input or HS code inference",
      source: "DEFAULT",
    },
    hsCandidatesDraft: {
      value: null,
      confidence: 0,
      evidenceSnippet: "Requires product analysis",
      source: "DEFAULT",
    },
  };
}

/**
 * Merge draftInference overrides on top of defaults
 * Useful for incorporating Gemini or vision results
 */
export function mergeDraftInference(
  defaults: DraftInference,
  overrides: Partial<DraftInference>
): DraftInference {
  return {
    labelDraft: {
      ...defaults.labelDraft,
      ...(overrides.labelDraft || {}),
    },
    barcodeDraft: overrides.barcodeDraft || defaults.barcodeDraft,
    weightDraft: overrides.weightDraft || defaults.weightDraft,
    casePackDraft: overrides.casePackDraft || defaults.casePackDraft,
    customsCategoryDraft:
      overrides.customsCategoryDraft || defaults.customsCategoryDraft,
    hsCandidatesDraft: overrides.hsCandidatesDraft || defaults.hsCandidatesDraft,
  };
}
