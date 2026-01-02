// @ts-nocheck
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DEPOSIT_RECEIVED, HOME_EXECUTION_NOTE } from "@/lib/copy";

interface SupplierQuoteSummaryProps {
  supplierCount: number;
}

export function SupplierQuoteSummary({ supplierCount }: SupplierQuoteSummaryProps) {
  return (
    <div className="mb-6">
      {/* Summary strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Verified quotes
          </h3>
          <p className="text-xs text-slate-600">
            {supplierCount} factories verified, confirmed numbers in about a week
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-700 border-green-300">
            {DEPOSIT_RECEIVED}
          </Badge>
          <Link
            href="/pricing"
            className="text-sm font-medium text-electric-blue-600 hover:text-electric-blue-700 underline"
          >
            See pricing
          </Link>
        </div>
      </div>
      
      {/* Disclosure line */}
      <p className="text-xs text-slate-500 mt-3">
        {HOME_EXECUTION_NOTE}
      </p>
    </div>
  );
}

