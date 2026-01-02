// @ts-nocheck
"use client";

import React, { forwardRef, useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { recalcReportFromAssumptions } from "@/lib/report/recalc";
import { formatCurrency } from "@/lib/utils/format";
import type { Report } from "@/lib/report/types";
import { useShelfPrice } from "@/contexts/ShelfPriceContext";
import { TitleBlock } from "./TitleBlock";
import { InsightBanner } from "@/components/marketing/home/InsightBanner";

interface SectionAdjustProps {
  isActive?: boolean;
}

const DEMO_REPORT: Report = {
  schemaVersion: 1,
  id: "demo",
  productName: "Demo Product",
  summary: "",
  category: "toy",
  confidence: "medium",
  signals: {
    hasImportEvidence: false,
    hasInternalSimilarRecords: false,
    hasSupplierCandidates: false,
    verificationStatus: "none",
  },
  baseline: {
    costRange: {
      conservative: {
        unitPrice: 0.85,
        shippingPerUnit: 1.50,
        dutyPerUnit: 0.21,
        feePerUnit: 0.10,
        totalLandedCost: 2.66,
      },
      standard: {
        unitPrice: 0.75,
        shippingPerUnit: 1.20,
        dutyPerUnit: 0.19,
        feePerUnit: 0.08,
        totalLandedCost: 2.22,
      },
    },
    riskScores: { tariff: 0, compliance: 0, supply: 0, total: 0 },
    riskFlags: {
      tariff: { hsCodeRange: [], adCvdPossible: false, originSensitive: false },
      compliance: { requiredCertifications: [], labelingRisks: [], recallHints: [] },
      supply: { moqRange: { min: 0, max: 0, typical: 0 }, leadTimeRange: { min: 0, max: 0, typical: 0 }, qcChecks: [] },
    },
    evidence: {
      types: [],
      assumptions: {
        packaging: "",
        weight: "150g",
        volume: "0.0015 m³",
        incoterms: "FOB",
        shippingMode: "Air Express",
      },
      items: [],
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastResult: null,
      lastErrorCode: null,
    },
  },
  verification: { status: "not_requested" },
  nextActions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const SectionAdjust = forwardRef<HTMLElement, SectionAdjustProps>(function SectionAdjust(
  { isActive = false }: SectionAdjustProps,
  ref
) {
    const { shelfPrice, setShelfPrice } = useShelfPrice();
    const [unitWeightG, setUnitWeightG] = useState(150);
    const [unitVolumeCbm, setUnitVolumeCbm] = useState(0.0015);
    const [shipMode, setShipMode] = useState<"Air" | "Ocean">("Air");

    const report = useMemo(() => {
      if (!isActive) return DEMO_REPORT;
      const shipModeValue = shipMode === "Air" ? "Air Express" : "Ocean Freight";
      return recalcReportFromAssumptions(DEMO_REPORT, {
        unitWeightG,
        unitVolumeCbm,
        shipMode: shipModeValue,
      });
    }, [unitWeightG, unitVolumeCbm, shipMode, isActive]);

    const totalValue = report.baseline.costRange.standard.totalLandedCost;
    const fobValue = Math.max(report.baseline.costRange.standard.unitPrice, 0.5);
    const freightValue = Math.max(report.baseline.costRange.standard.shippingPerUnit, 0.5);
    const dutyValue = Math.max(report.baseline.costRange.standard.dutyPerUnit, 0.1);
    const feesValue = Math.max(report.baseline.costRange.standard.feePerUnit, 0.05);

    const totalForStack = fobValue + freightValue + dutyValue + feesValue;
    const fobPercent = (fobValue / totalForStack) * 100;
    const freightPercent = (freightValue / totalForStack) * 100;
    const dutyPercent = (dutyValue / totalForStack) * 100;
    const feesPercent = (feesValue / totalForStack) * 100;

    // Check if retail price is valid
    const hasRetailPrice = shelfPrice !== null && shelfPrice > 0 && Number.isFinite(shelfPrice);

    // Calculate profit per unit (sell price - landed cost)
    const profitPerUnit = useMemo(() => {
      if (hasRetailPrice) {
        return shelfPrice! - totalValue;
      }
      return null;
    }, [hasRetailPrice, shelfPrice, totalValue]);

    // Calculate current margin percent
    const currentMarginPercent = useMemo(() => {
      if (hasRetailPrice && profitPerUnit !== null) {
        return (profitPerUnit / shelfPrice!) * 100;
      }
      return null;
    }, [hasRetailPrice, shelfPrice, profitPerUnit]);

    // Cost breakdown items for the list (retail terms)
    const costBreakdown = [
      { label: "Factory price", value: fobValue },
      { label: "Shipping", value: freightValue },
      { label: "Import tax", value: dutyValue },
      { label: "Clearance fees", value: feesValue },
    ];
    
    // Find biggest cost driver
    const biggestDriver = costBreakdown.reduce((max, cost) => cost.value > max.value ? cost : max);
    const isShippingBiggest = biggestDriver.label === "Shipping";

    // Format helpers
    function formatMoney(n: number) {
      const v = Number.isFinite(n) ? n : 0;
      return v.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    function formatPct(n: number) {
      const v = Number.isFinite(n) ? n : 0;
      return v.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    }

    const SAMPLE_RETAIL_PRICE = 4.99;

    // Retail price input - compact version for top controls
    function RetailPriceInput(props: {
      value: number | null;
      onChange: (v: number | null) => void;
      onUseSample?: () => void;
    }) {
      const { value, onChange, onUseSample } = props;
      const isEmpty = value === null || value === 0;
      return (
        <div className="w-full">
          <div className="flex items-baseline gap-2 mb-1.5">
            <label htmlFor="adjust-retail-price-input" className="text-xs font-medium text-slate-600">
              Retail price
            </label>
            {onUseSample && isEmpty && (
              <button
                type="button"
                onClick={onUseSample}
                className="text-xs font-medium text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded transition-colors leading-none"
                aria-label="Use sample retail price"
              >
                Use sample
              </button>
            )}
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 tabular-nums text-sm">
              $
            </span>
            <input
              id="adjust-retail-price-input"
              inputMode="decimal"
              value={value !== null && value > 0 ? value : ""}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) : null;
                onChange(val && val > 0 ? val : null);
              }}
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur pl-6 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white tabular-nums transition-all"
              placeholder="Enter retail price"
              aria-label="Retail price in dollars"
              aria-describedby="adjust-retail-price-description"
            />
          </div>
          <p id="adjust-retail-price-description" className="mt-1 text-xs text-slate-500 max-[820px]:hidden">
            Excludes sales tax and overhead.
          </p>
        </div>
      );
    }

    return (
      <section ref={ref} id="adjust" className="slide-section bg-white">
        <div className="landing-slide-inner">
          {/* Title */}
          <div className="mb-5">
            <TitleBlock
              eyebrow="ADJUST"
              title="Adjust inputs and see what moves cost"
              subtitle="Change shipping and size. Delivered cost updates instantly."
              density="tight"
            />
          </div>

          {/* Controls and Content */}
          <div className="flex-1 min-h-0 flex flex-col">
            <InsightBanner
              shippingMode={shipMode}
              biggestDriver={isShippingBiggest ? "Shipping" : fobPercent >= freightPercent ? "Factory" : "Other"}
              emptyPrice={!hasRetailPrice}
            />

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur shadow-lg p-4 lg:p-5 flex-1 min-h-0 flex flex-col relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white/50 to-indigo-50/20" />

              <div className="relative z-10 flex-1 min-h-0 flex flex-col">
                {/* Top controls row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                  {/* Shipping mode */}
                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Shipping mode</label>
                    <div className="rounded-lg bg-slate-100 p-1 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShipMode("Air")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setShipMode("Air");
                          }
                        }}
                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors h-9 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                          shipMode === "Air"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        aria-label="Air shipping mode"
                      >
                        Air
                      </button>
                      <button
                        type="button"
                        onClick={() => setShipMode("Ocean")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setShipMode("Ocean");
                          }
                        }}
                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors h-9 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                          shipMode === "Ocean"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        aria-label="Ocean shipping mode"
                      >
                        Ocean
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 max-[820px]:hidden">
                      Air is faster, higher cost. Ocean is slower, lower cost.
                    </p>
                  </div>

                  {/* Retail price */}
                  <div className="min-w-0">
                    <RetailPriceInput
                      value={shelfPrice}
                      onChange={setShelfPrice}
                      onUseSample={!shelfPrice || shelfPrice === 0 ? () => setShelfPrice(SAMPLE_RETAIL_PRICE) : undefined}
                    />
                  </div>
                </div>

                {/* Content area - 2 column grid */}
                <div className="flex-1 min-h-0 pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    {/* Left column: Size controls */}
                    <div>
                      <div>
                        <div className="text-xs font-medium text-slate-600 mb-2 max-[900px]:mb-1.5">Size</div>
                        <div className="space-y-4 max-[900px]:space-y-3 max-[820px]:space-y-2.5">
                          {/* Weight */}
                          <div>
                            <div className="flex items-center justify-between mb-1 max-[900px]:mb-0.5">
                              <span className="text-xs text-slate-600">Weight</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Slider
                                min={50}
                                max={500}
                                step={10}
                                value={[unitWeightG]}
                                onValueChange={([value]) => setUnitWeightG(value)}
                                className="flex-1"
                              />
                              <div className="flex items-baseline gap-1">
                                <input
                                  type="number"
                                  min={50}
                                  max={500}
                                  step={10}
                                  value={unitWeightG}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 50;
                                    setUnitWeightG(Math.max(50, Math.min(500, val)));
                                  }}
                                  className="w-20 h-9 px-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue-500 focus:border-transparent tabular-nums text-right"
                                  aria-label="Weight in grams"
                                />
                                <span className="text-xs text-slate-500 w-6">g</span>
                              </div>
                            </div>
                          </div>

                          {/* Volume */}
                          <div>
                            <div className="flex items-center justify-between mb-1 max-[900px]:mb-0.5">
                              <span className="text-xs text-slate-600">Volume</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Slider
                                min={0.0005}
                                max={0.005}
                                step={0.0001}
                                value={[unitVolumeCbm]}
                                onValueChange={([value]) => setUnitVolumeCbm(value)}
                                className="flex-1"
                              />
                              <div className="flex items-baseline gap-1">
                                <input
                                  type="number"
                                  min={0.0005}
                                  max={0.005}
                                  step={0.0001}
                                  value={unitVolumeCbm}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0.0005;
                                    setUnitVolumeCbm(Math.max(0.0005, Math.min(0.005, val)));
                                  }}
                                  className="w-24 h-9 px-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue-500 focus:border-transparent tabular-nums text-right"
                                  aria-label="Volume in cubic meters"
                                />
                                <span className="text-xs text-slate-500 w-8">m³</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right column: Results */}
                    <div>
                      {/* Delivered cost - big number */}
                      <div className="mb-4">
                        <div className="text-xs text-slate-500 mb-1">Delivered cost per unit</div>
                        <div className="text-3xl lg:text-4xl max-[820px]:text-2xl font-semibold text-slate-900 tabular-nums">
                          ${formatMoney(totalValue)}
                        </div>
                      </div>

                      {/* When retail price is not set */}
                      {!hasRetailPrice && (
                        <div className="mb-4 text-sm text-slate-500">
                          Enter a retail price to see margin and profit.
                        </div>
                      )}

                      {/* When retail price is set - show margin and profit */}
                      {hasRetailPrice && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {/* Gross margin */}
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Gross margin</div>
                            {currentMarginPercent !== null && (
                              <div className="text-xl max-[820px]:text-lg font-semibold text-slate-900 tabular-nums">
                                {formatPct(currentMarginPercent)}%
                              </div>
                            )}
                          </div>
                          
                          {/* Profit per unit */}
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Profit per unit</div>
                            {profitPerUnit !== null && (
                              <div className="text-xl max-[820px]:text-lg font-semibold text-slate-900 tabular-nums">
                                ${formatMoney(profitPerUnit)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cost drivers bar */}
                      <div className="pt-3 border-t border-slate-100">
                        <div className="text-xs font-semibold text-slate-700 mb-2">Cost drivers</div>
                        <div className="relative h-2 rounded-full bg-slate-200 ring-1 ring-slate-200/80 overflow-hidden flex mb-3" role="img" aria-label="Cost breakdown visualization">
                          <div
                            className={biggestDriver.label === "Factory price" ? "bg-blue-600" : "bg-slate-300"}
                            style={{ width: `${Math.max(fobPercent, 2)}%` }}
                            title={`Factory price: ${formatCurrency(fobValue)}`}
                            aria-label={`Factory price: ${formatCurrency(fobValue)}`}
                          />
                          <div
                            className={biggestDriver.label === "Shipping" ? "bg-blue-600" : "bg-slate-300"}
                            style={{ width: `${Math.max(freightPercent, 2)}%` }}
                            title={`Shipping: ${formatCurrency(freightValue)}`}
                            aria-label={`Shipping: ${formatCurrency(freightValue)}`}
                          />
                          <div
                            className={biggestDriver.label === "Import tax" ? "bg-blue-600" : "bg-slate-300"}
                            style={{ width: `${Math.max(dutyPercent, 2)}%` }}
                            title={`Import tax: ${formatCurrency(dutyValue)}`}
                            aria-label={`Import tax: ${formatCurrency(dutyValue)}`}
                          />
                          <div
                            className={biggestDriver.label === "Clearance fees" ? "bg-blue-600" : "bg-slate-300"}
                            style={{ width: `${Math.max(feesPercent, 2)}%` }}
                            title={`Clearance fees: ${formatCurrency(feesValue)}`}
                            aria-label={`Clearance fees: ${formatCurrency(feesValue)}`}
                          />
                        </div>

                        {/* Compact 2x2 grid of line items */}
                        <div className="grid grid-cols-2 gap-3 max-[820px]:gap-2">
                          {/* Factory price */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-600">Factory price</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(fobValue)}
                            </span>
                          </div>

                          {/* Shipping */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-600">Shipping</span>
                              {isShippingBiggest && (
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 shrink-0">
                                  Biggest
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(freightValue)}
                            </span>
                          </div>

                          {/* Import tax */}
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-600">Import tax</span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(dutyValue)}
                            </span>
                          </div>

                          {/* Clearance fees */}
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-600">Clearance fees</span>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(feesValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

);

SectionAdjust.displayName = "SectionAdjust";

export { SectionAdjust };
export default SectionAdjust;
