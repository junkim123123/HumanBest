// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { VERIFICATION_UPDATE_LABEL, VERIFICATION_SLA_LABEL, VERIFICATION_UPDATE_CADENCE_HOURS } from "@/lib/constants/sla";

export function ProjectSLA() {
  return (
    <Card className="p-6 bg-white border border-slate-200">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-electric-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            {VERIFICATION_UPDATE_LABEL}
          </h2>
          <p className="text-sm text-slate-600 mb-2">
            Final delivery {VERIFICATION_SLA_LABEL}
          </p>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
            We post progress at least once every {VERIFICATION_UPDATE_CADENCE_HOURS} hours
          </p>
        </div>
      </div>
    </Card>
  );
}

