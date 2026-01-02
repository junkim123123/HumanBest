// @ts-nocheck
"use client";

import { DollarSign, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { SlideCard } from "@/components/ui/slide-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OutcomePreviewCardProps {
  isLive?: boolean;
  costRange?: { min: number; max: number };
  confidence?: "high" | "medium" | "low";
  customsMatched?: boolean;
  hsCodeConfirmed?: boolean;
  suppliersPending?: boolean;
  isAnalyzing?: boolean;
}

export function OutcomePreviewCard({
  isLive = false,
  costRange,
  confidence = "high",
  customsMatched,
  hsCodeConfirmed,
  suppliersPending,
  isAnalyzing = false,
}: OutcomePreviewCardProps) {
  const confidenceConfig = {
    high: {
      color: "bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border-green-300/60 shadow-sm",
      label: "High confidence",
    },
    medium: {
      color: "bg-gradient-to-br from-yellow-50 to-amber-50 text-yellow-700 border-yellow-300/60 shadow-sm",
      label: "Medium confidence",
    },
    low: {
      color: "bg-gradient-to-br from-orange-50 to-red-50 text-orange-700 border-orange-300/60 shadow-sm",
      label: "Low confidence",
    },
  };

  const conf = confidenceConfig[confidence];

  return (
    <SlideCard className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Outcome preview</h3>
        </div>

        {/* Delivered Cost Range */}
        <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/30 backdrop-blur rounded-lg border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-slate-500">Delivered cost range</div>
            {costRange && (
              <Badge variant="outline" className={cn("h-4 px-1.5 text-xs border font-semibold", conf.color)}>
                {conf.label}
              </Badge>
            )}
          </div>
          {costRange ? (
            <>
              <div className="text-base font-semibold text-slate-900">
                ${costRange.min.toFixed(2)} - ${costRange.max.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">per unit</div>
            </>
          ) : (
            <div className="text-sm text-slate-400">Upload to see estimate</div>
          )}
        </div>

        {/* Status rows with icons */}
        <div className="space-y-2">
          {isAnalyzing ? (
            // Skeleton rows while analyzing
            <>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
              </div>
            </>
          ) : isLive && (customsMatched !== undefined || hsCodeConfirmed !== undefined || suppliersPending !== undefined) ? (
            <>
              {customsMatched !== undefined && (
                <div className="flex items-center gap-2">
                  {customsMatched ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  )}
                  <div className="text-xs font-medium text-slate-700">
                    {customsMatched ? "US customs records matched" : "No customs records"}
                  </div>
                </div>
              )}
              {hsCodeConfirmed !== undefined && (
                <div className="flex items-center gap-2">
                  {hsCodeConfirmed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  )}
                  <div className="text-xs font-medium text-slate-700">
                    {hsCodeConfirmed ? "HS code confirmed" : "HS code pending"}
                  </div>
                </div>
              )}
              {suppliersPending !== undefined && (
                <div className="flex items-center gap-2">
                  {suppliersPending ? (
                    <Loader2 className="w-3.5 h-3.5 text-yellow-600 animate-spin flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  )}
                  <div className="text-xs font-medium text-slate-700">
                    {suppliersPending ? "Supplier quotes pending" : "Supplier quotes ready"}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <div className="text-xs font-medium text-slate-700">US customs records matched</div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <div className="text-xs font-medium text-slate-700">HS code confirmed</div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                <div className="text-xs font-medium text-slate-700">Supplier quotes pending</div>
              </div>
            </>
          )}
        </div>

        {/* What you get section */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <div className="text-xs font-medium text-slate-600 mb-2">What you get</div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 mb-0.5">Delivered cost range</div>
            <div className="text-xs font-semibold text-slate-900">
              Per-unit estimate with confidence level
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 mb-0.5">HS code and duty confidence</div>
            <div className="text-xs font-semibold text-slate-900">
              Category classification with duty rate
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-500 mb-0.5">Supplier shortlist or next action</div>
            <div className="text-xs font-semibold text-slate-900">
              Verified quotes available when ready
            </div>
          </div>
        </div>
      </div>
    </SlideCard>
  );
}


