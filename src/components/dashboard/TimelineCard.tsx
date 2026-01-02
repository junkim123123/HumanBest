// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Package, Ship, CheckCircle2 } from "lucide-react";

interface TimelineCardProps {
  sampleDays?: number;
  productionDays?: number;
  shippingDays?: number;
  customsDays?: number;
}

export function TimelineCard({
  sampleDays,
  productionDays,
  shippingDays,
  customsDays,
}: TimelineCardProps) {
  const hasData = sampleDays !== undefined || productionDays !== undefined || shippingDays !== undefined || customsDays !== undefined;
  const totalDays = hasData 
    ? (sampleDays ?? 0) + (productionDays ?? 0) + (shippingDays ?? 0) + (customsDays ?? 0)
    : null;

  const timelineSteps = [
    { label: "Sample", days: sampleDays, icon: Package, color: "bg-blue-100 text-blue-600" },
    { label: "Production", days: productionDays, icon: CheckCircle2, color: "bg-green-100 text-green-600" },
    { label: "Shipping", days: shippingDays, icon: Ship, color: "bg-purple-100 text-purple-600" },
    { label: "Customs", days: customsDays, icon: Clock, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-electric-blue-100 rounded-xl">
          <Calendar className="w-5 h-5 text-electric-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          Sample & First Order Timeline
        </h2>
      </div>

      <div className="space-y-4">
        {timelineSteps.map((step, index) => {
          const Icon = step.icon;
          const daysLabel = step.days !== undefined && step.days > 0 
            ? `${step.days} days`
            : "Quote needed";
          
          return (
            <div key={index} className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${step.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{step.label}</span>
                  <span className="text-sm font-semibold text-slate-700">{daysLabel}</span>
                </div>
              </div>
            </div>
          );
        })}

        {totalDays !== null && totalDays > 0 && (
          <div className="pt-4 border-t border-slate-200 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Total timeline</span>
              <span className="text-lg font-bold text-slate-900">{totalDays} days</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

