// @ts-nocheck
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface ReportStickyHeaderProps {
  report: Report;
  onViewProject?: () => void;
}

export function ReportStickyHeader({ report, onViewProject }: ReportStickyHeaderProps) {
  const getEvidenceLevel = () => {
    if (report.signals.hasImportEvidence) return "Evidence-backed";
    return "Estimate";
  };

  const getEvidenceSources = () => {
    const sources: string[] = [];
    if (report.baseline.evidence.types.includes("similar_records")) {
      sources.push("Similar imports");
    }
    if (report.baseline.evidence.types.includes("category_based")) {
      sources.push("Category rules");
    }
    if (report.baseline.evidence.types.includes("regulation_check")) {
      sources.push("Regulations");
    }
    return sources;
  };

  return (
    <div className="sticky top-0 z-50 h-16 bg-white border-b border-slate-200 flex items-center">
      <div className="max-w-[1120px] mx-auto w-full px-6 flex items-center justify-between">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/reports" className="hover:text-slate-900">
            Reports
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-medium">{report.productName}</span>
        </div>

        {/* Center: Evidence level chips */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
            {getEvidenceLevel()}
          </Badge>
          {getEvidenceSources().map((source, index) => (
            <Badge key={index} variant="outline" className="bg-slate-50 text-slate-700">
              {source}
            </Badge>
          ))}
        </div>

        {/* Right: View project button and View V2 */}
        <div className="flex items-center gap-2">
          <Link
            href={`/reports/${report.id}/v2`}
            className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            View V2
          </Link>
          {onViewProject && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProject}
              className="text-slate-700 hover:text-slate-900"
            >
              View project
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


