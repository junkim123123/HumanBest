"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Sparkles, BadgeCheck, Package } from "lucide-react";

export function RoadmapStrip() {
  return (
    <div className="mt-12 max-w-[1120px] mx-auto px-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 text-center">How it works</h2>
      
      {/* Timeline strip */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-4 text-xs text-slate-600 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-700">0 to 5 minutes</span>
          <span>Baseline range and cost stack</span>
        </div>
        <div className="hidden sm:block w-px h-4 bg-slate-300" />
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-700">About 1 week</span>
          <span>Verified supplier quotes</span>
        </div>
        <div className="hidden sm:block w-px h-4 bg-slate-300" />
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-500">Optional</span>
          <span>Order support if you proceed</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Step 1: Upload */}
        <Card className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-electric-blue-100 flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-electric-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Upload</h3>
          </div>
          <p className="text-xs text-slate-600 leading-tight mb-1">Photo or link</p>
          <p className="text-[10px] text-slate-500">Takes 30 seconds</p>
        </Card>
        
        {/* Step 2: Baseline */}
        <Card className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-electric-blue-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-electric-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Baseline</h3>
          </div>
          <p className="text-xs text-slate-600 leading-tight mb-1">Range in minutes</p>
          <p className="text-[10px] text-slate-500">Cost stack and risk flags</p>
        </Card>
        
        {/* Step 3: Verify */}
        <Card className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-electric-blue-100 flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="w-4 h-4 text-electric-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Verify</h3>
          </div>
            <p className="text-xs text-slate-600 leading-tight mb-1">Quotes in about 1 week</p>
          <p className="text-[10px] text-slate-500">MOQ, lead time, compliance checklist</p>
        </Card>
        
        {/* Step 4: Order */}
        <Card className="p-4 bg-white border border-slate-200 rounded-xl opacity-75">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-slate-600">Order</h3>
              <Badge variant="outline" className="h-4 px-1 text-[9px] bg-slate-50 text-slate-500 border-slate-200">
                Optional
              </Badge>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight mb-1">Optional</p>
          <p className="text-[10px] text-slate-400">Only if you place an order</p>
        </Card>
      </div>
      <p className="text-xs text-slate-500 text-center mt-3">
        AI for speed, humans for confirmed quotes and execution
      </p>
    </div>
  );
}

