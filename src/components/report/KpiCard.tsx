// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  min?: number;
  max?: number;
  currency?: string;
  note?: string;
  riskScores?: {
    tariff?: number;
    compliance?: number;
    supply?: number;
    total?: number;
  };
}

export function KpiCard({ title, min = 0, max = 0, currency = "$", note, riskScores }: KpiCardProps) {
  if (riskScores) {
    // Risk summary card
    return (
      <Card className="p-8 rounded-2xl border border-slate-200">
        <h3 className="text-base font-semibold text-slate-700 mb-6">{title}</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Customs</span>
            <span className="font-semibold text-slate-900">{riskScores.tariff || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Compliance</span>
            <span className="font-semibold text-slate-900">{riskScores.compliance || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Supply</span>
            <span className="font-semibold text-slate-900">{riskScores.supply || 0}</span>
          </div>
          <div className="border-t border-slate-200 pt-4 mt-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-base font-semibold text-slate-900">Total Risk</span>
              <span className="text-4xl md:text-5xl font-bold text-slate-900">{riskScores.total || 0}</span>
            </div>
            {note && (
              <p className="text-sm text-slate-500 mt-2">{note}</p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Range card
  return (
    <Card className="p-8 rounded-2xl border border-slate-200">
      <h3 className="text-base font-semibold text-slate-700 mb-6">{title}</h3>
      <div className="space-y-4">
        <div>
          <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-1">
            {currency}{min.toFixed(2)}
          </div>
          <div className="text-sm text-slate-500">min</div>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-1">
            {currency}{max.toFixed(2)}
          </div>
          <div className="text-sm text-slate-500">max</div>
        </div>
        {note && (
          <p className="text-sm text-slate-500 mt-4">{note}</p>
        )}
      </div>
    </Card>
  );
}

