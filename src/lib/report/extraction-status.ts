import type { Report } from "./types";

export type ExtractionStatus =
  | "verified"
  | "inferred"
  | "could_not_read"
  | "not_provided"
  | "not_readable";

export interface ExtractionSnapshot {
  hasBarcodeImage: boolean;
  hasLabelImage: boolean;
  barcodeValue: string | null;
  weightGrams: number | null;
  weightSource: "confirmed" | "inferred" | "default" | "unknown";
  originCountry: string | null;
  labelTerms: string[];
  labelTextPresent: boolean;
}

export interface ExtractionStatuses {
  barcode: ExtractionStatus;
  labelText: ExtractionStatus;
  weight: ExtractionStatus;
  origin: ExtractionStatus;
  snapshot: ExtractionSnapshot;
}

export interface EffectiveWeight {
  value: number | null;
  source: "confirmed" | "inferred" | "default" | "unknown";
}

const normalizeWeight = (value: unknown): number | null => {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

export function resolveEffectiveWeight(report: Report): EffectiveWeight {
  const reportAny = report as any;
  const inputStatus = reportAny._proof?.inputStatus || reportAny.inputStatus || {};
  const analysis = reportAny.pipeline_result?.analysis || {};
  const inferredInputs = reportAny.baseline?.evidence?.inferredInputs || {};
  const draftWeight = reportAny.weightDraft?.value ?? reportAny._draft?.assumptionsDraft?.unitWeightDraft?.value;

  const confirmedWeight =
    normalizeWeight(reportAny.weightConfirmed?.value) ??
    normalizeWeight(inputStatus.unitWeight) ??
    normalizeWeight(reportAny.weightGrams);

  if (confirmedWeight) {
    return { value: confirmedWeight, source: "confirmed" };
  }

  const inferredWeight =
    normalizeWeight(draftWeight) ??
    normalizeWeight(analysis?.labelData?.netWeight) ??
    normalizeWeight(reportAny.productSignalEvidence?.netWeightG?.value ?? reportAny.productSignalEvidence?.netWeightG) ??
    normalizeWeight(analysis?.weight);

  if (inferredWeight) {
    return { value: inferredWeight, source: "inferred" };
  }

  const defaultWeight = normalizeWeight(inferredInputs?.unitWeightG?.value);
  if (defaultWeight) {
    return { value: defaultWeight, source: "default" };
  }

  return { value: null, source: "unknown" };
}

export function deriveExtractionSnapshot(report: Report): ExtractionSnapshot {
  const reportAny = report as any;
  const inputStatus = reportAny._proof?.inputStatus || reportAny.inputStatus || {};
  const labelDraft = inputStatus.labelDraft || reportAny._draft?.labelDraft || {};
  const analysis = reportAny.pipeline_result?.analysis || {};
  const uploadAudit = reportAny.pipeline_result?.uploadAudit || reportAny.uploadAudit || reportAny.data?.uploadAudit || {};
  const labelData = analysis?.labelData || {};

  const { value: weightGrams, source: weightSource } = resolveEffectiveWeight(report);

  const hasBarcodeImage = Boolean(
    inputStatus.barcodePhotoUploaded ??
    reportAny.hasBarcodeImage ??
    uploadAudit.barcodeImage ??
    uploadAudit.barcodePhotoUploaded ??
    (reportAny.data ? (reportAny.data as any).barcode_image_url : undefined)
  );

  const hasLabelImage = Boolean(
    inputStatus.labelPhotoUploaded ??
    reportAny.hasLabelImage ??
    uploadAudit.labelImage ??
    uploadAudit.labelPhotoUploaded ??
    reportAny.label_uploaded ??
    (reportAny.data ? (reportAny.data as any).label_image_url : undefined)
  );

  const barcodeValue =
    inputStatus.barcode ||
    reportAny.upc ||
    reportAny.barcodeValue ||
    analysis?.barcode ||
    null;

  const originCountry =
    reportAny.originLabel ||
    inputStatus.originCountry ||
    inputStatus.countryOfOrigin ||
    labelDraft?.originCountryDraft?.value ||
    labelData?.originCountry ||
    reportAny.countryOfOrigin ||
    null;

  const termsFromIngredients = asStringArray(labelData.ingredients);
  const termsFromMaterial = asStringArray(labelData.material);
  const termsFromReport = asStringArray(reportAny.labelTerms);
  const labelTerms =
    termsFromIngredients.length > 0
      ? termsFromIngredients
      : termsFromMaterial.length > 0
        ? termsFromMaterial
        : termsFromReport;

  const labelTextPresent = Boolean(
    (labelTerms && labelTerms.length > 0) ||
    labelData.text ||
    labelData.rawText ||
    reportAny.labelTextPresent
  );

  return {
    hasBarcodeImage,
    hasLabelImage,
    barcodeValue,
    weightGrams,
    weightSource,
    originCountry,
    labelTerms,
    labelTextPresent,
  };
}

export function getExtractionStatuses(report: Report): ExtractionStatuses {
  const snapshot = deriveExtractionSnapshot(report);

  const barcode: ExtractionStatus = snapshot.barcodeValue
    ? "verified"
    : snapshot.hasBarcodeImage
      ? "could_not_read"
      : "not_provided";

  const labelText: ExtractionStatus = snapshot.labelTextPresent
    ? "verified"
    : snapshot.hasLabelImage
      ? "not_readable"
      : "not_provided";

  const weight: ExtractionStatus = snapshot.weightGrams
    ? snapshot.weightSource === "confirmed"
      ? "verified"
      : "inferred"
    : "not_provided";

  const origin: ExtractionStatus = snapshot.originCountry ? "verified" : "not_provided";

  return {
    barcode,
    labelText,
    weight,
    origin,
    snapshot,
  };
}