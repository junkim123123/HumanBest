import type { LandedCost, SupplierMatch } from "@/types";

export interface LandedCostParams {
  unitPrice: number;
  quantity: number;
  dutyRate: number; // decimal (e.g., 0.15 for 15%)
  shippingCost: number;
  fee: number;
}

export function calculateLandedCost(
  params: LandedCostParams
): LandedCost {
  const { unitPrice, dutyRate, shippingCost, fee } = params;

  // Formula: Unit * (1+Duty) + Shipping + Fee
  const unitWithDuty = unitPrice * (1 + dutyRate);
  const totalLandedCost = unitWithDuty + shippingCost + fee;

  return {
    unitPrice,
    dutyRate,
    shippingCost,
    fee,
    totalLandedCost,
    formula: `Unit * (1+Duty) + Shipping + Fee = ${unitPrice} * (1+${dutyRate}) + ${shippingCost} + ${fee} = ${totalLandedCost.toFixed(2)}`,
  };
}

export function calculateLandedCostForMatch(
  match: SupplierMatch,
  quantity: number,
  dutyRate: number,
  shippingCost: number,
  fee: number
): LandedCost {
  return calculateLandedCost({
    unitPrice: match.unitPrice,
    quantity,
    dutyRate,
    shippingCost: shippingCost / quantity, // per unit shipping
    fee: fee / quantity, // per unit fee
  });
}

