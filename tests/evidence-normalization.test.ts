import assert from "node:assert";
import { normalizeEvidence } from "../src/lib/report/evidence";
import type { Report } from "../src/lib/report/types";

describe("normalizeEvidence", () => {
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

  it("flags label uploaded but unreadable and weight inferred", () => {
    const report = {
      ...baseReport,
      inputStatus: { labelPhotoUploaded: true, labelOcrStatus: "FAILED" },
      pipeline_result: {
        analysis: { labelData: {} },
        label_audit: { labelOcrStatus: "FAILED", labelOcrFailureReason: "LOW_CONTRAST", labelTerms: [] },
        uploadAudit: { labelImage: true },
      },
      productSignalEvidence: { netWeightG: { value: 9 } },
    } as any;

    const evidence = normalizeEvidence(report);

    assert.strictEqual(evidence.label.uploaded, true);
    assert.strictEqual(evidence.label.extracted, false);
    assert.strictEqual(evidence.label.failureReason, "LOW_CONTRAST");
    assert.strictEqual(evidence.weight.grams, 9);
    assert.strictEqual(evidence.weight.source, "VISION_INFERENCE");
  });
});
