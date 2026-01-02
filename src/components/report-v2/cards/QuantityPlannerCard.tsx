"use client";

import { Package } from "lucide-react";
import type { DecisionSupport } from "@/lib/server/decision-support-builder";

interface QuantityPlannerCardProps {
  decisionSupport: DecisionSupport;
}

export default function QuantityPlannerCard({
  decisionSupport,
}: QuantityPlannerCardProps) {
  const { quantityPlanner, cost } = decisionSupport;
  const currency = cost.currency || "USD";

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-slate-900">Quantity Planner</h3>
      </div>

      <div className="space-y-3">
        {quantityPlanner.options.map((option, idx) => (
          <div
            key={idx}
            className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <p className="font-semibold text-slate-900">{option.quantity}</p>
                <p className="text-sm text-slate-500">units</p>
              </div>
            </div>

            {/* Total Landed Cost */}
            <div className="mb-2">
              <p className="text-xs text-slate-500 font-medium mb-1">Total Landed Cost</p>
              <div className="flex items-baseline gap-2 text-sm text-slate-700">
                <span>{formatPrice(option.totalLanded.min)}</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(option.totalLanded.mid)}
                </span>
                <span className="text-slate-400">→</span>
                <span>{formatPrice(option.totalLanded.max)}</span>
              </div>
            </div>

            {/* Total Profit (if available) */}
            {option.totalProfit && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Total Profit</p>
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="text-slate-700">
                    {formatPrice(option.totalProfit.min)}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={`font-semibold ${
                    option.totalProfit.mid >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}>
                    {formatPrice(option.totalProfit.mid)}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="text-slate-700">
                    {formatPrice(option.totalProfit.max)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
        Based on landed cost range (min/mid/max). Profit shows retail price impact when provided.
      </p>
    </div>
  );
}
