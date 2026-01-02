"use client";

import { DollarSign, Package } from "lucide-react";
import type { Report } from "@/lib/report/types";
import { normalizeRange } from "@/lib/calc/cost-normalization";

interface KeyNumbersProps {
  report: Report;
}

export default function KeyNumbers({ report }: KeyNumbersProps) {
  const costRange = report.baseline?.costRange || { conservative: { totalLandedCost: 0 }, standard: { totalLandedCost: 0 } };
  // Use standard cost as the mid point
  const midCost = costRange.standard?.totalLandedCost || 0;
  let minCostRaw = costRange.conservative?.totalLandedCost || midCost;
  let maxCostRaw = midCost * 1.2; // Estimate max as 20% higher than standard

  // Normalize cost range to ensure min <= mid <= max
  const normalized = normalizeRange({ min: minCostRaw, mid: midCost, max: maxCostRaw }, 'KeyNumbers');
  const minCost = normalized.min;
  const maxCost = normalized.max;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Delivered Cost */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-[13px] font-medium text-slate-600">Delivered cost per unit</p>
        </div>
        <div className="mb-1">
          <span className="text-[28px] font-bold text-slate-900 tracking-tight">
            ${midCost.toFixed(2)}
          </span>
        </div>
        <div className="text-[13px] text-slate-500">
          ${minCost.toFixed(2)} – ${maxCost.toFixed(2)}
        </div>
        <p className="text-[12px] text-slate-400 mt-3">Range updates when proof is found.</p>
      </div>

      {/* Shipment assumption reminder */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-[13px] font-medium text-slate-600">Assumptions used</p>
        </div>
        <p className="text-[14px] text-slate-700 leading-relaxed">
          This estimate assumes 1 unit. Weight and box size use category defaults when not provided.
        </p>
      </div>
    </div>
  );
}
