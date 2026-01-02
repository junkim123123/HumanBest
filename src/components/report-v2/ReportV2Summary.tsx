"use client";

import type { Report } from "@/lib/report/types";
import { computeDataQuality } from "@/lib/report/data-quality";

interface ReportV2SummaryProps {
  report: Report & {
    _similarRecordsCount?: number;
    _coverage?: {
      similarRecordsCount: number;
      evidenceSource: string;
      leadsCount: number;
    };
    _supplierMatches?: Array<any>;
  };
}

export default function ReportV2Summary({ report }: ReportV2SummaryProps) {
  const reportAny = report as any;
  const coverage = reportAny._coverage || {};
  const similarRecordsCount = coverage.similarRecordsCount || reportAny._similarRecordsCount || 0;
  const leadsCount = reportAny._supplierMatches?.length || 0;

  const { tier: dataQualityTier, reason: dataQualityReason, missingSignals } = computeDataQuality(report);

  // Source
  const evidenceSource = coverage.evidenceSource || "category_based";
  const evidenceSourceLabels: Record<string, string> = {
    internal_records: "Internal records",
    category_based: "Category benchmarks",
    user_inputs: "User inputs",
    llm_baseline: "Baseline assumptions",
  };
  const evidenceSourceLabel = evidenceSourceLabels[evidenceSource] || "Category benchmarks";

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Summary</h3>

      <div className="space-y-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="text-slate-600">Data quality</div>
          <div className="font-medium text-slate-900 text-right">
            {dataQualityTier === "high" ? "High" : dataQualityTier === "medium" ? "Medium" : "Low"}
          </div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="text-slate-600">Why</div>
          <div className="font-medium text-slate-900 text-right max-w-[55%] leading-snug">{dataQualityReason}</div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="text-slate-600">Source</div>
          <div className="font-medium text-slate-900 text-right">{evidenceSourceLabel}</div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="text-slate-600">Similar imports</div>
          <div className="font-medium text-slate-900">{similarRecordsCount}</div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="text-slate-600">Leads count</div>
          <div className="font-medium text-slate-900">{leadsCount}</div>
        </div>
      </div>
    </div>
  );
}
