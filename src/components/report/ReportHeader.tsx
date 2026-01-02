// @ts-nocheck
"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOverallConfidence } from "@/lib/report/scoring";
import type { Report } from "@/lib/report/types";

interface ReportHeaderProps {
  report: Report;
  onStartVerification?: () => void;
}

export function ReportHeader({ report, onStartVerification }: ReportHeaderProps) {
  const overallConfidence = getOverallConfidence(report);

  const confidenceColor =
    overallConfidence >= 70
      ? "bg-green-100 text-green-700 border-green-300"
      : overallConfidence >= 50
      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
      : "bg-slate-100 text-slate-700 border-slate-300";

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back button and product name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href="/analyze"
              className="flex-shrink-0 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-slate-900 truncate">
                  {report.productName}
                </h1>
                <Badge className={confidenceColor}>
                  {overallConfidence}% confidence
                </Badge>
              </div>
            </div>
          </div>

          {/* Right: Primary CTA */}
          <div className="flex-shrink-0">
            <Button
              onClick={onStartVerification}
              className="bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start verification
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

