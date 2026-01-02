// @ts-nocheck
"use client";

import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Report } from "@/lib/report/types";

interface ProductConfirmationBlockProps {
  report: Report;
  imageUrl?: string | null;
  onConfirm: () => void;
  onRerun: () => void;
}

export function ProductConfirmationBlock({
  report,
  imageUrl,
  onConfirm,
  onRerun,
}: ProductConfirmationBlockProps) {
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

  return (
    <Card className="p-4 bg-white border border-slate-200 rounded-xl">
      <div className="flex gap-4">
        {/* Image thumbnail */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img
                src={imageUrl}
                alt={report.productName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {report.productName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">{report.category}</p>
            </div>
            <Badge variant="outline" className={cn("h-5 px-2 text-xs border", conf.color)}>
              {conf.label}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={onConfirm}
              className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
            >
              Confirm product
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRerun}
              className="h-8 px-3 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Not my product
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

