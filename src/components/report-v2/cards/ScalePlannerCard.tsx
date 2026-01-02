"use client";

import { useState } from "react";
import { TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import type { DecisionSupport } from "@/lib/server/decision-support-builder";
import { calculateScalePlanner, clampQuantity } from "@/lib/calc/profit";
import { normalizeRange } from "@/lib/calc/cost-normalization";

interface ScalePlannerCardProps {
  decisionSupport: DecisionSupport;
  hasVerifiedQuote?: boolean;
  initialShelfPrice?: number;
  onShelfPriceChange?: (price: number) => void;
}

const QUANTITY_PRESETS = [100, 300, 1000];

export default function ScalePlannerCard({
  decisionSupport,
  hasVerifiedQuote = false,
  initialShelfPrice,
  onShelfPriceChange,
}: ScalePlannerCardProps) {
  const { cost, profit } = decisionSupport;
  
  const initialCommitted = (initialShelfPrice ?? profit.shelfPrice) || null;
  const [shelfPriceDraft, setShelfPriceDraft] = useState(
    initialCommitted ? String(initialCommitted) : ""
  );
  const [shelfPriceCommitted, setShelfPriceCommitted] = useState<number | null>(initialCommitted);
  const [selectedQuantity, setSelectedQuantity] = useState(QUANTITY_PRESETS[0]);
  const [customQuantity, setCustomQuantity] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Normalize cost range to ensure min <= mid <= max ordering
  const deliveredCostRange = normalizeRange({
    min: cost.landedPerUnit.min,
    mid: cost.landedPerUnit.mid,
    max: cost.landedPerUnit.max,
  }, 'ScalePlannerCard.deliveredCostRange');

  const parsedShelfPrice = shelfPriceCommitted && shelfPriceCommitted > 0 
    ? shelfPriceCommitted 
    : null;

  const calculations = parsedShelfPrice
    ? calculateScalePlanner(parsedShelfPrice, deliveredCostRange, selectedQuantity)
    : null;

  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const handlePresetClick = (quantity: number) => {
    setSelectedQuantity(quantity);
    setCustomQuantity("");
  };

  const handleCustomQuantityChange = (value: string) => {
    setCustomQuantity(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedQuantity(clampQuantity(parsed));
    }
  };

  const commitShelfPrice = () => {
    setInputError(null);
    const raw = shelfPriceDraft.trim();
    if (raw === "") {
      setShelfPriceCommitted(null);
      return;
    }

    let cleaned = raw.replace(/^\$/ , "");
    if (cleaned.includes(",") && !cleaned.includes(".")) {
      cleaned = cleaned.replace(",", ".");
    }

    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || parsed <= 0) {
      setInputError("Enter a valid price greater than 0");
      return;
    }

    setShelfPriceCommitted(parsed);
    if (onShelfPriceChange) onShelfPriceChange(parsed);
  };

  const handleShelfPriceChange = (value: string) => {
    setShelfPriceDraft(value);
    setInputError(null);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-slate-900">Scale Planner</h3>
      </div>

      {/* Retail Price Input */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <label className="text-xs font-medium text-slate-700 mb-2 block">
          Your retail price (per unit)
        </label>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="0.00"
            value={shelfPriceDraft}
            onChange={(e) => handleShelfPriceChange(e.target.value)}
            onBlur={commitShelfPrice}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitShelfPrice();
              }
            }}
            className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              inputError ? "border-amber-300 focus:ring-amber-500 bg-amber-50" : "border-slate-300 focus:ring-electric-blue-500"
            }`}
          />
        </div>
        {inputError ? (
          <p className="text-xs text-amber-700 mt-2">{inputError}</p>
        ) : (
          <p className="text-xs text-slate-500 mt-2">
            Press Enter or click outside to apply. Calculations update after commit.
          </p>
        )}
      </div>

      {/* Quantity Selection */}
      <div className="mb-6">
        <p className="text-xs font-medium text-slate-700 mb-3">Select Quantity</p>
        <div className="flex items-center gap-2 flex-wrap">
          {QUANTITY_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedQuantity === preset && !customQuantity
                  ? "bg-electric-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {preset.toLocaleString()}
            </button>
          ))}
          <input
            type="number"
            placeholder="Custom"
            value={customQuantity}
            onChange={(e) => handleCustomQuantityChange(e.target.value)}
            min="1"
            max="1000000000"
            className="w-28 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue-500"
          />
        </div>
      </div>

      {/* Main Table */}
      {!parsedShelfPrice || !calculations ? (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Enter your retail price above to see detailed profit projections.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-xs font-medium text-slate-600">Metric</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-slate-600">Min</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-slate-600">Mid</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-slate-600">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Cash Out */}
                <tr>
                  <td className="py-3 px-2 font-medium text-slate-900">Cash out today</td>
                  <td className="py-3 px-2 text-right text-slate-700">
                    {formatCurrency(calculations.cashOutRange.min)}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-slate-900">
                    {formatCurrency(calculations.cashOutRange.mid)}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-700">
                    {formatCurrency(calculations.cashOutRange.max)}
                  </td>
                </tr>

                {/* Profit Per Unit */}
                <tr>
                  <td className="py-3 px-2 font-medium text-slate-900">Profit per unit</td>
                  <td className={`py-3 px-2 text-right ${
                    calculations.profitPerUnitRange.min < 0 ? "text-red-600" : "text-slate-700"
                  }`}>
                    {formatCurrency(calculations.profitPerUnitRange.min)}
                  </td>
                  <td className={`py-3 px-2 text-right font-semibold ${
                    calculations.profitPerUnitRange.mid < 0 ? "text-red-600" : "text-emerald-600"
                  }`}>
                    {formatCurrency(calculations.profitPerUnitRange.mid)}
                  </td>
                  <td className={`py-3 px-2 text-right ${
                    calculations.profitPerUnitRange.max < 0 ? "text-red-600" : "text-slate-700"
                  }`}>
                    {formatCurrency(calculations.profitPerUnitRange.max)}
                  </td>
                </tr>

                {/* Total Profit */}
                <tr>
                  <td className="py-3 px-2 font-medium text-slate-900">
                    Total profit ({selectedQuantity.toLocaleString()}x)
                  </td>
                  <td className={`py-3 px-2 text-right ${
                    calculations.totalProfitRange.min < 0 ? "text-red-600" : "text-slate-700"
                  }`}>
                    {formatCurrency(calculations.totalProfitRange.min)}
                  </td>
                  <td className={`py-3 px-2 text-right font-semibold ${
                    calculations.totalProfitRange.mid < 0 ? "text-red-600" : "text-emerald-600"
                  }`}>
                    {formatCurrency(calculations.totalProfitRange.mid)}
                  </td>
                  <td className={`py-3 px-2 text-right ${
                    calculations.totalProfitRange.max < 0 ? "text-red-600" : "text-slate-700"
                  }`}>
                    {formatCurrency(calculations.totalProfitRange.max)}
                  </td>
                </tr>

                {/* Gross Margin % */}
                <tr>
                  <td className="py-3 px-2 font-medium text-slate-900">Gross margin %</td>
                  <td className={`py-3 px-2 text-right ${
                    calculations.grossMarginPercentRange.min < 0 ? "text-red-600" : "text-slate-700"
                  }`}>
                    {formatPercent(calculations.grossMarginPercentRange.min)}
                  </td>
                  <td className={`py-3 px-2 text-right font-semibold ${
                    calculations.grossMarginPercentRange.mid < 0 
                      ? "text-red-600" 
                      : calculations.grossMarginPercentRange.mid >= 30
                      ? "text-emerald-600"
                      : calculations.grossMarginPercentRange.mid >= 20
                      ? "text-amber-600"
                      : "text-slate-900"
                  }`}>
                    {formatPercent(calculations.grossMarginPercentRange.mid)}
                  </td>
                  <td className={`py-3 px-2 text-right ${
                    calculations.grossMarginPercentRange.max < 0 ? "text-red-600" : "text-slate-700"
                  }`}>
                    {formatPercent(calculations.grossMarginPercentRange.max)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
            Profit excludes overhead and sales tax. Uses delivered cost range.
          </p>

          {/* CTA */}
          <div className="mt-4">
            {hasVerifiedQuote ? (
              <button className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                Start execution with {selectedQuantity.toLocaleString()} units
              </button>
            ) : (
              <button className="w-full py-3 bg-gradient-to-r from-electric-blue-600 to-electric-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                Start verification to lock pricing
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
