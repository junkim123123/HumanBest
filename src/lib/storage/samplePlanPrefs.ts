// @ts-nocheck
// ============================================================================
// Sample Plan Preferences Storage
// ============================================================================

const STORAGE_KEY = "nexsupply_sample_plan_prefs_v1";

export interface SamplePlanPrefs {
  stateCode: string;
  city: string | null;
  deadlineDays: number;
  sampleQty: number;
  sendVia: "whatsapp" | "email";
  includePackaging: boolean;
  includeCerts: boolean;
  includeUpcAndLabel: boolean;
  noteToSupplier: string | null;
}

const DEFAULT_PREFS: SamplePlanPrefs = {
  stateCode: "MO",
  city: "St. Louis",
  deadlineDays: 7,
  sampleQty: 3,
  sendVia: "whatsapp",
  includePackaging: true,
  includeCerts: true,
  includeUpcAndLabel: true,
  noteToSupplier: null,
};

export function getSamplePlanPrefs(): SamplePlanPrefs {
  if (typeof window === "undefined") {
    return DEFAULT_PREFS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFS;
    }

    const parsed = JSON.parse(stored);
    
    // Validate and merge with defaults
    return {
      stateCode: parsed.stateCode || DEFAULT_PREFS.stateCode,
      city: parsed.city || DEFAULT_PREFS.city,
      deadlineDays: parsed.deadlineDays || DEFAULT_PREFS.deadlineDays,
      sampleQty: parsed.sampleQty || DEFAULT_PREFS.sampleQty,
      sendVia: parsed.sendVia || DEFAULT_PREFS.sendVia,
      includePackaging: parsed.includePackaging !== undefined ? parsed.includePackaging : DEFAULT_PREFS.includePackaging,
      includeCerts: parsed.includeCerts !== undefined ? parsed.includeCerts : DEFAULT_PREFS.includeCerts,
      includeUpcAndLabel: parsed.includeUpcAndLabel !== undefined ? parsed.includeUpcAndLabel : DEFAULT_PREFS.includeUpcAndLabel,
      noteToSupplier: parsed.noteToSupplier || DEFAULT_PREFS.noteToSupplier,
    };
  } catch (error) {
    console.error("[Sample Plan Prefs] Failed to parse preferences:", error);
    return DEFAULT_PREFS;
  }
}

export function setSamplePlanPrefs(prefs: SamplePlanPrefs): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error("[Sample Plan Prefs] Failed to save preferences:", error);
  }
}

