// @ts-nocheck
"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingDown, ShieldCheck, Info, AlertTriangle } from "lucide-react";
import {
  calculateMarginScenarios,
  type MarginScenario,
} from "@/lib/margin-calculator";
import type { ImageAnalysisResult } from "@/lib/intelligence-pipeline";

interface SavingsProps {
  landedCost: number; // e.g., $4.50
  isInference: boolean;
  analysis?: ImageAnalysisResult;
  quantity?: number;
  foodPercentage?: number; // 0-100, percentage of sales from food items
}

export function PotentialSavingsChart({
  landedCost,
  isInference,
  analysis,
  quantity = 100,
  foodPercentage,
}: SavingsProps) {
  // Calculate category-specific domestic price and scenarios
  const {
    domesticPrice,
    scenarios,
    categoryType,
    systemMessage,
    consultingMessage,
  } = calculateMarginScenarios(
    landedCost,
    analysis?.category,
    analysis?.genericCategory,
    quantity,
    foodPercentage
  );

  const savings = domesticPrice - landedCost;
  const savingsPercent = Math.round((savings / domesticPrice) * 100);
  const marginIncrease = (domesticPrice / landedCost).toFixed(1);
  const landedPercentage = (landedCost / domesticPrice) * 100;

  // Calculate scenario percentages
  const worstPercent = Math.round((scenarios.worst / domesticPrice) * 100);
  const basePercent = Math.round((scenarios.base / domesticPrice) * 100);
  const bestPercent = Math.round((scenarios.best / domesticPrice) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Profit Opportunity
          </h3>
          <p className="text-sm text-slate-500">
            Compare your current buy price to a direct sourcing baseline.
          </p>
          {systemMessage && (
            <p className="text-xs text-electric-blue-600 mt-1 font-medium">
              {systemMessage}
            </p>
          )}
          {consultingMessage && (
            <div className="mt-3 p-3 bg-electric-blue-50 rounded-xl border border-electric-blue-200">
              <p className="text-sm text-slate-700 leading-relaxed">
                {consultingMessage}
              </p>
            </div>
          )}
        </div>
        {isInference && (
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
            <Info size={12} /> Market estimate
          </span>
        )}
      </div>

      {/* Comparison Chart */}
      <div className="space-y-6">
        {/* Domestic Wholesaler */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Current Domestic Wholesale Price</span>
            <span className="font-semibold text-slate-900">
              ${domesticPrice.toFixed(2)}
            </span>
          </div>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-slate-400"
            />
          </div>
        </div>

        {/* NexSupply Direct */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-electric-blue-600 flex items-center gap-1">
              Direct Sourcing Landed Cost <ShieldCheck size={14} />
            </span>
            <span className="font-bold text-electric-blue-600">
              ${landedCost.toFixed(2)}
            </span>
          </div>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${landedPercentage}%` }}
              transition={{ duration: 1, delay: 0.7 }}
              className="h-full bg-electric-blue-600 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Worst-Base-Best Scenarios */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Reality Range
          </span>
        </div>
        
        {/* Worst Case */}
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-red-700">Worst case</span>
            <span className="text-sm font-bold text-red-800">
              ${scenarios.worst.toFixed(2)} savings
            </span>
          </div>
          <p className="text-xs text-red-600">
            Includes delays and extra compliance buffer.
          </p>
        </div>

        {/* Base Case */}
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-emerald-700">Base case</span>
            <span className="text-sm font-bold text-emerald-800">
              ${scenarios.base.toFixed(2)} savings
            </span>
          </div>
          <p className="text-xs text-emerald-600">
            Normal clearance with standard handling.
          </p>
        </div>

        {/* Best Case */}
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-blue-700">Best case</span>
            <span className="text-sm font-bold text-blue-800">
              ${scenarios.best.toFixed(2)} savings
            </span>
          </div>
          <p className="text-xs text-blue-600">
            Optimized order with better logistics and packaging.
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg text-white">
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="text-emerald-800 font-bold text-xl">
              Save about {savingsPercent}% per unit
            </div>
            <p className="text-emerald-700 text-sm">
              Your profit margin can increase by{" "}
              <strong>{marginIncrease}x</strong>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

