// @ts-nocheck
// ============================================================================
// Report Recalculation - Keep computed fields recomputable
// ============================================================================

import type { Report } from "./types";

export interface AssumptionUpdate {
  incoterms?: string;
  shipMode?: string;
  unitWeightG?: number;
  unitVolumeCbm?: number;
  packagingType?: string;
}

/**
 * Recalculate report from updated assumptions
 * This keeps computed fields (like totalLandedCost) consistent with assumptions
 */
export function recalcReportFromAssumptions(
  report: Report,
  updates: AssumptionUpdate
): Report {
  // Update assumptions in baseline
  const updatedAssumptions = {
    ...report.baseline.evidence.assumptions,
    ...(updates.incoterms && { incoterms: updates.incoterms }),
    ...(updates.shipMode && { shippingMode: updates.shipMode }),
    ...(updates.packagingType && { packaging: updates.packagingType }),
    ...(updates.unitWeightG && { weight: `${updates.unitWeightG}g` }),
    ...(updates.unitVolumeCbm && { volume: `${updates.unitVolumeCbm}m³` }),
  };

  // Recalculate costs based on new assumptions
  // This is a simplified version - in production, you'd have more sophisticated logic
  const weightMultiplier = updates.unitWeightG
    ? updates.unitWeightG / (parseFloat(report.baseline.evidence.assumptions.weight) || 1)
    : 1;

  const volumeMultiplier = updates.unitVolumeCbm
    ? updates.unitVolumeCbm / (parseFloat(report.baseline.evidence.assumptions.volume) || 1)
    : 1;

  // Adjust shipping costs based on weight/volume changes
  const shippingMultiplier = Math.max(weightMultiplier, volumeMultiplier);

  const updatedCostRange = {
    standard: {
      ...report.baseline.costRange.standard,
      shippingPerUnit: report.baseline.costRange.standard.shippingPerUnit * shippingMultiplier,
      totalLandedCost:
        report.baseline.costRange.standard.unitPrice +
        report.baseline.costRange.standard.shippingPerUnit * shippingMultiplier +
        report.baseline.costRange.standard.dutyPerUnit +
        report.baseline.costRange.standard.feePerUnit,
    },
    conservative: {
      ...report.baseline.costRange.conservative,
      shippingPerUnit: report.baseline.costRange.conservative.shippingPerUnit * shippingMultiplier,
      totalLandedCost:
        report.baseline.costRange.conservative.unitPrice +
        report.baseline.costRange.conservative.shippingPerUnit * shippingMultiplier +
        report.baseline.costRange.conservative.dutyPerUnit +
        report.baseline.costRange.conservative.feePerUnit,
    },
  };

  return {
    ...report,
    baseline: {
      ...report.baseline,
      costRange: updatedCostRange,
      evidence: {
        ...report.baseline.evidence,
        assumptions: updatedAssumptions,
      },
    },
    updatedAt: new Date().toISOString(),
  };
}
