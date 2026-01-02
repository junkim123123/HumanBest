/**
 * Pure functions for profit and margin calculations
 * Used by Scale Planner
 */

export interface DeliveredCostRange {
  min: number;
  mid: number;
  max: number;
}

export interface ProfitPerUnitRange {
  min: number;
  mid: number;
  max: number;
}

export interface TotalProfitRange {
  min: number;
  mid: number;
  max: number;
}

export interface GrossMarginPercentRange {
  min: number;
  mid: number;
  max: number;
}

export interface CashOutRange {
  min: number;
  mid: number;
  max: number;
}

export interface ScalePlannerCalculations {
  profitPerUnitRange: ProfitPerUnitRange;
  totalProfitRange: TotalProfitRange;
  grossMarginPercentRange: GrossMarginPercentRange;
  cashOutRange: CashOutRange;
}

/**
 * Calculate profit per unit
 * profitPerUnit = shelfPrice - deliveredCost
 */
export function calculateProfitPerUnit(
  shelfPrice: number,
  deliveredCostRange: DeliveredCostRange
): ProfitPerUnitRange {
  return {
    min: shelfPrice - deliveredCostRange.max,
    mid: shelfPrice - deliveredCostRange.mid,
    max: shelfPrice - deliveredCostRange.min,
  };
}

/**
 * Calculate total profit
 * totalProfit = profitPerUnit * quantity
 */
export function calculateTotalProfit(
  profitPerUnitRange: ProfitPerUnitRange,
  quantity: number
): TotalProfitRange {
  return {
    min: profitPerUnitRange.min * quantity,
    mid: profitPerUnitRange.mid * quantity,
    max: profitPerUnitRange.max * quantity,
  };
}

/**
 * Calculate gross margin percent
 * grossMarginPercent = (profitPerUnit / shelfPrice) * 100
 */
export function calculateGrossMarginPercent(
  profitPerUnitRange: ProfitPerUnitRange,
  shelfPrice: number
): GrossMarginPercentRange {
  if (shelfPrice === 0) {
    return { min: 0, mid: 0, max: 0 };
  }

  return {
    min: (profitPerUnitRange.min / shelfPrice) * 100,
    mid: (profitPerUnitRange.mid / shelfPrice) * 100,
    max: (profitPerUnitRange.max / shelfPrice) * 100,
  };
}

/**
 * Calculate cash out (total landed cost)
 * cashOut = deliveredCost * quantity
 */
export function calculateCashOut(
  deliveredCostRange: DeliveredCostRange,
  quantity: number
): CashOutRange {
  return {
    min: deliveredCostRange.min * quantity,
    mid: deliveredCostRange.mid * quantity,
    max: deliveredCostRange.max * quantity,
  };
}

/**
 * Complete scale planner calculations
 */
export function calculateScalePlanner(
  shelfPrice: number | null | undefined,
  deliveredCostRange: DeliveredCostRange,
  quantity: number
): ScalePlannerCalculations | null {
  // Validate inputs
  if (!shelfPrice || shelfPrice <= 0) {
    return null;
  }

  if (quantity <= 0 || quantity > 1000000000) {
    return null;
  }

  // Calculate all ranges
  const profitPerUnitRange = calculateProfitPerUnit(shelfPrice, deliveredCostRange);
  const totalProfitRange = calculateTotalProfit(profitPerUnitRange, quantity);
  const grossMarginPercentRange = calculateGrossMarginPercent(profitPerUnitRange, shelfPrice);
  const cashOutRange = calculateCashOut(deliveredCostRange, quantity);

  return {
    profitPerUnitRange,
    totalProfitRange,
    grossMarginPercentRange,
    cashOutRange,
  };
}

/**
 * Clamp quantity to safe range
 */
export function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(1000000000, Math.floor(quantity)));
}
