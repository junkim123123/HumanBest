// @ts-nocheck
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { Project } from "@/lib/projects/types";
import { SLA_DESCRIPTION, SLA_UPDATE, DEPOSIT_RECEIVED } from "@/lib/copy";

interface ProjectHeaderProps {
  project: Project;
  productName?: string;
}

const statusConfig: Record<Project["status"], { label: string; color: string }> = {
  requested: { label: "Requested", color: "bg-blue-100 text-blue-700" },
  verifying: { label: "Verifying", color: "bg-yellow-100 text-yellow-700" },
  quoted: { label: "Quoted", color: "bg-green-100 text-green-700" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-700" },
  closed: { label: "Closed", color: "bg-slate-100 text-slate-700" },
};

export function ProjectHeader({ project, productName }: ProjectHeaderProps) {
  const statusInfo = statusConfig[project.status];
  const depositPaid = project.depositStatus === "paid" || project.depositStatus === "paid_mock" || project.depositStatus === "credited";
  const depositCredited = project.depositStatus === "credited";

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {productName || `Project ${project.id.slice(-8)}`}
              </h1>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              {SLA_DESCRIPTION}
            </p>
            <p className="text-xs text-slate-500 mb-2">
              {SLA_UPDATE}
            </p>
            {depositPaid && (
              <p className="text-xs text-slate-500">
                {DEPOSIT_RECEIVED}: ${project.depositAmount} {depositCredited ? "credited toward first order" : "paid"}
              </p>
            )}
            {!depositPaid && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs text-yellow-700">Deposit payment required</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2 h-6 text-xs"
                  onClick={() => {
                    // Stub: In real implementation, this would open payment modal
                    alert("Payment integration coming soon");
                  }}
                >
                  Complete deposit
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

