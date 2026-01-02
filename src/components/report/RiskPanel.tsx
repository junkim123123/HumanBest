// @ts-nocheck
"use client";

import { AlertTriangle, FileText, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/lib/report/types";

interface RiskPanelProps {
  report: Report;
}

export function RiskPanel({ report }: RiskPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">리스크 분석</h2>
      
      <div className="space-y-6">
        {/* Tariff Risk */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-slate-900">관세 리스크</h3>
            <Badge variant="outline" className="ml-auto">
              {report.baseline.riskScores.tariff}/100
            </Badge>
          </div>
          <div className="space-y-2 pl-7">
            <div>
              <span className="text-sm text-slate-600">HS 추정 범위: </span>
              <span className="text-sm font-medium text-slate-900">
                {report.baseline.riskFlags.tariff.hsCodeRange.join(", ")}
              </span>
            </div>
            {report.baseline.riskFlags.tariff.adCvdPossible && (
              <Badge className="bg-red-100 text-red-700 border-red-300">
                AD/CVD 가능성
              </Badge>
            )}
            {report.baseline.riskFlags.tariff.originSensitive && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                원산지 민감
              </Badge>
            )}
          </div>
        </div>

        {/* Compliance Risk */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">컴플라이언스 리스크</h3>
            <Badge variant="outline" className="ml-auto">
              {report.baseline.riskScores.compliance}/100
            </Badge>
          </div>
          <div className="space-y-3 pl-7">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">
                필수 인증:
              </div>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                {report.baseline.riskFlags.compliance.requiredCertifications.map((cert, i) => (
                  <li key={i}>{cert}</li>
                ))}
              </ul>
            </div>
            {report.baseline.riskFlags.compliance.labelingRisks.length > 0 && (
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">
                  라벨링 리스크:
                </div>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  {report.baseline.riskFlags.compliance.labelingRisks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.baseline.riskFlags.compliance.recallHints.length > 0 && (
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">
                  리콜 힌트:
                </div>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  {report.baseline.riskFlags.compliance.recallHints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Supply Risk */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">공급 리스크</h3>
            <Badge variant="outline" className="ml-auto">
              {report.baseline.riskScores.supply}/100
            </Badge>
          </div>
          <div className="space-y-3 pl-7">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">MOQ 범위:</div>
              <div className="text-sm text-slate-600">
                {report.baseline.riskFlags.supply.moqRange.min.toLocaleString()} -{" "}
                {report.baseline.riskFlags.supply.moqRange.max.toLocaleString()} (typical:{" "}
                {report.baseline.riskFlags.supply.moqRange.typical.toLocaleString()})
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">리드타임:</div>
              <div className="text-sm text-slate-600">
                {report.baseline.riskFlags.supply.leadTimeRange.min} -{" "}
                {report.baseline.riskFlags.supply.leadTimeRange.max} days (typical:{" "}
                {report.baseline.riskFlags.supply.leadTimeRange.typical} days)
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">
                QC 체크 추천:
              </div>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                {report.baseline.riskFlags.supply.qcChecks.map((check, i) => (
                  <li key={i}>{check}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

