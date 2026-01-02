"use client";

import { AlertCircle, FileText } from "lucide-react";
import { useState } from "react";
import ManualLabelModal from "../modals/ManualLabelModal";

interface OCRRecoveryCardProps {
  reportId: string;
  failureReason?: string | null;
}

export default function OCRRecoveryCard({ reportId, failureReason }: OCRRecoveryCardProps) {
  const [showManualEntry, setShowManualEntry] = useState(false);

  const reasonText = failureReason 
    ? failureReason.toLowerCase().replace(/_/g, " ")
    : "unreadable";

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Label photo not readable</h3>
            <p className="text-sm text-amber-800 mt-1">
              OCR failed ({reasonText}). We will confirm during verification; you can enter label details now if you prefer.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={() => setShowManualEntry(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700"
          >
            <FileText className="w-4 h-4" />
            Enter label details
          </button>
        </div>
      </div>

      {showManualEntry && (
        <ManualLabelModal 
          reportId={reportId}
          onClose={() => setShowManualEntry(false)}
          onSuccess={() => setShowManualEntry(false)}
        />
      )}
    </>
  );
}
