// @ts-nocheck
"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function FreeVsPaidComparison() {
  return (
    <Card className="p-4 mt-4 shrink-0">
      <h3 className="text-base font-semibold text-slate-900 mb-4 text-center">
        What you get now vs what we confirm by outreach
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column - Free */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
              Free, instant
            </Badge>
          </div>
          <h4 className="text-sm font-semibold text-slate-900">What you get now</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>A priced range based on similar imports and benchmarks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>Sourcing leads, not verified quotes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>Outreach pack, message draft and questions checklist</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>Clear assumptions and what to tighten next</span>
            </li>
          </ul>
        </div>

        {/* Right column - Paid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              Paid, execution
            </Badge>
          </div>
          <h4 className="text-sm font-semibold text-slate-900">What we confirm by outreach</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>Price per unit, confirmed in writing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>MOQ and lead time, confirmed in writing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>Packaging specs and carton details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>Payment terms and incoterms</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>Follow ups until missing fields are closed</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-600 text-center">
          Leads can be wrong. Quotes are only shown as confirmed after written confirmation.
        </p>
      </div>
    </Card>
  );
}








