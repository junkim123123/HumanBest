import assert from "node:assert";
import { getExtractionStatuses, deriveExtractionSnapshot } from "../src/lib/report/extraction-status";
import type { Report } from "../src/lib/report/types";

describe("extraction status mapping", () => {
  const baseReport = {
    id: "r1",
    productName: "Test",
    summary: "",
    category: "snack",
    confidence: "low",
    evidenceLevel: "category_prior",
    signals: { hasImportEvidence: false, hasInternalSimilarRecords: false, hasSupplierCandidates: false, verificationStatus: "none" },
    baseline: {
      costRange: { conservative: { unitPrice: 0, shippingPerUnit: 0, dutyPerUnit: 0, feePerUnit: 0, totalLandedCost: 0 }, standard: { unitPrice: 0, shippingPerUnit: 0, dutyPerUnit: 0, feePerUnit: 0, totalLandedCost: 0 } },
      riskScores: { tariff: 0, compliance: 0, supply: 0, total: 0 },
      riskFlags: {
        tariff: { hsCodeRange: [], adCvdPossible: false, originSensitive: false },
        compliance: { requiredCertifications: [], labelingRisks: [], recallHints: [] },
        supply: { moqRange: { min: 0, max: 0, typical: 0 }, leadTimeRange: { min: 0, max: 0, typical: 0 }, qcChecks: [] },
      },
    },
  } as Report;

  it("marks barcode verified when value present", () => {
    const snapshot = deriveExtractionSnapshot({
      ...baseReport,
      inputStatus: { barcodePhotoUploaded: true, barcode: "12345" },
    });
    const { barcode } = getExtractionStatuses({ ...baseReport, ...snapshot } as Report);
    assert.strictEqual(barcode, "verified");
  });

  it("marks barcode could_not_read when image present but no value", () => {
    const { barcode } = getExtractionStatuses({
      ...baseReport,
      inputStatus: { barcodePhotoUploaded: true },
    } as Report);
    assert.strictEqual(barcode, "could_not_read");
  });

  it("marks label text not_readable when label photo uploaded but no terms", () => {
    const { labelText } = getExtractionStatuses({
      ...baseReport,
      inputStatus: { labelPhotoUploaded: true },
    } as Report);
    assert.strictEqual(labelText, "not_readable");
  });

  it("marks label text verified when terms exist", () => {
    const { labelText } = getExtractionStatuses({
      ...baseReport,
      pipeline_result: { analysis: { labelData: { ingredients: ["sugar", "salt"] } } },
    } as any);
    assert.strictEqual(labelText, "verified");
  });

  it("uses default when weight missing", () => {
    const { weight } = getExtractionStatuses(baseReport);
    assert.strictEqual(weight, "not_provided");
  });

  it("marks weight inferred when present", () => {
    const { weight } = getExtractionStatuses({
      ...baseReport,
      inputStatus: { unitWeight: 120 },
    } as Report);
    assert.strictEqual(weight, "inferred");
  });
});
