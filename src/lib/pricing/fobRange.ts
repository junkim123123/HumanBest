export type MoneyRange = {
  min: number
  max: number
  currency: "USD"
  unit: "per unit"
}

export type FobRangeResult = {
  fobUnitPriceRange: MoneyRange
  fobUnitPriceRangeTightened: MoneyRange
  rangeMethod: string
  source: "internal_records" | "supplier_prices" | "llm_baseline" | "category_default"
  confidenceTier: "low" | "medium" | "high"
  similarRecordsCount: number
}

function clampRatio(range: MoneyRange, maxRatio: number): MoneyRange {
  const min = Math.max(0.01, range.min)
  const max = Math.max(min, range.max)
  if (max / min <= maxRatio) return { ...range, min, max }
  const mid = (min + max) / 2
  const half = (mid * maxRatio - mid) / maxRatio
  const newMin = Math.max(0.01, mid - half)
  const newMax = Math.max(newMin, mid + half)
  return { ...range, min: newMin, max: newMax }
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const a = sorted[base] ?? sorted[sorted.length - 1]
  const b = sorted[base + 1] ?? sorted[sorted.length - 1]
  return a + rest * (b - a)
}

function normalize(values: number[]): number[] {
  return values
    .filter(v => Number.isFinite(v))
    .map(v => Math.max(0.01, v))
    .sort((a, b) => a - b)
}

function tighten(range: MoneyRange, count: number): MoneyRange {
  const mid = (range.min + range.max) / 2
  const spread = range.max - range.min

  if (count >= 30) {
    return clampRatio(
      { ...range, min: mid - spread * 0.15, max: mid + spread * 0.15 },
      1.6
    )
  }

  if (count >= 10) {
    return clampRatio(
      { ...range, min: mid - spread * 0.12, max: mid + spread * 0.12 },
      1.7
    )
  }

  return clampRatio(
    { ...range, min: mid - spread * 0.20, max: mid + spread * 0.20 },
    1.8
  )
}

export function computeFobRangeFromInternalRecords(
  unitValuesRaw: number[],
  currency: "USD" = "USD"
): { range: MoneyRange; method: string; confidenceTier: "low" | "medium" | "high"; count: number } {
  const values = normalize(unitValuesRaw)
  const n = values.length
  const unit: "per unit" = "per unit"

  if (n >= 30) {
    const r: MoneyRange = { min: quantile(values, 0.20), max: quantile(values, 0.80), currency, unit }
    return { range: clampRatio(r, 3.0), method: "p20p80", confidenceTier: "high", count: n }
  }

  if (n >= 10) {
    const r: MoneyRange = { min: quantile(values, 0.25), max: quantile(values, 0.75), currency, unit }
    return { range: clampRatio(r, 3.0), method: "p25p75", confidenceTier: "medium", count: n }
  }

  if (n >= 3) {
    const r: MoneyRange = { min: values[0], max: values[n - 1], currency, unit }
    return { range: clampRatio(r, 2.0), method: "minmax_clamp2", confidenceTier: "low", count: n }
  }

  if (n >= 1) {
    const med = values[0]
    const r: MoneyRange = { min: med * 0.65, max: med * 1.35, currency, unit }
    return { range: clampRatio(r, 2.0), method: "single_pm35", confidenceTier: "low", count: n }
  }

  const fallback: MoneyRange = { min: 0.35, max: 0.75, currency, unit }
  return { range: fallback, method: "category_default", confidenceTier: "low", count: 0 }
}

export function computeFobRangeFromSupplierPrices(
  unitPricesRaw: number[],
  currency: "USD" = "USD"
): { range: MoneyRange; method: string; confidenceTier: "low" | "medium" | "high"; count: number } {
  const values = normalize(unitPricesRaw)
  const n = values.length
  const unit: "per unit" = "per unit"

  if (n >= 10) {
    const r: MoneyRange = { min: quantile(values, 0.20), max: quantile(values, 0.80), currency, unit }
    return { range: clampRatio(r, 2.5), method: "supplier_p20p80", confidenceTier: "high", count: n }
  }

  if (n >= 3) {
    const r: MoneyRange = { min: values[0], max: values[n - 1], currency, unit }
    return { range: clampRatio(r, 2.0), method: "supplier_minmax_clamp2", confidenceTier: "medium", count: n }
  }

  if (n >= 1) {
    const med = values[0]
    const r: MoneyRange = { min: med * 0.70, max: med * 1.30, currency, unit }
    return { range: clampRatio(r, 1.8), method: "supplier_single_pm30", confidenceTier: "medium", count: n }
  }

  const fallback: MoneyRange = { min: 0.35, max: 0.75, currency, unit }
  return { range: fallback, method: "category_default", confidenceTier: "low", count: 0 }
}

export function buildFobRangeResult(args: {
  internalUnitValues?: number[]
  supplierUnitPrices?: number[]
  categoryDefault?: MoneyRange
  currency?: "USD"
}): FobRangeResult {
  const currency = args.currency ?? "USD"
  const unit: "per unit" = "per unit"

  const categoryDefault = args.categoryDefault ?? { min: 0.35, max: 0.75, currency, unit }

  const supplier = computeFobRangeFromSupplierPrices(args.supplierUnitPrices ?? [], currency)
  if ((args.supplierUnitPrices ?? []).length > 0 && supplier.count > 0) {
    return {
      fobUnitPriceRange: supplier.range,
      fobUnitPriceRangeTightened: tighten(supplier.range, supplier.count),
      rangeMethod: supplier.method,
      source: "supplier_prices",
      confidenceTier: supplier.confidenceTier,
      similarRecordsCount: supplier.count,
    }
  }

  const internal = computeFobRangeFromInternalRecords(args.internalUnitValues ?? [], currency)
  if ((args.internalUnitValues ?? []).length > 0 && internal.count > 0) {
    return {
      fobUnitPriceRange: internal.range,
      fobUnitPriceRangeTightened: tighten(internal.range, internal.count),
      rangeMethod: internal.method,
      source: "internal_records",
      confidenceTier: internal.confidenceTier,
      similarRecordsCount: internal.count,
    }
  }

  return {
    fobUnitPriceRange: categoryDefault,
    fobUnitPriceRangeTightened: tighten(categoryDefault, 0),
    rangeMethod: "category_default",
    source: "category_default",
    confidenceTier: "low",
    similarRecordsCount: 0,
  }
}
