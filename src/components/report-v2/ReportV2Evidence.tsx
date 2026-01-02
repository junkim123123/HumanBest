"use client";

import type { Report } from "@/lib/report/types";

interface ReportV2EvidenceProps {
  report: Report & {
    _coverage?: {
      similarRecordsCount: number;
      evidenceSource: string;
      leadsCount: number;
      avgPricingCoverage: number;
      hasEnrichment: boolean;
      totalRelatedItems: number;
    };
  };
}

function getEvidenceSourceLabel(evidenceSource: string): string {
  if (evidenceSource === "internal_records") return "Internal records";
  if (evidenceSource === "category_based") return "Category benchmarks";
  if (evidenceSource === "user_inputs") return "User inputs";
  return "Category benchmarks";
}

function getLimitationsSentence(report: Report, coverage?: ReportV2EvidenceProps["report"]["_coverage"]): string {
  const similarRecordsCount = coverage?.similarRecordsCount || 0;
  if (similarRecordsCount === 0) return "No similar imports matched; estimate uses category benchmarks.";
  if (similarRecordsCount < 5) return "Limited similar imports; some assumptions remain.";
  return "Estimate reflects available records and category signals.";
}

export default function ReportV2Evidence({ report }: ReportV2EvidenceProps) {
  const coverage = (report as any)._coverage;
  const similarRecordsCount = coverage?.similarRecordsCount || 0;
  const evidenceSource = coverage?.evidenceSource || "llm_baseline";
  const evidenceSourceLabel = getEvidenceSourceLabel(evidenceSource);
  const limitations = getLimitationsSentence(report, coverage);

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Evidence</h2>
      
      <div className="space-y-4">
        <div>
          <div className="text-sm text-slate-600 mb-1">Source</div>
          <div className="text-base font-medium text-slate-900">{evidenceSourceLabel}</div>
        </div>

        <div>
          <div className="text-sm text-slate-600 mb-1">Limitations</div>
          <div className="text-sm text-slate-700">{limitations}</div>
        </div>
      </div>
    </section>
  );
}

