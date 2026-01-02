"use client";

import { useState } from "react";
import { X, Loader } from "lucide-react";

interface ManualLabelModalProps {
  reportId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface LabelData {
  netWeight: string;
  unitsPerCase: string;
  countryOfOrigin: string;
  manufacturerOrDistributedBy: string;
  allergens: string;
  ingredientsShort: string;
}

export default function ManualLabelModal({ reportId, onClose, onSuccess }: ManualLabelModalProps) {
  const [data, setData] = useState<LabelData>({
    netWeight: "",
    unitsPerCase: "",
    countryOfOrigin: "",
    manufacturerOrDistributedBy: "",
    allergens: "",
    ingredientsShort: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allFilled = Object.values(data).every(v => v.trim().length > 0);

  const handleSubmit = async () => {
    if (!allFilled) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/reports/${reportId}/manual-label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          netWeight: parseFloat(data.netWeight),
          unitsPerCase: parseInt(data.unitsPerCase),
          countryOfOrigin: data.countryOfOrigin,
          manufacturerOrDistributedBy: data.manufacturerOrDistributedBy,
          allergens: data.allergens,
          ingredientsShort: data.ingredientsShort,
        }),
      });

      if (!response.ok) throw new Error("Failed to save label details");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Label details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Net weight (g) *
            </label>
            <input
              type="number"
              placeholder="e.g. 250"
              value={data.netWeight}
              onChange={(e) => setData({ ...data, netWeight: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Units per case *
            </label>
            <input
              type="number"
              placeholder="e.g. 12"
              value={data.unitsPerCase}
              onChange={(e) => setData({ ...data, unitsPerCase: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Country of origin *
            </label>
            <input
              type="text"
              placeholder="e.g. China"
              value={data.countryOfOrigin}
              onChange={(e) => setData({ ...data, countryOfOrigin: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Manufacturer or distributed by *
            </label>
            <input
              type="text"
              placeholder="Company name"
              value={data.manufacturerOrDistributedBy}
              onChange={(e) => setData({ ...data, manufacturerOrDistributedBy: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Allergens *
            </label>
            <input
              type="text"
              placeholder="e.g. Contains peanuts"
              value={data.allergens}
              onChange={(e) => setData({ ...data, allergens: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ingredients (short) *
            </label>
            <textarea
              placeholder="Main ingredients..."
              value={data.ingredientsShort}
              onChange={(e) => setData({ ...data, ingredientsShort: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allFilled || loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? "Saving..." : "Save details"}
          </button>
        </div>
      </div>
    </div>
  );
}
