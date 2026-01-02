// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Mail, Loader2 } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface SourcingCopilotHeaderProps {
  report: Report;
}

export function SourcingCopilotHeader({ report }: SourcingCopilotHeaderProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCopyOutreachMessage = async () => {
    setLoading("copy");
    try {
      const response = await fetch(`/api/reports/${report.id}/outreach-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "copy_message" }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate outreach message");
      }

      const data = await response.json();
      await navigator.clipboard.writeText(data.outreach_message);
      
      // TODO: Add toast notification
      alert("Outreach message copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy outreach message:", error);
      alert("Failed to copy outreach message. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadQuestionsChecklist = async () => {
    setLoading("questions");
    try {
      const response = await fetch(`/api/reports/${report.id}/outreach-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "questions_checklist" }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions checklist");
      }

      const data = await response.json();
      const checklist = data.questions_checklist.join("\n");
      
      const blob = new Blob([checklist], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "supplier-questions-checklist.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download questions checklist:", error);
      alert("Failed to download questions checklist. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadSpecSummary = async () => {
    setLoading("spec");
    try {
      const response = await fetch(`/api/reports/${report.id}/outreach-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "spec_summary" }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate spec summary");
      }

      const data = await response.json();
      const summary = data.spec_summary.join("\n");
      
      const blob = new Blob([summary], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "product-spec-summary.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download spec summary:", error);
      alert("Failed to download spec summary. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleRunOutreach = async () => {
    const reportAny = report as any;
    const supplierMatches = reportAny._supplierMatches || [];
    
    if (supplierMatches.length === 0) {
      alert("No supplier leads available for outreach.");
      return;
    }

    if (!confirm("Start outreach with NexSupply? This will create a sourcing job and begin the outreach workflow.")) {
      return;
    }

    setLoading("outreach");
    try {
      const response = await fetch(`/api/reports/${report.id}/sourcing-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_ids: supplierMatches.map((m: any) => m.supplier_id),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create sourcing job");
      }

      const data = await response.json();
      alert(`Sourcing job created! Job ID: ${data.job_id}`);
      // TODO: Navigate to job details or refresh UI
    } catch (error) {
      console.error("Failed to create sourcing job:", error);
      alert(`Failed to start outreach: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="shrink-0 mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-900">Sourcing Copilot</h3>
        <p className="text-xs text-slate-600 mt-1">
          Free tools to help you reach out to suppliers. Paid service runs outreach and confirms quotes in writing.
        </p>
      </div>

      {/* Free Actions */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyOutreachMessage}
          disabled={loading !== null}
          className="h-8 text-xs"
        >
          {loading === "copy" ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <Copy className="w-3 h-3 mr-1.5" />
          )}
          Copy outreach message
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadQuestionsChecklist}
          disabled={loading !== null}
          className="h-8 text-xs"
        >
          {loading === "questions" ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-3 h-3 mr-1.5" />
          )}
          Download questions checklist
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadSpecSummary}
          disabled={loading !== null}
          className="h-8 text-xs"
        >
          {loading === "spec" ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-3 h-3 mr-1.5" />
          )}
          Download spec summary
        </Button>
      </div>

      {/* Paid Action */}
      <Button
        size="sm"
        onClick={handleRunOutreach}
        disabled={loading !== null}
        className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading === "outreach" ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            Creating job...
          </>
        ) : (
          <>
            <Mail className="w-3 h-3 mr-1.5" />
            Run outreach with NexSupply
          </>
        )}
      </Button>
      <p className="text-xs text-slate-600 mt-1.5 text-center">
        We contact suppliers and confirm quotes in writing. Quotes are only shown as confirmed when confirmed_in_writing is true.
      </p>
    </div>
  );
}








