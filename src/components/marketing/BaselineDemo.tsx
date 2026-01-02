"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { DollarSign, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface BaselineDemoProps {
  isActive: boolean;
}

export function BaselineDemo({ isActive }: BaselineDemoProps) {
  // Realistic demo values with minimum floors
  const landedMin = 2.22;
  const landedMax = 2.66;
  const landedTypical = 2.44;
  const fobMin = 0.75;
  const fobMax = 0.85;
  const fobTypical = 0.80;

  const [landedProgress, setLandedProgress] = useState(0);
  const [fobProgress, setFobProgress] = useState(0);

  useEffect(() => {
    if (isActive) {
      setLandedProgress(100);
      setFobProgress(100);
    } else {
      setLandedProgress(0);
      setFobProgress(0);
    }
  }, [isActive]);

  const rangeWidth = landedMax - landedMin;
  const typicalPosition = ((landedTypical - landedMin) / rangeWidth) * 100;
  const fobRangeWidth = fobMax - fobMin;
  const fobTypicalPosition = ((fobTypical - fobMin) / fobRangeWidth) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="p-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-electric-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Landed Cost Range
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Baseline from LLM and category signals
              </p>
            </div>
          </div>
          
          {/* Range Bar */}
          <div className="relative mb-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-electric-blue-500 to-electric-blue-600"
                initial={{ width: 0 }}
                animate={isActive ? { width: `${landedProgress}%` } : { width: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <motion.div
              className="absolute top-0 h-2 w-0.5 bg-slate-900"
              style={{ left: `${typicalPosition}%` }}
              initial={{ opacity: 0 }}
              animate={isActive ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6 }}
            />
          </div>

          {/* Values */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="text-slate-500 text-xs mb-1">Min</div>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(landedMin)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-xs mb-1">Typical</div>
              <div className="text-lg font-semibold text-slate-700">
                {formatCurrency(landedTypical)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-xs mb-1">Max</div>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(landedMax)}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="p-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">FOB Range</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Factory price before shipping
              </p>
            </div>
          </div>

          {/* Range Bar */}
          <div className="relative mb-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ width: 0 }}
                animate={isActive ? { width: `${fobProgress}%` } : { width: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
            </div>
            <motion.div
              className="absolute top-0 h-2 w-0.5 bg-slate-900"
              style={{ left: `${fobTypicalPosition}%` }}
              initial={{ opacity: 0 }}
              animate={isActive ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.7 }}
            />
          </div>

          {/* Values */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="text-slate-500 text-xs mb-1">Min</div>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(fobMin)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-xs mb-1">Typical</div>
              <div className="text-lg font-semibold text-slate-700">
                {formatCurrency(fobTypical)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-xs mb-1">Max</div>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(fobMax)}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

