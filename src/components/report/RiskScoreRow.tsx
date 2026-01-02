// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";

interface RiskScoreRowProps {
  tariff: number;
  compliance: number;
  supply: number;
  total: number;
  topRisks: string[];
  recommendedActions: string[];
}

export function RiskScoreRow({
  tariff,
  compliance,
  supply,
  total,
  topRisks,
  recommendedActions,
}: RiskScoreRowProps) {
  return (
    <div className="space-y-6">
      {/* Risk Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Customs</h3>
          <p className="text-xs text-slate-500 mb-3">HS code classification and duty risk</p>
          <div className="text-3xl font-bold text-slate-900">{tariff}</div>
        </Card>
        <Card className="p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Compliance</h3>
          <p className="text-xs text-slate-500 mb-3">Certifications and labeling requirements</p>
          <div className="text-3xl font-bold text-slate-900">{compliance}</div>
        </Card>
        <Card className="p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Supply</h3>
          <p className="text-xs text-slate-500 mb-3">MOQ, lead time, and quality consistency</p>
          <div className="text-3xl font-bold text-slate-900">{supply}</div>
        </Card>
      </div>

      {/* Verification note */}
      <Card className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-700">
          If you verify, we confirm the classification path and supplier readiness
        </p>
      </Card>

      {/* Top 3 Risks */}
      <Card className="p-6 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Top 3 Risks</h3>
        <ul className="space-y-2">
          {topRisks.slice(0, 3).map((risk, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-slate-400 mt-1">•</span>
              <span>{risk}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Recommended Actions */}
      <Card className="p-6 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recommended Actions</h3>
        <ul className="space-y-2">
          {recommendedActions.map((action, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-slate-400 mt-1">•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

