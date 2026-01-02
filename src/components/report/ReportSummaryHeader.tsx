// @ts-nocheck
"use client";

import type { Report } from "@/lib/report/types";

interface ReportSummaryHeaderProps {
  report: Report;
}

/**
 * Report Summary Header - 3-line structure
 * Shows: What we know, What we don't know, What input would narrow it
 */
export function ReportSummaryHeader({ report }: ReportSummaryHeaderProps) {
  const reportAny = report as any;
  const similarCount = reportAny._similarRecordsCount || 0;
  const hsCandidatesCount = reportAny._hsCandidatesCount || 0;
  const hasLandedCosts = reportAny._hasLandedCosts || false;
  const priceUnit = reportAny._priceUnit || "per unit";
  
  const standard = report.baseline.costRange.standard;
  const conservative = report.baseline.costRange.conservative;
  const fobMin = standard.unitPrice;
  const fobMax = conservative.unitPrice;
  
  // What we know (certain)
  const certainLine = (() => {
    if (similarCount > 0 && fobMin > 0 && fobMax > 0) {
      return `내부 유사 레코드 ${similarCount}건 기준, FOB ${fobMin.toFixed(2)}에서 ${fobMax.toFixed(2)} ${priceUnit}`;
    } else if (fobMin > 0 && fobMax > 0) {
      return `카테고리 기반 추정, FOB ${fobMin.toFixed(2)}에서 ${fobMax.toFixed(2)} ${priceUnit}`;
    } else {
      return "제품 분석 완료, 가격 범위 계산 중";
    }
  })();
  
  // What we don't know (uncertain)
  const uncertainLine = (() => {
    if (!hasLandedCosts) {
      return "가격이 붙은 공급사 매칭 0건이라 landed cost는 미확정";
    } else if (hsCandidatesCount > 1) {
      return `HS 코드 후보 ${hsCandidatesCount}개로 관세율 불확실`;
    } else if (similarCount === 0) {
      return "유사 수입 기록 없어 범위가 넓음";
    } else {
      return "추가 검증 필요";
    }
  })();
  
  // What input would narrow it
  const inputLine = (() => {
    const suggestions: string[] = [];
    if (hsCandidatesCount > 1) {
      suggestions.push("라벨 사진 추가 시 HS 후보가 줄어 관세 오차가 줄어듦");
    }
    if (similarCount === 0) {
      suggestions.push("바코드 입력 시 유사 레코드 매칭 상승 가능");
    }
    if (!hasLandedCosts) {
      suggestions.push("소재와 사이즈 입력 시 운임 오차 감소");
    }
    return suggestions[0] || "추가 입력으로 범위를 좁힐 수 있음";
  })();

  return (
    <div className="space-y-4 mb-6">
      {/* What we know */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-xs font-medium text-green-700 mb-1">확실한 것</div>
        <div className="text-sm text-slate-900">{certainLine}</div>
      </div>

      {/* What we don't know */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-xs font-medium text-yellow-700 mb-1">모르는 것</div>
        <div className="text-sm text-slate-900">{uncertainLine}</div>
      </div>

      {/* What input would narrow it */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs font-medium text-blue-700 mb-1">다음에 넣으면 줄어드는 입력</div>
        <div className="text-sm text-slate-900">{inputLine}</div>
      </div>
    </div>
  );
}

