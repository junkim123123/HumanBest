"use client";

import { useRef, useState } from "react";
import { X, Loader } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface EditAssumptionsModalProps {
  report: Report;
  onClose: () => void;
  onSuccess: () => void;
}

interface AssumptionsData {
  boxWeight: string;
  length: string;
  width: string;
  height: string;
}

export default function EditAssumptionsModal({
  report,
  onClose,
  onSuccess,
}: EditAssumptionsModalProps) {
  const reportAny = report as any;
  const inferred = reportAny.baseline?.evidence?.inferredInputs || {};

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [data, setData] = useState<AssumptionsData>({
    boxWeight: inferred.billableWeightKg?.value ? (Number(inferred.billableWeightKg.value) * 1000).toFixed(0) : "",
    length: "",
    width: "",
    height: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const allFilled = true;

  const handleSubmit = async (payload?: AssumptionsData, silent?: boolean) => {
    const body = payload || data;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/reports/${report.id}/update-assumptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitsPerCase: 1,
          boxWeightGrams: body.boxWeight ? parseFloat(body.boxWeight) : null,
          boxLengthCm: body.length ? parseFloat(body.length) : null,
          boxWidthCm: body.width ? parseFloat(body.width) : null,
          boxHeightCm: body.height ? parseFloat(body.height) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update assumptions");
      }

      setSuccess(true);

      // Close modal after delay so user can see the success message
      if (!silent) {
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const triggerSave = (payloadOverride?: Partial<AssumptionsData>, immediate = false) => {
    const payload = { ...data, ...(payloadOverride || {}) };
    if (immediate) {
      handleSubmit(payload, true);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSubmit(payload, true), 450);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Edit assumptions</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {success && !loading && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm font-semibold text-emerald-900">
                Assumptions updated ✓
              </p>
              <p className="text-sm text-emerald-800 mt-1">
                Your estimates have been recalculated
              </p>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            This estimate assumes <span className="font-semibold">1 unit shipment</span>. Shipping defaults auto-fill missing box size and weight using category templates.
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Box weight (g) <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="number"
                placeholder="Auto"
                value={data.boxWeight}
                onChange={(e) => setData({ ...data, boxWeight: e.target.value })}
                onBlur={() => triggerSave()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") triggerSave(undefined, true);
                }}
                disabled={loading}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 mt-1">Defaults to category template if blank.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "length", label: "Length (cm)" },
                { key: "width", label: "Width (cm)" },
                { key: "height", label: "Height (cm)" },
              ].map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-700">{field.label}</label>
                  <input
                    type="number"
                    placeholder="Auto"
                    value={(data as any)[field.key]}
                    onChange={(e) => setData({ ...data, [field.key]: e.target.value } as AssumptionsData)}
                    onBlur={() => triggerSave()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") triggerSave(undefined, true);
                    }}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">Leave blank to auto-fill using category defaults with uncertainty ranges.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? "Updating..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
