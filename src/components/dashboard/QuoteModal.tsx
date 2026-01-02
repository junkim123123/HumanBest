// @ts-nocheck
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, DollarSign, Package, Globe, Calendar, Settings } from "lucide-react";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  supplierName?: string;
  onSubmit?: (data: QuoteRequestData) => void;
}

export interface QuoteRequestData {
  quantity: number;
  targetUnitPrice: number;
  country: string;
  targetLeadTime: number;
  needsCustomization: boolean;
  notes?: string;
}

export function QuoteModal({
  isOpen,
  onClose,
  productName,
  supplierName,
  onSubmit,
}: QuoteModalProps) {
  const [formData, setFormData] = useState<QuoteRequestData>({
    quantity: 100,
    targetUnitPrice: 0,
    country: "United States",
    targetLeadTime: 30,
    needsCustomization: false,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    // Close modal after submission
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Request Quote</h2>
                {productName && (
                  <p className="text-sm text-slate-600 mt-1">{productName}</p>
                )}
                {supplierName && (
                  <p className="text-xs text-slate-500 mt-1">Supplier: {supplierName}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Quantity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Package className="w-4 h-4 text-slate-400" />
                Quantity
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                placeholder="100"
              />
            </div>

            {/* Target Unit Price */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                Target unit price (USD)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.targetUnitPrice || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetUnitPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Country */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Globe className="w-4 h-4 text-slate-400" />
                Destination country
              </label>
              <select
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-electric-blue-500 focus:border-electric-blue-500"
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Mexico">Mexico</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Target Lead Time */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Target lead time (days)
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.targetLeadTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetLeadTime: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                placeholder="30"
              />
            </div>

            {/* Customization */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Settings className="w-4 h-4 text-slate-400" />
                Customization needed
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="customization"
                    checked={!formData.needsCustomization}
                    onChange={() => setFormData({ ...formData, needsCustomization: false })}
                    className="w-4 h-4 text-electric-blue-600"
                  />
                  <span className="text-sm text-slate-700">Standard product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="customization"
                    checked={formData.needsCustomization}
                    onChange={() => setFormData({ ...formData, needsCustomization: true })}
                    className="w-4 h-4 text-electric-blue-600"
                  />
                  <span className="text-sm text-slate-700">Custom design/specs</span>
                </label>
              </div>
            </div>

            {/* Notes (optional) */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Additional notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                placeholder="Any specific requirements or questions..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-electric-blue-600 text-white rounded-xl hover:bg-electric-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Request Quote (24h)
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

