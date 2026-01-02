// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/lib/report/types";

interface CostSummaryCardProps {
  report: Report;
}

export function CostSummaryCard({ report }: CostSummaryCardProps) {
  const standard = report.baseline.costRange.standard;
  const conservative = report.baseline.costRange.conservative;
  
  // Get price unit from report metadata
  const priceUnit = (report as any)._priceUnit || "per unit";
  const hasLandedCosts = (report as any)._hasLandedCosts || false;

  // Top 3 cost drivers (only if we have meaningful data)
  const drivers = [
    {
      label: "Unit price",
      standard: standard.unitPrice,
      conservative: conservative.unitPrice,
      impact: "high",
    },
    {
      label: "Shipping",
      standard: standard.shippingPerUnit,
      conservative: conservative.shippingPerUnit,
      impact: "medium",
    },
    {
      label: "Duty",
      standard: standard.dutyPerUnit,
      conservative: conservative.dutyPerUnit,
      impact: standard.dutyPerUnit > 0.5 ? "high" : "low",
    },
  ].filter(d => d.standard > 0 || d.conservative > 0)
   .sort((a, b) => {
     const aMax = Math.max(a.standard, a.conservative);
     const bMax = Math.max(b.standard, b.conservative);
     return bMax - aMax;
   })
   .slice(0, 3);

  return (
    <Card className="p-5 bg-white border border-slate-200 rounded-xl">
      <h3 className="text-base font-semibold text-slate-900 mb-4">Cost range</h3>

      {/* FOB range (always show if available) */}
      {standard.unitPrice > 0 && conservative.unitPrice > 0 && (
        <div className="mb-5 pb-5 border-b border-slate-200">
          <div className="text-xs text-slate-500 mb-1">FOB range</div>
          <div className="text-2xl font-semibold text-slate-900">
            ${standard.unitPrice.toFixed(2)} - ${conservative.unitPrice.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{priceUnit}</div>
        </div>
      )}

      {/* Delivered cost range (only show if hasLandedCosts) */}
      {hasLandedCosts && standard.totalLandedCost > 0 && conservative.totalLandedCost > 0 ? (
        <div className="mb-5 pb-5 border-b border-slate-200">
          <div className="text-xs text-slate-500 mb-1">Delivered cost range</div>
          <div className="text-2xl font-semibold text-slate-900">
            ${standard.totalLandedCost.toFixed(2)} - ${conservative.totalLandedCost.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{priceUnit}</div>
        </div>
      ) : (
        <div className="mb-5 pb-5 border-b border-slate-200">
          <div className="text-xs text-slate-500 mb-1">Delivered cost range</div>
          <div className="text-sm font-medium text-slate-500 italic">Unknown</div>
          <div className="text-xs text-slate-400 mt-0.5">Priced supplier matches needed</div>
        </div>
      )}

      {/* Top 3 drivers (only if we have data) */}
      {drivers.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-2">Top cost drivers</div>
          <div className="space-y-2">
            {drivers.map((driver, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{driver.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    ${driver.standard.toFixed(2)} - ${driver.conservative.toFixed(2)}
                  </span>
                  {driver.impact === "high" && (
                    <Badge variant="outline" className="h-4 px-1.5 text-xs bg-red-50 text-red-700 border-red-200">
                      High
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

