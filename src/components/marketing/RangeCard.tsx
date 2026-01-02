"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { Report } from "@/lib/report/types";

type RangeCardData = {
  hasImportEvidence?: boolean;
  importRecordCount?: number;
  evidence?: {
    importRecords?: unknown[];
    items?: Array<{ source: string }>;
  };
  signals?: {
    hasImportEvidence?: boolean;
  };
};

type RangeCardProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  typical: number;
  min: number;
  max: number;
  showHelper?: boolean;
  data?: RangeCardData | Report | null;
};

function getEvidenceMeta(data?: RangeCardData | Report | null): { label: string; helper: string } {
  if (!data) {
    return { label: "Market range", helper: "Category range plus shipping by weight and volume" };
  }

  // Check various evidence indicators (conservative: only if real import record exists)
  const hasImportEvidence =
    // Direct boolean flag
    (data as RangeCardData).hasImportEvidence === true ||
    // Signals object
    (data as Report).signals?.hasImportEvidence === true ||
    // Import record count
    ((data as RangeCardData).importRecordCount ?? 0) > 0 ||
    // Evidence items with import records
    ((data as Report).baseline?.evidence?.items?.filter((item) => item.source === "us_import_records").length ?? 0) > 0 ||
    // Legacy evidence.importRecords array
    ((data as RangeCardData).evidence?.importRecords?.length ?? 0) > 0;

  if (hasImportEvidence) {
    return {
      label: "Import record backed",
      helper: "Matched to recent shipments for similar products",
    };
  }

  return {
    label: "Market range",
    helper: "Category range plus shipping by weight and volume",
  };
}

export function RangeCard({
  icon: Icon,
  title,
  subtitle,
  typical,
  min,
  max,
  showHelper = false,
  data,
}: RangeCardProps) {
  const { label, helper } = getEvidenceMeta(data);

  return (
    <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Badge
            variant="outline"
            className="h-6 px-3 text-[11px] bg-slate-50 text-slate-700 border-slate-200"
          >
            {label}
          </Badge>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs text-slate-500">Typical</div>
        <div className="text-[44px] leading-[1.05] font-bold text-slate-900 mt-2">
          {formatCurrency(typical)}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {helper}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-slate-600">Range</div>
        <div className="text-sm font-semibold text-slate-900">
          {formatCurrency(min)} to {formatCurrency(max)}
        </div>
      </div>

      {showHelper && (
        <div className="mt-3 text-xs text-slate-500">
          Range changes with size and order quantity.
        </div>
      )}
    </Card>
  );
}
