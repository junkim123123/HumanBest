// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { TrendingUp, Target, DollarSign } from "lucide-react";

interface BreakEvenCardProps {
  landedCost: number;
  estimatedRetailPrice?: { min: number; max: number };
  quantity?: number;
}

export function BreakEvenCard({
  landedCost,
  estimatedRetailPrice,
  quantity = 100,
}: BreakEvenCardProps) {
  // Calculate break-even quantity
  // Assuming 50% margin target
  const targetMargin = 0.5;
  const estimatedPrice = estimatedRetailPrice 
    ? (estimatedRetailPrice.min + estimatedRetailPrice.max) / 2
    : landedCost * 2; // Default 2x markup
  
  const breakEvenQuantity = Math.ceil(
    (quantity * landedCost) / (estimatedPrice * (1 - targetMargin))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-xl">
          <Target className="w-5 h-5 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          Break Even Analysis
        </h2>
      </div>

      <div className="space-y-4">
        {estimatedRetailPrice && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Estimated retail price range</div>
            <div className="text-lg font-bold text-slate-900">
              ${estimatedRetailPrice.min.toFixed(2)} - ${estimatedRetailPrice.max.toFixed(2)}
            </div>
          </div>)}

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <div>
              <div className="text-xs text-emerald-700 mb-1">Break even quantity</div>
              <div className="text-2xl font-bold text-emerald-900">
                {breakEvenQuantity} units
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                Sell {breakEvenQuantity} units to cover costs at 50% margin target
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
          Based on landed cost ${landedCost.toFixed(2)} per unit and estimated retail price.
        </div>
      </div>
    </motion.div>
  );
}

