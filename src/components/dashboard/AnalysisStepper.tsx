"use client";

import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type StepStatus = "done" | "working" | "skipped" | "pending";

interface Step {
  id: string;
  label: string;
  timeBadge?: string;
  status: StepStatus;
}

interface AnalysisStepperProps {
  steps: Step[];
}

export function AnalysisStepper({ steps }: AnalysisStepperProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-4">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {step.status === "done" ? (
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-400/20 blur-sm" />
                <CheckCircle2 className="w-5 h-5 text-green-600 relative" />
              </div>
            ) : step.status === "working" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-sm" />
                  <Loader2 className="w-5 h-5 text-blue-600 relative" />
                </div>
              </motion.div>
            ) : step.status === "skipped" ? (
              <Circle className="w-5 h-5 text-slate-300" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300" />
            )}
          </div>

          {/* Step Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={cn(
                  "text-sm font-semibold",
                  step.status === "done"
                    ? "text-slate-900"
                    : step.status === "working"
                      ? "text-blue-600"
                      : "text-slate-500"
                )}
              >
                {step.label}
              </p>
              {step.timeBadge && (
                <span className="px-2 py-0.5 text-xs font-semibold text-slate-600 bg-slate-100/80 backdrop-blur rounded-full shadow-sm">
                  {step.timeBadge}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

