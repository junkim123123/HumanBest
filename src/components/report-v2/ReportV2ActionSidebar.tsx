"use client";

import type { Report } from "@/lib/report/types";
import { Package } from "lucide-react";

interface ReportV2ActionSidebarProps {
  report: Report;
}

export default function ReportV2ActionSidebar({ report }: ReportV2ActionSidebarProps) {
  const reportAny = report as any;
  const coverage = reportAny._coverage || {};
  const evidenceSource = coverage.evidenceSource || coverage.evidence_source || "Category benchmarks";
  const similarRecordsCount = coverage.similarRecordsCount || reportAny._similarRecordsCount || 0;

  const inferred = (reportAny.baseline?.evidence?.inferredInputs || {}) as Record<string, any>;
  const verifiedSignalsCount = Object.values(inferred).filter((value) => {
    const prov = value?.provenance;
    return prov && prov !== "category_default";
  }).length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
      <h3 className="text-base font-semibold text-slate-900">Evidence</h3>

      <div className="space-y-3 text-sm text-slate-700">
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium text-slate-900">Signals verified</div>
          <div className="text-sm text-slate-700">{verifiedSignalsCount}</div>
        </div>

        <div className="flex items-start justify-between">
          <div className="text-sm font-medium text-slate-900">Source</div>
          <div className="text-sm text-slate-700 text-right">
            {evidenceSource === "internal_records" ? "Internal records" : "Category benchmarks"}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-900">Similar imports</div>
          <div className="text-sm text-slate-700">{similarRecordsCount}</div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 flex items-start gap-2">
          <Package className="w-4 h-4 text-slate-400 mt-0.5" />
          <span>Verification triggers supplier outreach and classification checks. No extra inputs are required.</span>
        </div>
      </div>
    </div>
  );
}

