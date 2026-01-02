// @ts-nocheck
"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VERIFICATION_SLA_LABEL } from "@/lib/constants/sla";

interface ProjectSuccessBannerProps {
  depositAmount: number;
  onDismiss: () => void;
}

export function ProjectSuccessBanner({ depositAmount, onDismiss }: ProjectSuccessBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  return (
    <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-900">
                Verification started
              </h3>
              <Badge className="bg-blue-100 text-blue-700">Requested</Badge>
            </div>
            <p className="text-sm text-slate-700 mb-2">
              We'll return 3 verified options {VERIFICATION_SLA_LABEL}.
            </p>
            <p className="text-xs text-slate-600">
              Deposit: ${depositAmount} credited toward your first order.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

