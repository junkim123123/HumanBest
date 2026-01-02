// @ts-nocheck
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { SuppliersSlide } from "@/components/report/sections/SuppliersSlide";
import { SourcingCopilotHeader } from "./SourcingCopilotHeader";
import { FreeVsPaidComparison } from "./FreeVsPaidComparison";
import { formatChecklistAsText } from "@/lib/server/questions-checklist";
import type { Report } from "@/lib/report/types";

interface SourcingLeadsSheetProps {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SourcingLeadsSheet({ report, open, onOpenChange }: SourcingLeadsSheetProps) {
  const reportAny = report as any;
  const factories = reportAny.categoryFactories || [];
  const hasFactories = factories.length > 0;
  const supplierMatches = reportAny._supplierMatches || [];
  const hasSuppliers = supplierMatches.length > 0;
  const questionsChecklist = reportAny._questionsChecklist;

  const handleCopyChecklist = async () => {
    if (!questionsChecklist) return;
    const text = formatChecklistAsText(questionsChecklist);
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy checklist:", err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle>Sourcing leads</SheetTitle>
          <SheetDescription>
            Not verified quotes. Use these leads to start outreach.
            {supplierMatches.length > 0 && (
              <span className="block mt-1 text-xs text-slate-500">
                When data is thin, we show you what to ask to make it precise.
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Sourcing Copilot Header */}
        <SourcingCopilotHeader report={report} />

        {/* Free vs Paid Comparison */}
        <FreeVsPaidComparison />
        
        {/* Data Coverage Card */}
        {(() => {
          const coverage = reportAny._coverage;
          if (!coverage) return null;
          
          return (
            <Card className="mt-4 shrink-0 border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Data coverage</h3>
              <div className="space-y-2.5">
                {/* Customs coverage */}
                <div className="flex items-start justify-between text-xs">
                  <span className="text-slate-600">Customs coverage</span>
                  <div className="text-right">
                    {coverage.similarRecordsCount > 0 ? (
                      <>
                        <div className="font-medium text-slate-900">
                          {coverage.similarRecordsCount} similar import{coverage.similarRecordsCount === 1 ? "" : "s"}
                        </div>
                        <div className="text-slate-500 text-[10px] mt-0.5">
                          {coverage.evidenceSource === "internal_records" ? "From internal records" : "LLM baseline"}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-500">Not enough data yet</span>
                    )}
                  </div>
                </div>
                
                {/* Internal supplier dataset */}
                <div className="flex items-start justify-between text-xs">
                  <span className="text-slate-600">Internal supplier dataset</span>
                  <div className="text-right">
                    {coverage.leadsCount > 0 ? (
                      <>
                        <div className="font-medium text-slate-900">
                          {coverage.leadsCount} lead{coverage.leadsCount === 1 ? "" : "s"} found
                        </div>
                        {coverage.totalRelatedItems > 0 && (
                          <div className="text-slate-500 text-[10px] mt-0.5">
                            {coverage.totalRelatedItems} related item{coverage.totalRelatedItems === 1 ? "" : "s"}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-500">Not enough data yet</span>
                    )}
                  </div>
                </div>
                
                {/* Pricing coverage */}
                <div className="flex items-start justify-between text-xs">
                  <span className="text-slate-600">Pricing coverage</span>
                  <div className="text-right">
                    {coverage.avgPricingCoverage > 0 ? (
                      <span className="font-medium text-slate-900">
                        {coverage.avgPricingCoverage}%
                      </span>
                    ) : (
                      <span className="text-slate-500">0%</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })()}
        
        {/* Questions Checklist Card */}
        {questionsChecklist && (
          <Card className="mt-4 shrink-0 border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {(questionsChecklist as any).dynamicTitle || questionsChecklist.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Included in free report</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyChecklist}
                className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Copy className="w-3 h-3 mr-1.5" />
                Copy checklist
              </Button>
            </div>
            <div className="space-y-2.5">
              {questionsChecklist.items.map((item, idx) => (
                <div key={idx} className="text-xs">
                  <div className="font-medium text-slate-900 mb-0.5">
                    {idx + 1}. {item.q}
                  </div>
                  <div className="text-slate-600">{item.why}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {/* Factory not found banner */}
        {!hasFactories && (
          <div className="mt-4 shrink-0">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm font-medium text-yellow-800 mb-1">
                Factory evidence not found in our dataset yet
              </div>
              <div className="text-xs text-yellow-700">
                This list shows sourcing leads only, not confirmed manufacturers. Quotes can confirm manufacturer status.
              </div>
            </div>
          </div>
        )}
        
        {/* Scrollable content area */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-6">
          {hasSuppliers ? (
            <SuppliersSlide report={report} />
          ) : (
            <div className="text-sm text-slate-500 py-8 text-center">
              <div className="font-medium text-slate-700 mb-1">No sourcing leads found</div>
              <div className="text-xs text-slate-500">
                Upload packaging photo or add barcode to improve matching.
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
