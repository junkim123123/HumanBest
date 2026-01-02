// @ts-nocheck
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface CostBreakdownProps {
  report: Report;
}

export function CostBreakdown({ report }: CostBreakdownProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (item: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(item)) {
      newExpanded.delete(item);
    } else {
      newExpanded.add(item);
    }
    setExpandedItems(newExpanded);
  };

  const costItems = [
    {
      id: "factory",
      label: "공장가 추정 범위",
      conservative: report.baseline.costRange.conservative.unitPrice,
      standard: report.baseline.costRange.standard.unitPrice,
      reason: "유사 제품 통관 기록과 카테고리 기준 시장가 범위를 참고했습니다",
    },
    {
      id: "shipping",
      label: "물류비 추정 범위",
      conservative: report.baseline.costRange.conservative.shippingPerUnit,
      standard: report.baseline.costRange.standard.shippingPerUnit,
      reason: "Air Express 기준, 중량과 부피를 고려한 운임 범위입니다",
    },
    {
      id: "duty",
      label: "관세와 수수료 추정 범위",
      conservative:
        report.baseline.costRange.conservative.dutyPerUnit +
        report.baseline.costRange.conservative.feePerUnit,
      standard:
        report.baseline.costRange.standard.dutyPerUnit +
        report.baseline.costRange.standard.feePerUnit,
      reason: "HS 코드 추정 범위에 따른 관세율과 수수료를 적용했습니다",
    },
    {
      id: "total",
      label: "단위당 랜디드 코스트 범위",
      conservative: report.baseline.costRange.conservative.totalLandedCost,
      standard: report.baseline.costRange.standard.totalLandedCost,
      reason: "공장가 + 물류비 + 관세/수수료의 합계입니다",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">비용 분해</h2>
      <div className="space-y-4">
        {costItems.map((item) => {
          const isExpanded = expandedItems.has(item.id);
          return (
            <div
              key={item.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">{item.label}</h3>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">보수적</div>
                      <div className="text-lg font-bold text-slate-900">
                        ${item.conservative.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">기본</div>
                      <div className="text-base font-semibold text-slate-700">
                        ${item.standard.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="ml-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-600">{item.reason}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

