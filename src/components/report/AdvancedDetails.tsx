// @ts-nocheck
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EvidencePanel } from "./EvidencePanel";
import type { Report } from "@/lib/report/types";

interface AdvancedDetailsProps {
  report: Report;
}

export function AdvancedDetails({ report }: AdvancedDetailsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-slate-900">Advanced Details</h2>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="evidence">
              <AccordionTrigger>Evidence</AccordionTrigger>
              <AccordionContent>
                <EvidencePanel report={report} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-6 space-y-6">
            {/* Similar products baseline explanation */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Similar Products Baseline
              </h3>
              <p className="text-sm text-slate-600">
                Showing a market baseline from similar products and category signals.
              </p>
            </div>

          {/* Estimate basis */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Estimate Basis
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.baseline.evidence.types.map((type) => {
                const labels: Record<string, string> = {
                  similar_records: "Similar import records",
                  category_based: "Category-based freight",
                  regulation_check: "Regulation check items",
                };
                return (
                  <Badge key={type} className="bg-slate-100 text-slate-700">
                    {labels[type] || type}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* HS code candidates */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              HS Code Candidates
            </h3>
            <div className="space-y-2">
              {report.baseline.riskFlags.tariff.hsCodeRange.map((code, i) => (
                <div key={i} className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono text-slate-900">
                    {code}
                  </code>
                  <span className="text-xs text-slate-500">
                    {i === 0 ? "Most likely" : "Alternative"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Assumptions</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div>
                <span className="font-medium">Packaging:</span> {report.baseline.evidence.assumptions.packaging}
              </div>
              <div>
                <span className="font-medium">Weight:</span> {report.baseline.evidence.assumptions.weight}
              </div>
              <div>
                <span className="font-medium">Volume:</span> {report.baseline.evidence.assumptions.volume}
              </div>
              <div>
                <span className="font-medium">Incoterms:</span> {report.baseline.evidence.assumptions.incoterms}
              </div>
              <div>
                <span className="font-medium">Shipping Mode:</span> {report.baseline.evidence.assumptions.shippingMode}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

