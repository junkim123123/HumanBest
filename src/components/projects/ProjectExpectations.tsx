// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { DEPOSIT_LINE } from "@/lib/copy";

export function ProjectExpectations() {
  return (
    <Card className="p-4 bg-slate-50 border border-slate-200">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-1.5 text-sm text-slate-600">
          <p>• MOQ and lead time will be confirmed by factories.</p>
          <p>• Evidence is attached only when found.</p>
          <p>• {DEPOSIT_LINE}</p>
        </div>
      </div>
    </Card>
  );
}

