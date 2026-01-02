// @ts-nocheck
"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/report/types";

interface StickyBottomBarProps {
  report: Report;
  onContactMatch?: () => void;
}

export function StickyBottomBar({
  report,
  onContactMatch,
}: StickyBottomBarProps) {
  const riskLevel =
    report.baseline.riskScores.total >= 70
      ? "High"
      : report.baseline.riskScores.total >= 40
      ? "Medium"
      : "Low";

  const riskColor =
    report.baseline.riskScores.total >= 70
      ? "text-red-600"
      : report.baseline.riskScores.total >= 40
      ? "text-green-600"
      : "text-green-600";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Cost and Risk */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div>
              <div className="text-xs text-slate-500 mb-1">Landed Range</div>
              <div className="text-sm font-bold text-slate-900">
                ${report.baseline.costRange.standard.totalLandedCost.toFixed(2)} - $
                {report.baseline.costRange.conservative.totalLandedCost.toFixed(2)}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs text-slate-500 mb-1">Risk</div>
              <div className={`text-sm font-bold ${riskColor}`}>
                {riskLevel} ({report.baseline.riskScores.total}/100)
              </div>
            </div>
          </div>

          {/* Right: CTA Button */}
          <div className="flex-shrink-0">
            <Button
              onClick={onContactMatch}
              className="bg-electric-blue-600 hover:bg-electric-blue-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Get 24-hour verification
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

