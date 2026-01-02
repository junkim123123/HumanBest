// @ts-nocheck
"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Report } from "@/lib/report/types";

interface DecisionSignalCardProps {
  report: Report;
}

export function DecisionSignalCard({ report }: DecisionSignalCardProps) {
  // Determine signal state based on risk scores and evidence
  const totalRisk = report.baseline.riskScores.total;
  const hasEvidence = report.signals.hasImportEvidence;
  const hasRequiredCerts = report.baseline.riskFlags.compliance.requiredCertifications.length > 0;
  const hasMultipleHSCodes = report.baseline.riskFlags.tariff.hsCodeRange.length > 1;
  const adCvdPossible = report.baseline.riskFlags.tariff.adCvdPossible;
  const originSensitive = report.baseline.riskFlags.tariff.originSensitive;

  // Determine signal state
  let signalState: "green" | "yellow" | "red";
  let reasons: string[] = [];

  if (totalRisk < 30 && hasEvidence && !hasRequiredCerts && !hasMultipleHSCodes && !adCvdPossible && !originSensitive) {
    signalState = "green";
    reasons = [
      "Low total risk score",
      hasEvidence ? "Import evidence found" : "Category-based estimate",
      "No critical compliance requirements",
    ];
  } else if (totalRisk >= 70 || adCvdPossible || (hasRequiredCerts && hasMultipleHSCodes)) {
    signalState = "red";
    if (adCvdPossible) reasons.push("AD/CVD duties possible");
    if (hasRequiredCerts && hasMultipleHSCodes) reasons.push("HS code uncertainty with compliance requirements");
    if (totalRisk >= 70) reasons.push("High total risk score");
    if (originSensitive) reasons.push("Origin-sensitive product");
  } else {
    signalState = "yellow";
    if (hasMultipleHSCodes) reasons.push("Multiple HS code candidates");
    if (hasRequiredCerts) reasons.push("Required certifications identified");
    if (!hasEvidence) reasons.push("Limited import evidence");
    if (totalRisk >= 50) reasons.push("Moderate risk score");
  }

  const stateConfig = {
    green: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      label: "Importable",
    },
    yellow: {
      icon: AlertTriangle,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      label: "Verify first",
    },
    red: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "High risk",
    },
  };

  const config = stateConfig[signalState];
  const Icon = config.icon;

  return (
    <Card className={cn("p-5 border-2", config.bg, config.border)}>
      <div className="flex items-start gap-3 mb-4">
        <Icon className={cn("w-6 h-6 flex-shrink-0 mt-0.5", config.color)} />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Is this importable?
          </h3>
          <p className={cn("text-sm font-medium", config.color)}>{config.label}</p>
        </div>
      </div>

      <div className="space-y-2">
        {reasons.slice(0, 3).map((reason, index) => (
          <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="text-slate-400 mt-0.5">•</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

