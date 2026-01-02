"use client";

import { useMemo, useState } from "react";
import { X, Loader, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TightenInputsModalProps {
  reportId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface TightenData {
  upc: string;
  barcodeFile: File | null;
  countryOfOrigin: string;
}

export default function TightenInputsModal({ reportId, onClose, onSuccess }: TightenInputsModalProps) {
  const router = useRouter();
  const [data, setData] = useState<TightenData>({
    upc: "",
    barcodeFile: null,
    countryOfOrigin: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(0);

  const steps = useMemo(
    () => [
      { title: "UPC & barcode photo", required: false },
      { title: "Origin country", required: true },
    ],
    []
  );

  const canContinue = () => {
    if (step === 1) return data.countryOfOrigin.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canContinue()) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!canContinue()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      if (data.upc.trim()) formData.append("upc", data.upc.trim());
      if (data.countryOfOrigin.trim()) formData.append("originCountry", data.countryOfOrigin.trim());
      if (data.barcodeFile) formData.append("barcodeImage", data.barcodeFile);

      const response = await fetch(`/api/reports/${reportId}/inputs`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to save inputs");
      }

      setSuccess(true);
      router.refresh();
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 800);
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
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tighten inputs</h2>
            <p className="text-xs text-slate-600 mt-1">Complete four quick steps to firm up costs.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
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

          {success && !error && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Saved. Refreshing report…
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-600">
            {steps.map((s, idx) => (
              <span key={s.title} className={`flex-1 h-1 rounded-full ${idx <= step ? "bg-blue-600" : "bg-slate-200"}`} />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">UPC (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 012345678905"
                  value={data.upc}
                  onChange={(e) => setData({ ...data, upc: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Barcode photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setData({ ...data, barcodeFile: e.target.files?.[0] || null })}
                  className="w-full text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Add a clear barcode photo to mark it as uploaded.</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country of origin *</label>
              <select
                value={data.countryOfOrigin}
                onChange={(e) => setData({ ...data, countryOfOrigin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a country</option>
                <option value="China">China</option>
                <option value="Vietnam">Vietnam</option>
                <option value="United States">United States</option>
                <option value="India">India</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {step > 1 && (
            <div className="text-sm text-slate-600">Shipping assumes 1 unit per shipment. Box size/weight auto-fill in Adjust.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          {step > 0 && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              type="button"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canContinue()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canContinue() || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              type="button"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? "Saving" : "Finish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
