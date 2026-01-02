// @ts-nocheck
"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { Report } from "@/lib/report/types";

interface AdvancedDetailsSlideProps {
  report: Report;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdvancedDetailsSlide({
  report,
  defaultTab = "classification",
  onTabChange,
}: AdvancedDetailsSlideProps) {
  const reportAny = report as any;
  const marketEstimate = reportAny._marketEstimate;
  const removalReasons = reportAny._removalReasons;
  const [selectedTab, setSelectedTab] = useState(defaultTab);

  // Sync selectedTab when defaultTab changes (e.g., when View suppliers button is clicked)
  useEffect(() => {
    if (defaultTab && defaultTab !== selectedTab) {
      setSelectedTab(defaultTab);
    }
  }, [defaultTab, selectedTab]);

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    onTabChange?.(value);
  };


  // Get HS code candidates with confidence and reason
  const hsCandidates =
    marketEstimate?.hsCandidates ||
    report.baseline.riskFlags.tariff.hsCodeRange.map((code) => ({
      code,
      confidence: 0.8,
      reason: "Category-based classification",
    }));

  // Compliance summary
  const complianceSummary = (() => {
    const certs = report.baseline.riskFlags.compliance.requiredCertifications;
    const labeling = report.baseline.riskFlags.compliance.labelingRisks;
    if (certs.length > 0 || labeling.length > 0) {
      const parts: string[] = [];
      if (certs.length > 0)
        parts.push(
          `${certs.length} certification${certs.length > 1 ? "s" : ""} required`
        );
      if (labeling.length > 0)
        parts.push(
          `${labeling.length} labeling risk${labeling.length > 1 ? "s" : ""}`
        );
      return (
        parts.join(", ") +
        " (Category-based estimate, includes uncertainty)"
      );
    }
    return "Category-based estimate, additional verification recommended";
  })();

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Classification Tab */}
        <TabsContent value="classification" className="mt-4">
          <Card className="border border-slate-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              HS Code candidates
            </h3>
            <div className="space-y-3">
              {hsCandidates.length > 0 ? (
                hsCandidates.map((candidate: any, index: number) => (
                  <div key={index} className="border-l-2 border-slate-200 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900">
                        {candidate.code}
                      </span>
                      <Badge
                        variant="outline"
                        className="h-4 px-1.5 text-xs bg-slate-50 text-slate-700"
                      >
                        {(candidate.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600">
                      {candidate.reason}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">
                  No specific HS codes identified. Consider adding UPC or
                  packaging photo.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="mt-4">
          <Card className="border border-slate-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Compliance
            </h3>
            <div className="text-sm text-slate-700">{complianceSummary}</div>
            {removalReasons &&
              typeof removalReasons === "object" &&
              Object.keys(removalReasons).length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="removal-reasons" className="border-none">
                      <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:no-underline py-2">
                        Removal reasons
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {Object.entries(removalReasons)
                            .filter(
                              ([_, count]) => typeof count === "number" && count > 0
                            )
                            .map(([reason, count]) => {
                              const label = (() => {
                                switch (reason) {
                                  case "tooShort":
                                    return "Product name too short";
                                  case "various":
                                    return "Various keyword";
                                  case "assorted":
                                    return "Assorted keyword";
                                  case "mixed":
                                    return "Mixed keyword";
                                  case "random":
                                    return "Random keyword";
                                  case "banned":
                                    return "Banned keyword";
                                  case "badName":
                                    return "Invalid supplier name";
                                  case "logistics":
                                    return "Logistics keyword";
                                  case "toyMismatch":
                                    return "Category mismatch (toy)";
                                  case "foodMismatch":
                                    return "Category mismatch (food)";
                                  default:
                                    return reason;
                                }
                              })();
                              return (
                                <div
                                  key={reason}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-slate-700">{label}</span>
                                  <span className="font-medium text-slate-900">
                                    {count as number}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
          </Card>
        </TabsContent>

        {/* Assumptions Tab */}
        <TabsContent value="assumptions" className="mt-4">
          <Card className="border border-slate-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Assumptions & Inputs
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">
                    Unit Weight
                  </div>
                  <div className="text-sm text-slate-600">
                    {report.baseline.evidence.assumptions.weight}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">
                    Unit Volume
                  </div>
                  <div className="text-sm text-slate-600">
                    {report.baseline.evidence.assumptions.volume}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">
                    Shipping Mode
                  </div>
                  <div className="text-sm text-slate-600">
                    {report.baseline.evidence.assumptions.shippingMode}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">
                    Incoterms
                  </div>
                  <div className="text-sm text-slate-600">
                    {report.baseline.evidence.assumptions.incoterms}
                  </div>
                </div>
              </div>
              {report.baseline.evidence.assumptions.packaging && (
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">
                    Packaging
                  </div>
                  <div className="text-sm text-slate-600">
                    {report.baseline.evidence.assumptions.packaging}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4">
          <Card className="border border-slate-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Calculation Notes
            </h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <div className="font-medium text-slate-700 mb-1">
                  Cost Formula
                </div>
                <div>
                  Total Landed Cost = Unit Price × (1 + Duty Rate) + Shipping +
                  Fees
                </div>
              </div>
              <div>
                <div className="font-medium text-slate-700 mb-1">
                  Evidence Sources
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {report.baseline.evidence.types.map((type, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-slate-50 text-slate-700"
                    >
                      {type === "similar_records"
                        ? "Similar imports"
                        : type === "category_based"
                        ? "Category Rules"
                        : type === "regulation_check"
                        ? "Regulations"
                        : type}
                    </Badge>
                  ))}
                </div>
                {report.baseline.evidence.types.includes("similar_records") && (
                  <p className="text-sm text-slate-600 mt-2">
                    Past imports of similar products. Used to anchor the
                    estimate.
                  </p>
                )}
              </div>
              <div>
                <div className="font-medium text-slate-700 mb-1">
                  Confidence Level
                </div>
                <div className="capitalize">{report.confidence}</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

