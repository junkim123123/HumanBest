"use client";

import { Clock, BadgeCheck, Package } from "lucide-react";

export function RoadmapChips() {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Chip 1: 0 to 5 min */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
        <Clock className="w-3 h-3 text-electric-blue-600 flex-shrink-0" />
        <span className="font-medium text-slate-700">0 to 5 min</span>
        <span className="text-slate-600">baseline range and cost stack</span>
      </div>

      {/* Chip 2: About 1 week */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
        <BadgeCheck className="w-3 h-3 text-electric-blue-600 flex-shrink-0" />
        <span className="font-medium text-slate-700">About 1 week</span>
        <span className="text-slate-600">verified supplier quotes</span>
      </div>

      {/* Chip 3: Optional */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs opacity-75">
        <Package className="w-3 h-3 text-slate-500 flex-shrink-0" />
        <span className="font-medium text-slate-500">Optional</span>
        <span className="text-slate-500">order support if you proceed</span>
      </div>
    </div>
  );
}

