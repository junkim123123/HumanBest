// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface VerificationTimelineProps {
  onStartVerification: () => void;
  hasRushTier?: boolean;
}

export function VerificationTimeline({
  onStartVerification,
  hasRushTier = false,
}: VerificationTimelineProps) {
  const deliverables = [
    "At least 3 viable suppliers",
    "Confirmed quote with MOQ and lead time",
    "Execution plan summary",
    "Compliance checklist when available",
    "Sample plan when requested",
  ];

  return (
    <Card className="p-6 rounded-2xl border border-slate-200">
      {/* Timeline */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-electric-blue-600 text-white flex items-center justify-center mx-auto mb-2">
            <span className="text-sm font-semibold">1</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">Step 1</div>
          <div className="text-xs text-slate-600 mt-1">Outreach starts within 12 hours</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-electric-blue-600 text-white flex items-center justify-center mx-auto mb-2">
            <span className="text-sm font-semibold">2</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">Step 2</div>
          <div className="text-xs text-slate-600 mt-1">Updates while we validate quotes</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-2">
            <span className="text-sm font-semibold">3</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">Step 3</div>
          <div className="text-xs text-slate-600 mt-1">Verified quotes in about a week</div>
        </div>
      </div>

      {/* What you get */}
      <div className="mb-6 pb-6 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">What you get</h3>
        <ul className="space-y-2">
          {deliverables.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>


      {/* Rush tier toggle */}
      {hasRushTier && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-slate-900">Timeline:</label>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                Standard: about 1 week
              </button>
              <button className="px-4 py-2 bg-electric-blue-600 text-white rounded-lg text-sm font-medium hover:bg-electric-blue-700">
                Priority outreach available
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <Button
        size="lg"
        onClick={onStartVerification}
        className="w-full h-[52px] bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
      >
        Start verification
      </Button>
    </Card>
  );
}

