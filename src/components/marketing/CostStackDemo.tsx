// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { recalcReportFromAssumptions } from "@/lib/report/recalc";
import { formatCurrency } from "@/lib/utils/format";
import type { Report } from "@/lib/report/types";
import Link from "next/link";

interface CostStackDemoProps {
  isActive: boolean;
}

// Mock report for demo
const DEMO_REPORT: Report = {
  schemaVersion: 1,
  id: "demo",
  productName: "Demo Product",
  summary: "",
  category: "toy",
  confidence: "medium",
  baseline: {
    costRange: {
      conservative: {
        unitPrice: 0.85,
        shippingPerUnit: 1.50,
        dutyPerUnit: 0.21,
        feePerUnit: 0.10,
        totalLandedCost: 2.66,
      },
      standard: {
        unitPrice: 0.75,
        shippingPerUnit: 1.20,
        dutyPerUnit: 0.19,
        feePerUnit: 0.08,
        totalLandedCost: 2.22,
      },
    },
    riskScores: {
      tariff: 0,
      compliance: 0,
      supply: 0,
      total: 0,
    },
    riskFlags: {
      tariff: {
        hsCodeRange: [],
        adCvdPossible: false,
        originSensitive: false,
      },
      compliance: {
        requiredCertifications: [],
        labelingRisks: [],
        recallHints: [],
      },
      supply: {
        moqRange: { min: 0, max: 0, typical: 0 },
        leadTimeRange: { min: 0, max: 0, typical: 0 },
        qcChecks: [],
      },
    },
    evidence: {
      types: [],
      assumptions: {
        packaging: "",
        weight: "150g",
        volume: "0.0015 m³",
        incoterms: "FOB",
        shippingMode: "Air Express",
      },
    },
  },
  verification: {
    status: "not_requested",
  },
  nextActions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function CostStackDemo({ isActive }: CostStackDemoProps) {
  const [unitWeightG, setUnitWeightG] = useState(150);
  const [unitVolumeCbm, setUnitVolumeCbm] = useState(0.0015);
  const [shipMode, setShipMode] = useState("Air Express");

  // Recalculate report when inputs change - use useMemo to avoid infinite loops
  const report = useMemo(() => {
    if (!isActive) return DEMO_REPORT;
    return recalcReportFromAssumptions(DEMO_REPORT, {
      unitWeightG,
      unitVolumeCbm,
      shipMode,
    });
  }, [unitWeightG, unitVolumeCbm, shipMode, isActive]);

  // Use direct values instead of springs for more stable behavior
  const totalValue = report.baseline.costRange.standard.totalLandedCost;
  const fobValue = report.baseline.costRange.standard.unitPrice;
  const freightValue = report.baseline.costRange.standard.shippingPerUnit;
  const dutyValue = report.baseline.costRange.standard.dutyPerUnit;
  const feesValue = report.baseline.costRange.standard.feePerUnit;

  // Format values with currency formatting and ensure minimum floor
  const safeFobValue = Math.max(fobValue, 0.5);
  const safeFreightValue = Math.max(freightValue, 0.5);
  const safeDutyValue = Math.max(dutyValue, 0.1);
  const safeFeesValue = Math.max(feesValue, 0.05);
  const safeTotalValue = Math.max(totalValue, 1.0);

  const totalDisplay = formatCurrency(safeTotalValue);
  const fobDisplay = formatCurrency(safeFobValue);
  const freightDisplay = formatCurrency(safeFreightValue);
  const dutyDisplay = formatCurrency(safeDutyValue);
  const feesDisplay = formatCurrency(safeFeesValue);

  // Calculate proportions for stacked visualization
  const totalForStack = safeFobValue + safeFreightValue + safeDutyValue + safeFeesValue;
  const fobPercent = (safeFobValue / totalForStack) * 100;
  const freightPercent = (safeFreightValue / totalForStack) * 100;
  const dutyPercent = (safeDutyValue / totalForStack) * 100;
  const feesPercent = (safeFeesValue / totalForStack) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <Card className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="weight" className="text-sm font-semibold">
                Unit Weight: {unitWeightG}g
              </Label>
              <Slider
                id="weight"
                min={50}
                max={500}
                step={10}
                value={[unitWeightG]}
                onValueChange={([value]) => setUnitWeightG(value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="volume" className="text-sm font-semibold">
                Unit Volume: {unitVolumeCbm.toFixed(4)} m³
              </Label>
              <Slider
                id="volume"
                min={0.0005}
                max={0.005}
                step={0.0001}
                value={[unitVolumeCbm]}
                onValueChange={([value]) => setUnitVolumeCbm(value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="shipmode" className="text-sm font-semibold">
                Shipping Mode
              </Label>
              <select
                id="shipmode"
                value={shipMode}
                onChange={(e) => setShipMode(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue-500"
              >
                <option value="Air Express">Air Express</option>
                <option value="Air Freight">Air Freight</option>
                <option value="Ocean Freight">Ocean Freight</option>
              </select>
            </div>
            
            <div className="pt-2">
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Open assumptions modal if available
                }}
                className="text-sm text-electric-blue-600 hover:text-electric-blue-700 underline"
              >
                Edit assumptions
              </Link>
            </div>
          </div>

          {/* Stack Visualization */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-slate-700 mb-4">
              Cost Breakdown
            </div>
            
            {/* Stacked Horizontal Bar */}
            <div className="relative">
              <div className="h-12 bg-slate-100 rounded-lg overflow-hidden flex">
                <motion.div
                  className="bg-electric-blue-600 flex items-center justify-center text-white text-xs font-semibold"
                  initial={{ width: 0 }}
                  animate={isActive ? { width: `${fobPercent}%` } : { width: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {isActive && fobPercent > 8 && <span>FOB</span>}
                </motion.div>
                <motion.div
                  className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
                  initial={{ width: 0 }}
                  animate={isActive ? { width: `${freightPercent}%` } : { width: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                >
                  {isActive && freightPercent > 8 && <span>Freight</span>}
                </motion.div>
                <motion.div
                  className="bg-orange-500 flex items-center justify-center text-white text-xs font-semibold"
                  initial={{ width: 0 }}
                  animate={isActive ? { width: `${dutyPercent}%` } : { width: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                >
                  {isActive && dutyPercent > 8 && <span>Duty</span>}
                </motion.div>
                <motion.div
                  className="bg-purple-500 flex items-center justify-center text-white text-xs font-semibold"
                  initial={{ width: 0 }}
                  animate={isActive ? { width: `${feesPercent}%` } : { width: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                >
                  {isActive && feesPercent > 8 && <span>Fees</span>}
                </motion.div>
              </div>
              
              {/* Labels below bar */}
              <div className="flex items-center justify-between mt-3 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-electric-blue-600"></div>
                  <span>FOB: {fobDisplay}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span>Freight: {freightDisplay}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-500"></div>
                  <span>Duty: {dutyDisplay}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-purple-500"></div>
                  <span>Fees: {feesDisplay}</span>
                </div>
              </div>
            </div>

            {/* Total Landed Cost - Prominent */}
            <div className="pt-4 mt-6 border-t-2 border-slate-300 bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">
                  Total Landed Cost
                </span>
                <span className="text-3xl font-bold text-electric-blue-600">
                  {totalDisplay}
                </span>
              </div>
            </div>
            
            {/* Secondary link */}
            <div className="mt-4 text-center">
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Open video modal if available
                }}
                className="text-sm text-slate-600 hover:text-slate-900 underline"
              >
                Watch how it works
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

