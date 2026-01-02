// @ts-nocheck
"use client";

import { DollarSign, AlertTriangle, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Report } from "@/lib/report/types";

interface SummaryCardsProps {
  report: Report;
}

export function SummaryCards({ report }: SummaryCardsProps) {
  // Risk summary - only 3 main categories
  const riskSummary = [
    { label: "Customs", value: report.baseline.riskScores.tariff },
    { label: "Compliance", value: report.baseline.riskScores.compliance },
    { label: "Supply", value: report.baseline.riskScores.supply },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Estimated Landed Cost Range */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-electric-blue-600" />
          <h3 className="font-semibold text-slate-900">Estimated Landed Cost Range</h3>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-slate-500 mb-1">Min</div>
            <div className="text-2xl font-bold text-slate-900">
              ${report.baseline.costRange.standard.totalLandedCost.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Max (conservative)</div>
            <div className="text-xl font-semibold text-slate-700">
              ${report.baseline.costRange.conservative.totalLandedCost.toFixed(2)}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          A realistic range from similar imports and category baselines.
        </p>
      </Card>

      {/* FOB Range */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">FOB Range</h3>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-slate-500 mb-1">Min</div>
            <div className="text-2xl font-bold text-slate-900">
              ${report.baseline.costRange.standard.unitPrice.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Max</div>
            <div className="text-xl font-semibold text-slate-700">
              ${report.baseline.costRange.conservative.unitPrice.toFixed(2)}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Estimated factory price range.
        </p>
      </Card>

      {/* Risk Summary */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-slate-900">Risk Summary</h3>
        </div>
        <div className="space-y-2">
          {riskSummary.map((risk, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{risk.label}</span>
              <span className="text-sm font-bold text-slate-900">{risk.value}/100</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Total risk: {report.baseline.riskScores.total}/100
        </p>
      </Card>
    </div>
  );
}

