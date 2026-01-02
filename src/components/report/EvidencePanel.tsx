// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Report, EvidenceItem } from "@/lib/report/types";
import { Calendar, MapPin, Package, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EvidencePanelProps {
  report: Report;
}

export function EvidencePanel({ report }: EvidencePanelProps) {
  const { items, lastAttemptAt, lastResult, lastErrorCode } = report.baseline.evidence;

  const strengthColors = {
    low: "bg-yellow-100 text-yellow-700 border-yellow-300",
    medium: "bg-blue-100 text-blue-700 border-blue-300",
    high: "bg-green-100 text-green-700 border-green-300",
  };

  const sourceLabels = {
    us_import_records: "US Import Records",
    internal_db: "Internal Database",
  };

  const matchedByLabels = {
    hs: "HS Code",
    keywords: "Keywords",
    category: "Category",
  };

  // Group items by source
  const itemsBySource = items.reduce((acc, item) => {
    if (!acc[item.source]) {
      acc[item.source] = [];
    }
    acc[item.source].push(item);
    return acc;
  }, {} as Record<string, EvidenceItem[]>);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Evidence Details
          </h3>

          {/* Evidence Items */}
          {items.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(itemsBySource).map(([source, sourceItems]) => (
                <div key={source} className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">
                    {sourceLabels[source as keyof typeof sourceLabels]}
                  </h4>
                  {sourceItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-900 mb-1">
                            {item.title}
                          </h5>
                          <p className="text-sm text-slate-600">
                            {item.summary}
                          </p>
                        </div>
                        <Badge className={strengthColors[item.strength]}>
                          {item.strength}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200">
                        {/* Last Seen */}
                        {item.observed.lastSeenDate && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Last seen{" "}
                              {formatDistanceToNow(
                                new Date(item.observed.lastSeenDate),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        )}

                        {/* Likely Origins */}
                        {item.observed.likelyOrigins.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span>
                              Top origins: {item.observed.likelyOrigins.slice(0, 3).join(", ")}
                            </span>
                          </div>
                        )}

                        {/* Typical Lot Range */}
                        {(item.observed.typicalLotRange.min !== null ||
                          item.observed.typicalLotRange.max !== null) && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Package className="w-4 h-4" />
                            <span>
                              Typical lot:{" "}
                              {item.observed.typicalLotRange.min !== null &&
                              item.observed.typicalLotRange.max !== null
                                ? `${item.observed.typicalLotRange.min.toLocaleString()} - ${item.observed.typicalLotRange.max.toLocaleString()} ${item.observed.typicalLotRange.unit}`
                                : item.observed.typicalLotRange.min !== null
                                ? `${item.observed.typicalLotRange.min.toLocaleString()}+ ${item.observed.typicalLotRange.unit}`
                                : `Up to ${item.observed.typicalLotRange.max?.toLocaleString()} ${item.observed.typicalLotRange.unit}`}
                            </span>
                          </div>
                        )}

                        {/* Matched By */}
                        {item.observed.matchedBy.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>Matched by:</span>
                            <div className="flex gap-1">
                              {item.observed.matchedBy.map((match) => (
                                <Badge
                                  key={match}
                                  variant="outline"
                                  className="text-xs bg-white"
                                >
                                  {matchedByLabels[match]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No evidence items found yet.</p>
              <p className="text-xs mt-1">
                Use the "Upgrade evidence" button to search import records.
              </p>
            </div>
          )}
        </div>

        {/* Last Attempt Status */}
        {lastAttemptAt && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm">
              {lastResult === "found" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-slate-600">
                    Evidence found{" "}
                    {formatDistanceToNow(new Date(lastAttemptAt), {
                      addSuffix: true,
                    })}
                  </span>
                </>
              ) : lastResult === "none" ? (
                <>
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">
                    No import evidence found. Baseline remains.{" "}
                    {formatDistanceToNow(new Date(lastAttemptAt), {
                      addSuffix: true,
                    })}
                  </span>
                </>
              ) : lastResult === "error" ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-slate-600">
                    Error during evidence lookup{" "}
                    {formatDistanceToNow(new Date(lastAttemptAt), {
                      addSuffix: true,
                    })}
                    {lastErrorCode && ` (${lastErrorCode})`}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
