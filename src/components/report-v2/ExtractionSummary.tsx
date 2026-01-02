"use client";

import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import type { Report } from "@/lib/report/types";
import { getExtractionStatuses } from "@/lib/report/extraction-status";

interface ExtractionSummaryProps {
  report: Report;
}

interface ExtractionField {
  label: string;
  value: string | null;
  evidenceSource: "verified_barcode" | "verified_label" | "vision_inferred" | "missing";
  isRequired: boolean;
}

export default function ExtractionSummary({
  report,
}: ExtractionSummaryProps) {
  const { snapshot, barcode, labelText, weight, origin } = getExtractionStatuses(report);

  const labelStatusText = (() => {
    if (labelText === "verified") return "Label text extracted";
    if (labelText === "not_readable") return "Label photo received but unreadable";
    return "Label photo not provided";
  })();

  const barcodeStatusText = (() => {
    if (barcode === "verified") return "Barcode value detected";
    if (barcode === "could_not_read") return "Barcode photo received but unreadable";
    return "Barcode photo not provided";
  })();

  const weightStatusText = (() => {
    if (weight === "verified") return `Weight confirmed${snapshot.weightGrams ? ` (${snapshot.weightGrams} g)` : ""}`;
    if (weight === "inferred") {
      if (snapshot.weightSource === "default") {
        return "Weight using category default";
      }
      return `Weight inferred${snapshot.weightGrams ? ` (${snapshot.weightGrams} g)` : ""}`;
    }
    return "Weight not detected";
  })();
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900">Extraction summary</h3>
      </div>

      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Barcode status */}
        <div className="p-4 border border-slate-100 rounded-xl">
          <p className="text-[12px] font-medium text-slate-500 uppercase mb-2">Barcode</p>
          <p className="text-[14px] font-semibold text-slate-900 mb-2">{barcodeStatusText}</p>
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            {snapshot.hasBarcodeImage ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
            <span>{snapshot.hasBarcodeImage ? "Photo uploaded" : "Photo missing"}</span>
          </div>
        </div>

        {/* Label status */}
        <div className="p-4 border border-slate-100 rounded-xl">
          <p className="text-[12px] font-medium text-slate-500 uppercase mb-2">Label</p>
          <p className="text-[14px] font-semibold text-slate-900 mb-2">{labelStatusText}</p>
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            {snapshot.hasLabelImage ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
            <span>{snapshot.hasLabelImage ? "Photo uploaded" : "Photo missing"}</span>
          </div>
        </div>

        {/* Weight status */}
        <div className="p-4 border border-slate-100 rounded-xl">
          <p className="text-[12px] font-medium text-slate-500 uppercase mb-2">Weight</p>
          <p className="text-[14px] font-semibold text-slate-900 mb-2">{weightStatusText}</p>
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            {weight === "verified" || weight === "inferred" ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <HelpCircle className="w-3 h-3 text-amber-600" />}
            <span>
              {weight === "verified"
                ? "Weight captured from label"
                : weight === "inferred"
                  ? snapshot.weightSource === "default"
                    ? "Using category default"
                    : "Weight inferred from signals"
                  : "Weight not detected"}
            </span>
          </div>
        </div>

        {/* Origin status */}
        <div className="p-4 border border-slate-100 rounded-xl">
          <p className="text-[12px] font-medium text-slate-500 uppercase mb-2">Origin</p>
          <p className="text-[14px] font-semibold text-slate-900 mb-2">{snapshot.originCountry || "Not detected"}</p>
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            {snapshot.originCountry ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <HelpCircle className="w-3 h-3 text-amber-600" />}
            <span>{snapshot.originCountry ? "Captured from label" : "Origin not detected"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
