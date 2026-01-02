// @ts-nocheck
"use client";

import { useState } from "react";
import { CheckCircle2, Clock, FileCheck, ChevronDown, ChevronUp } from "lucide-react";
import type { Project, VerifyingMilestone } from "@/lib/projects/types";
import { formatDistanceToNow } from "date-fns";

interface ProjectTimelineProps {
  project: Project;
}

const STEPS = [
  { id: "requested", label: "Requested", icon: Clock },
  { id: "verifying", label: "Verifying", icon: FileCheck },
  { id: "quoted", label: "Quoted", icon: CheckCircle2 },
];

export function ProjectTimeline({ project }: ProjectTimelineProps) {
  const [isMilestonesExpanded, setIsMilestonesExpanded] = useState(true);
  
  const getStepStatus = (stepId: string) => {
    const stepOrder = ["requested", "verifying", "quoted"];
    const currentIndex = stepOrder.indexOf(project.status);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const isVerifying = project.status === "verifying";
  const milestones = project.verifyingMilestones || [];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Timeline</h2>
      
      <div className="relative flex items-center justify-between px-8 mb-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          const isDone = status === "done";
          const isActive = status === "active";

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
              {index < STEPS.length - 1 && (
                <div
                  className={`absolute top-6 left-1/2 w-full h-1 ${
                    isDone ? "bg-green-500" : "bg-slate-200"
                  }`}
                  style={{
                    width: "calc(100% - 48px)",
                    transform: "translateX(calc(50% + 24px))",
                  }}
                />
              )}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 border-2 ${
                  isDone
                    ? "bg-green-500 border-green-500 text-white"
                    : isActive
                    ? "bg-electric-blue-600 border-electric-blue-600 text-white"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span
                className={`text-sm font-medium ${
                  isDone || isActive
                    ? "text-slate-900"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Verifying Milestones Section */}
      {isVerifying && milestones.length > 0 && (
        <div className="pt-6 border-t border-slate-200">
          <button
            onClick={() => setIsMilestonesExpanded(!isMilestonesExpanded)}
            className="flex items-center justify-between w-full mb-4 lg:hidden"
          >
            <h3 className="text-sm font-semibold text-slate-900">Verification Progress</h3>
            {isMilestonesExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
          
          <div className={`${isMilestonesExpanded ? "block" : "hidden"} lg:block`}>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 hidden lg:block">
              Verification Progress
            </h3>
            <div className="space-y-3">
              {milestones.map((milestone) => {
                const isDone = milestone.status === "done";
                const isActive = milestone.status === "active";
                
                return (
                  <div
                    key={milestone.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isActive
                        ? "bg-electric-blue-50 border-electric-blue-200"
                        : isDone
                        ? "bg-green-50 border-green-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : isActive ? (
                        <div className="w-5 h-5 rounded-full border-2 border-electric-blue-600 bg-electric-blue-600 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-electric-blue-900"
                            : isDone
                            ? "text-green-900"
                            : "text-slate-600"
                        }`}
                      >
                        {milestone.label}
                      </p>
                      {milestone.updatedAt && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDistanceToNow(new Date(milestone.updatedAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

