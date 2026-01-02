// @ts-nocheck
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, Copy, Download } from "lucide-react";
import type { Report } from "@/lib/report/types";
import { buildOutreachEmail, buildChecklistText, categoryToSlug, type FactoryProfile } from "./factory-utils";

interface FactoriesSectionProps {
  factories: FactoryProfile[];
  category: string;
  report: Report;
}

export function FactoriesSection({ factories, category, report }: FactoriesSectionProps) {
  const [copiedFactoryId, setCopiedFactoryId] = useState<string | null>(null);
  const [downloadedFactoryId, setDownloadedFactoryId] = useState<string | null>(null);

  const formatDateShort = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const handleCopyEmail = async (factory: FactoryProfile) => {
    try {
      const emailText = buildOutreachEmail(report, factory);
      await navigator.clipboard.writeText(emailText);
      setCopiedFactoryId(factory.supplier_id);
      setTimeout(() => setCopiedFactoryId(null), 2000);
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  const handleDownloadChecklist = (factory: FactoryProfile) => {
    try {
      const checklistText = buildChecklistText(report);
      const blob = new Blob([checklistText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const categorySlug = categoryToSlug(category);
      a.href = url;
      a.download = `nexsupply-checklist-${categorySlug}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadedFactoryId(factory.supplier_id);
      setTimeout(() => setDownloadedFactoryId(null), 2000);
    } catch (err) {
      console.error("Failed to download checklist:", err);
    }
  };

  return (
    <Card className="border border-slate-200 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Factories in our dataset for this category
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Factories sourced from our internal supplier dataset for this category. Not guaranteed to be the exact manufacturer for your product.
        </p>
      </div>

      {factories.length === 0 ? (
        <div className="text-sm text-slate-500 py-4">
          <div className="font-medium text-slate-700 mb-1">
            No factory profiles found for "{category}"
          </div>
          <div className="text-xs text-slate-500">
            We are continuously expanding our database. Try a different category or use the sourcing leads below.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {factories.map((factory) => (
            <div
              key={factory.supplier_id}
              className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Factory name and badges */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Factory className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {factory.supplier_name}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Factory
                    </Badge>
                  </div>

                  {/* Meta info */}
                  <div className="space-y-1 text-xs text-slate-600">
                    <div>
                      <span className="font-medium">Products: </span>
                      {factory.product_count} {factory.product_count === 1 ? "product" : "products"}
                    </div>
                    {factory.moq_median && (
                      <div>
                        <span className="font-medium">MOQ: </span>
                        {factory.moq_median.toLocaleString()} units (median)
                      </div>
                    )}
                    {factory.last_seen_at && (
                      <div>
                        <span className="font-medium">Last seen: </span>
                        {formatDateShort(factory.last_seen_at)}
                      </div>
                    )}
                    {factory.sample_products.length > 0 && (
                      <div>
                        <span className="font-medium">Sample products: </span>
                        {factory.sample_products.slice(0, 2).join(", ")}
                        {factory.sample_products.length > 2 && ` +${factory.sample_products.length - 2} more`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyEmail(factory)}
                    className="h-7 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="w-3 h-3 mr-1.5" />
                    {copiedFactoryId === factory.supplier_id ? "Copied" : "Copy outreach email"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadChecklist(factory)}
                    className="h-7 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="w-3 h-3 mr-1.5" />
                    {downloadedFactoryId === factory.supplier_id ? "Downloaded" : "Download checklist"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

