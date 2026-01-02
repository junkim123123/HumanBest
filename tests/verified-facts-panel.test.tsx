import assert from "node:assert";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ConfirmedFactsPanel from "../src/components/report-v2/cards/ConfirmedFactsPanel";
import type { Report } from "../src/lib/report/types";

describe("Verified facts panel", () => {
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

  it("renders unreadable label and inferred weight state", () => {
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

    const html = renderToStaticMarkup(<ConfirmedFactsPanel report={report} />);

    assert(html.includes("Provided but unreadable"));
    assert(html.toLowerCase().includes("low_contrast"));
    assert(html.includes("Inferred"));
  });
});
