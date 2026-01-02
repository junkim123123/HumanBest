// @ts-nocheck
"use client";

import { motion } from "framer-motion";

interface StackBarProps {
  fob: number;
  freight: number;
  duty: number;
  fees: number;
  total: number;
}

export function StackBar({ fob, freight, duty, fees, total }: StackBarProps) {
  const totalForStack = fob + freight + duty + fees;
  const fobPercent = (fob / totalForStack) * 100;
  const freightPercent = (freight / totalForStack) * 100;
  const dutyPercent = (duty / totalForStack) * 100;
  const feesPercent = (fees / totalForStack) * 100;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-electric-blue-600"></div>
          <span className="text-slate-600">FOB: ${fob.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-slate-600">Freight: ${freight.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-slate-600">Duty: ${duty.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-purple-500"></div>
          <span className="text-slate-600">Fees: ${fees.toFixed(2)}</span>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden flex">
        <motion.div
          className="bg-electric-blue-600 flex items-center justify-center text-white text-xs font-semibold"
          initial={{ width: `${Math.max(fobPercent, 5)}%` }}
          animate={{ width: `${Math.max(fobPercent, 5)}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {fobPercent > 8 && <span>FOB</span>}
        </motion.div>
        <motion.div
          className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
          initial={{ width: `${Math.max(freightPercent, 5)}%` }}
          animate={{ width: `${Math.max(freightPercent, 5)}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {freightPercent > 8 && <span>Freight</span>}
        </motion.div>
        <motion.div
          className="bg-orange-500 flex items-center justify-center text-white text-xs font-semibold"
          initial={{ width: `${Math.max(dutyPercent, 5)}%` }}
          animate={{ width: `${Math.max(dutyPercent, 5)}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {dutyPercent > 8 && <span>Duty</span>}
        </motion.div>
        <motion.div
          className="bg-purple-500 flex items-center justify-center text-white text-xs font-semibold"
          initial={{ width: `${Math.max(feesPercent, 5)}%` }}
          animate={{ width: `${Math.max(feesPercent, 5)}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {feesPercent > 8 && <span>Fees</span>}
        </motion.div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-end pt-2">
        <div className="text-right">
          <div className="text-sm text-slate-600 mb-1">Total Landed Cost</div>
          <div className="text-3xl font-bold text-electric-blue-600">
            ${total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}


