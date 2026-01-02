// @ts-nocheck
"use client";

import { DollarSign, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { SlideCard } from "@/components/ui/slide-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SampleOutcomeCardProps {
  isLive?: boolean;
  costRange?: { min: number; max: number };
  confidence?: "high" | "medium" | "low";
  customsMatched?: boolean;
  hsCodeConfirmed?: boolean;
  suppliersPending?: boolean;
}

export function SampleOutcomeCard({
  isLive = false,
  costRange,
  confidence = "high",
  customsMatched,
  hsCodeConfirmed,
  suppliersPending,
}: SampleOutcomeCardProps) {
  const confidenceConfig = {
    high: {
      color: "bg-green-50 text-green-700 border-green-200",
      label: "High confidence",
    },
    medium: {
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      label: "Medium confidence",
    },
    low: {
      color: "bg-orange-50 text-orange-700 border-orange-200",
      label: "Low confidence",
    },
  };

  const conf = confidenceConfig[confidence];

  return (
    <SlideCard className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            {isLive ? "Current estimate" : "Sample outcome"}
          </h3>
        </div>

        {/* Delivered Cost Range */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-slate-500">Delivered cost range</div>
            {costRange && (
              <Badge variant="outline" className={cn("h-4 px-1.5 text-xs border", conf.color)}>
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

        {/* Evidence Status */}
        {isLive && (customsMatched !== undefined || hsCodeConfirmed !== undefined || suppliersPending !== undefined) ? (
          <div className="space-y-1.5">
            {customsMatched !== undefined && (
              <div className="flex items-center gap-2">
                {customsMatched ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
                <div className="text-xs font-medium text-slate-700">
                  {customsMatched ? "US customs records matched" : "No customs records"}
                </div>
              </div>
            )}
            {hsCodeConfirmed !== undefined && (
              <div className="flex items-center gap-2">
                {hsCodeConfirmed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
                <div className="text-xs font-medium text-slate-700">
                  {hsCodeConfirmed ? "HS code confirmed" : "HS code pending"}
                </div>
              </div>
            )}
            {suppliersPending !== undefined && (
              <div className="flex items-center gap-2">
                {suppliersPending ? (
                  <Loader2 className="w-3.5 h-3.5 text-yellow-600 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                )}
                <div className="text-xs font-medium text-slate-700">
                  {suppliersPending ? "Supplier quotes pending" : "Supplier quotes ready"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <div className="text-xs font-medium text-slate-700">US customs records matched</div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <div className="text-xs font-medium text-slate-700">HS code confirmed</div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
              <div className="text-xs font-medium text-slate-700">Supplier quotes pending</div>
            </div>
          </div>
        )}
      </div>
    </SlideCard>
  );
}
