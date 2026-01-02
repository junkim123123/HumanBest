"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { computeReportQuality } from "@/lib/report/truth";
import { computeDataQuality } from "@/lib/report/data-quality";
import type { Report } from "@/lib/report/types";

interface EstimateQualityBadgeProps {
  report: Report;
}

export default function EstimateQualityBadge({ report }: EstimateQualityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const quality = computeReportQuality(report);
  const dataQuality = computeDataQuality(report);

  const config = {
    preliminary: {
      label: "Preliminary estimate",
      description: dataQuality.helperText,
      color: "bg-slate-100 text-slate-700",
    },
    benchmark: {
      label: "Benchmark estimate",
      description: "Based on similar products imported in this category.",
      color: "bg-slate-100 text-slate-700",
    },
    trade_backed: {
      label: "Trade-backed estimate",
      description: "Based on actual import records from this product category.",
      color: "bg-blue-100 text-blue-700",
    },
    verified: {
      label: "Verified quote",
      description: "Based on a quote from a verified supplier.",
      color: "bg-emerald-100 text-emerald-700",
    },
  };

  const cfg = config[quality.tier];

  return (
    <div className="relative">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${cfg.color}`}>
        {cfg.label}
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="text-current opacity-60 hover:opacity-100"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {showTooltip && (
        <div className="absolute top-full mt-2 left-0 bg-slate-900 text-white text-xs p-2 rounded-lg w-48 z-10 shadow-lg">
          {cfg.description}
          <p className="text-xs text-slate-300 mt-1">Reason: {quality.reason}</p>
        </div>
      )}
    </div>
  );
}
