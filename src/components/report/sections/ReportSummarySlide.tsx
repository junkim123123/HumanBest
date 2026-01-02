// @ts-nocheck
"use client";

import { type ReactNode } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/lib/report/types";

interface ReportSummarySlideProps {
  report: Report;
  onTightenClick?: () => void;
  onConfirm?: () => void;
  onRerun?: () => void;
  onViewSourcingLeads?: () => void;
  actionsOverride?: ReactNode;
}

export function ReportSummarySlide({
  report,
  onTightenClick,
  onConfirm,
  onRerun,
  onViewSourcingLeads,
  actionsOverride,
}: ReportSummarySlideProps) {
  const reportAny = report as any;
  const similarCount = reportAny._similarRecordsCount || 0;
  const hsCandidatesCount = reportAny._hsCandidatesCount || 0;
  const hasLandedCosts = reportAny._hasLandedCosts || false;
  const priceUnit = reportAny._priceUnit || "per unit";
  const supplierCandidateCount = reportAny._supplierCandidateCount || 0;
  const supplierRecommendedCount = reportAny._supplierRecommendedCount || 0;
  const totalSupplierCount = supplierCandidateCount + supplierRecommendedCount;

  const standard = report.baseline.costRange.standard;
  const conservative = report.baseline.costRange.conservative;
  const fobMin = standard.unitPrice;
  const fobMax = conservative.unitPrice;

  // Key takeaways data
  const known = (() => {
    if (similarCount > 0 && fobMin > 0 && fobMax > 0) {
      return `Evidence backed: Based on ${similarCount} similar record${similarCount === 1 ? "" : "s"}, FOB $${fobMin.toFixed(2)} - $${fobMax.toFixed(2)} ${priceUnit}`;
    } else if (fobMin > 0 && fobMax > 0) {
      return `Assumption labeled: Category-based estimate, FOB $${fobMin.toFixed(2)} - $${fobMax.toFixed(2)} ${priceUnit}`;
    }
    return "Needs input: Product analysis complete, calculating price range";
  })();

  const unknown = (() => {
    if (!hasLandedCosts) {
      return "Assumption labeled: Quotes not collected yet. We can request and confirm pricing, MOQ, and lead time.";
    } else if (hsCandidatesCount > 1) {
      return `Assumption labeled: ${hsCandidatesCount} HS code candidates, duty rate uncertain`;
    } else if (similarCount === 0) {
      return "Assumption labeled: No similar import records, range is wide";
    }
    return "Needs input: Additional information recommended";
  })();

  const nextInputs = (() => {
    const suggestions: string[] = [];
    if (hsCandidatesCount > 1) {
      suggestions.push("Upload packaging photo to reduce HS candidates");
    }
    if (similarCount === 0) {
      suggestions.push("Add barcode to improve matching");
    }
    if (!hasLandedCosts) {
      suggestions.push("Request quotes to confirm pricing, MOQ, and lead time");
    }
    return suggestions[0] || "Upload packaging photo to narrow the range";
  })();

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

  const conf = confidenceConfig[report.confidence];

  // Determine confidence level label (Evidence backed, Assumption labeled, Needs input)
  const getConfidenceLevelLabel = (): "Evidence backed" | "Assumption labeled" | "Needs input" => {
    if (similarCount > 0 && hasLandedCosts && hsCandidatesCount === 1) {
      return "Evidence backed";
    } else if (similarCount === 0 && !hasLandedCosts) {
      return "Needs input";
    } else {
      return "Assumption labeled";
    }
  };

  const confidenceLevelLabel = getConfidenceLevelLabel();

  // Build confidence explanation (3-line human-readable reason)
  const buildConfidenceExplanation = () => {
    const reasons: string[] = [];
    
    // Reason 1: Similar records count
    if (similarCount > 0) {
      reasons.push(`Similar imports found, ${similarCount} record${similarCount === 1 ? "" : "s"}`);
    } else {
      reasons.push("No similar imports found");
    }
    
    // Reason 2: HS code ambiguity
    if (hsCandidatesCount === 1) {
      reasons.push("HS code is clear, 1 candidate");
    } else if (hsCandidatesCount > 1) {
      reasons.push(`HS code ambiguity, ${hsCandidatesCount} candidates`);
    } else {
      reasons.push("HS code not identified");
    }
    
    // Reason 3: Quotes status
    if (hasLandedCosts) {
      reasons.push("Quotes collected");
    } else {
      reasons.push("Quotes not collected yet");
    }
    
    return reasons;
  };

  const confidenceReasons = buildConfidenceExplanation();

  // Evidence data
  const evidenceTypes = report.baseline.evidence.types;
  const lastUpdated = report.baseline.evidence.lastSuccessAt || report.updatedAt;
  const similarRecordsSample = reportAny._similarRecordsSample || [];
  const sourceLabel = evidenceTypes.includes("similar_records")
    ? "internal records"
    : evidenceTypes.includes("category_based")
    ? "category_based"
    : "regulation_check";

  // Blockers data
  const removalReasons = reportAny._removalReasons || null;
  const blockers: Array<{ label: string }> = [];
  if (!hasLandedCosts) {
    blockers.push({ label: "Quotes not collected yet" });
  }
  if (removalReasons && typeof removalReasons === "object") {
    const entries = Object.entries(removalReasons)
      .filter(([_, count]) => typeof count === "number" && count > 0)
      .map(([reason, count]) => ({ reason, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);
    entries.forEach(({ reason, count }) => {
      const label = (() => {
        switch (reason) {
          case "logistics":
            return `Logistics keyword: ${count} removed`;
          case "badName":
            return `Invalid supplier: ${count} removed`;
          case "banned":
            return `Banned keyword: ${count} removed`;
          case "toyMismatch":
            return `Category mismatch: ${count} removed`;
          case "tooShort":
            return `Name too short: ${count} removed`;
          default:
            return `${reason}: ${count}`;
        }
      })();
      blockers.push({ label });
    });
  }
  if (blockers.length === 0) {
    blockers.push({ label: "Additional verification recommended" });
  }

  // Top cost driver
  const drivers = [
    {
      label: "Unit price",
      standard: standard.unitPrice,
      conservative: conservative.unitPrice,
    },
    {
      label: "Shipping",
      standard: standard.shippingPerUnit,
      conservative: conservative.shippingPerUnit,
    },
    {
      label: "Duty",
      standard: standard.dutyPerUnit,
      conservative: conservative.dutyPerUnit,
    },
  ]
    .filter((d) => d.standard > 0 || d.conservative > 0)
    .sort((a, b) => {
      const aMax = Math.max(a.standard, a.conservative);
      const bMax = Math.max(b.standard, b.conservative);
      return bMax - aMax;
    });

  const topDriver = drivers[0];

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto py-6 px-4 md:px-6">
      {/* Top row: Product identity + Actions */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl flex-1">
          <div className="flex gap-4">
            {/* Image thumbnail */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-slate-400" />
              </div>
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {report.productName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">{report.category}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className={`h-5 px-2 text-xs border ${conf.color}`}
                  >
                    {confidenceLevelLabel}
                  </Badge>
                  {similarCount > 0 && (
                    <div className="text-xs text-slate-500 text-right max-w-[200px]">
                      Found {similarCount} similar import{similarCount === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        {(actionsOverride || onConfirm || onRerun) && (
          <div className="flex gap-2 flex-shrink-0">
            {actionsOverride ? (
              actionsOverride
            ) : (
              <>
                {onConfirm && (
                  <Button
                    size="sm"
                    onClick={onConfirm}
                    className="h-8 px-3 text-xs bg-electric-blue-600 hover:bg-electric-blue-700"
                  >
                    Confirm product
                  </Button>
                )}
                {onRerun && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRerun}
                    className="h-8 px-3 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Not my product
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Main grid: Left (Key takeaways + Evidence) + Right (Cost + Blocking) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key takeaways */}
          <Card className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Key takeaways
              </h3>
              {confidenceReasons.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {confidenceReasons.map((reason, idx) => (
                    <div key={idx} className="text-xs text-slate-600">
                      • {reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {/* Known */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs font-medium text-green-700">Known</div>
                </div>
                <div className="text-sm text-slate-900 line-clamp-2">{known}</div>
              </div>

              {/* Unknown */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2 mb-1.5">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs font-medium text-yellow-700">Unknown</div>
                </div>
                <div className="text-sm text-slate-900 line-clamp-2">{unknown}</div>
              </div>

              {/* Next inputs */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2 mb-1.5">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs font-medium text-blue-700">Next inputs</div>
                </div>
                <div className="text-sm text-slate-900 line-clamp-2">{nextInputs}</div>
              </div>
            </div>

            {/* Evidence meta strip */}
            <div className="border-t border-slate-200 pt-3">
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2.5">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Similar records</div>
                    <div className="text-sm font-medium text-slate-900">
                      {similarCount > 0 ? `${similarCount} records` : "None"}
                    </div>
                    {similarCount > 0 && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {sourceLabel === "internal records" ? "from past imports" : sourceLabel}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">HS candidates</div>
                    <div className="text-sm font-medium text-slate-900">
                      {hsCandidatesCount} {hsCandidatesCount === 1 ? "code" : "codes"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Price unit</div>
                    <div className="text-sm font-medium text-slate-900">{priceUnit}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Last updated</div>
                    <div className="text-sm font-medium text-slate-900">
                      {new Date(lastUpdated).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                {/* Supplier candidates */}
                {totalSupplierCount > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <div className="text-xs text-slate-500 mb-0.5">
                          Supplier candidates
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {totalSupplierCount} {totalSupplierCount === 1 ? "supplier" : "suppliers"}
                        </div>
                      </div>
                      {onViewSourcingLeads && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onViewSourcingLeads}
                          className="h-7 px-3 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          View sourcing leads
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {/* Sample records preview */}
                {similarRecordsSample.length > 0 && similarCount > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500 mb-1.5">
                      Sample records ({similarCount})
                    </div>
                    <div className="space-y-1.5">
                      {similarRecordsSample.slice(0, 2).map((sample: any, index: number) => (
                        <div
                          key={index}
                          className="text-xs text-slate-700 border-l-2 border-slate-200 pl-2"
                        >
                          <div className="font-medium truncate">
                            {sample.exporterName || sample.supplier_name || "Unknown supplier"}
                          </div>
                          {sample.unit_price && (
                            <div className="text-slate-600">
                              ${sample.unit_price} {sample.moq && `/ MOQ: ${sample.moq}`}
                            </div>
                          )}
                        </div>
                      ))}
                      {similarCount > 2 && (
                        <div className="text-xs text-slate-500 italic">
                          +{similarCount - 2} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: Cost snapshot with Blocking */}
        <div className="lg:col-span-1">
          <Card className="p-4 bg-white border border-slate-200 rounded-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              Cost snapshot
            </h3>

            <div className="space-y-4">
              {/* How we decide confidence */}
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs font-medium text-slate-700 mb-2">
                  How we decide confidence
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div>• <span className="font-medium">Evidence backed:</span> Similar records found and range supported</div>
                  <div>• <span className="font-medium">Assumption labeled:</span> Category estimate with assumptions shown</div>
                  <div>• <span className="font-medium">Needs input:</span> Packaging photo or supplier quote improves precision</div>
                </div>
              </div>

              {/* FOB range */}
              {fobMin > 0 && fobMax > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">FOB range</div>
                  <div className="text-2xl font-semibold text-slate-900">
                    ${fobMin.toFixed(2)} - ${fobMax.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{priceUnit}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {similarCount > 0
                      ? `Based on ${similarCount} similar import${similarCount === 1 ? "" : "s"}`
                      : sourceLabel === "category_based"
                      ? "Based on category benchmarks"
                      : "Based on matched import records"}
                  </div>
                </div>
              )}

              {/* Delivered cost */}
              <div>
                <div className="text-xs text-slate-500 mb-1">Delivered cost</div>
                {hasLandedCosts &&
                standard.totalLandedCost > 0 &&
                conservative.totalLandedCost > 0 ? (
                  <>
                    <div className="text-lg font-semibold text-slate-900">
                      ${standard.totalLandedCost.toFixed(2)} - $
                      {conservative.totalLandedCost.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{priceUnit}</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium text-slate-500">
                      Needs input
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Waiting for quotes or packaging details.
                    </div>
                  </>
                )}
              </div>

              {/* Top driver */}
              {topDriver && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Top cost driver</div>
                  <div className="text-sm font-medium text-slate-900">
                    {topDriver.label}: ${topDriver.standard.toFixed(2)} - $
                    {topDriver.conservative.toFixed(2)}
                  </div>
                </div>
              )}

              {/* What's blocking confidence */}
              {blockers.length > 0 && (
                <div>
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-semibold text-slate-900">
                      What's blocking confidence
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {blockers.slice(0, 2).map((blocker, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>{blocker.label}</span>
                      </div>
                    ))}
                  </div>
                  {onTightenClick && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onTightenClick}
                        className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-8"
                      >
                        Tighten inputs
                      </Button>
                      <div className="text-xs text-slate-500 mt-1.5 text-center">
                        Packaging photo reduces HS ambiguity
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
