"use client";

import { ChevronDown, X } from "lucide-react";
import type { Report } from "@/lib/report/types";
import { useState } from "react";
import TightenInputsModal from "../modals/TightenInputsModal";

interface MissingInputsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  missingInputs: string[];
  report: Report;
}

export default function MissingInputsPanel({ isOpen, onToggle, missingInputs, report }: MissingInputsPanelProps) {
  const [showTighten, setShowTighten] = useState(false);

  if (missingInputs.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 lg:static bg-white border-t border-slate-200 shadow-lg lg:shadow-none rounded-t-lg lg:rounded-lg">
        <button
          onClick={onToggle}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 lg:hidden"
        >
          <span className="font-semibold text-slate-900">Needed to tighten the range</span>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="p-4 lg:p-6 space-y-3 border-t border-slate-200 lg:border-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 hidden lg:block">Needed to tighten the range</h3>
              <button onClick={onToggle} className="lg:hidden text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {missingInputs.includes("weight") && (
                <InputChip 
                  label="Unit weight"
                  onClick={() => setShowTighten(true)}
                />
              )}
              {missingInputs.includes("case_pack") && (
                <InputChip 
                  label="Units per case"
                  onClick={() => setShowTighten(true)}
                />
              )}
            </div>

            <button
              onClick={() => setShowTighten(true)}
              className="w-full px-4 py-2 mt-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Tighten the range
            </button>
          </div>
        )}
      </div>

      {showTighten && (
        <TightenInputsModal 
          reportId={report.id}
          onClose={() => setShowTighten(false)}
          onSuccess={() => setShowTighten(false)}
        />
      )}
    </>
  );
}

function InputChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-amber-500 rounded-full" />
        <span className="text-sm font-medium text-slate-900">{label}</span>
      </div>
      <span className="text-xs text-slate-500 group-hover:text-slate-700">Add</span>
    </button>
  );
}
