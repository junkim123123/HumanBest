// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Report } from "@/lib/report/types";
import type { AssumptionUpdate } from "@/lib/report/recalc";

interface AssumptionEditModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: AssumptionUpdate) => void;
}

export function AssumptionEditModal({
  report,
  isOpen,
  onClose,
  onSave,
}: AssumptionEditModalProps) {
  const [formData, setFormData] = useState<AssumptionUpdate>({
    incoterms: "",
    shipMode: "",
    unitWeightG: undefined,
    unitVolumeCbm: undefined,
    packagingType: "",
  });

  // Initialize form data from report assumptions
  useEffect(() => {
    if (isOpen && report) {
      const assumptions = report.baseline.evidence.assumptions;
      
      // Parse incoterms
      const incotermsMatch = assumptions.incoterms.match(/^([A-Z]+)/);
      
      // Parse weight (convert kg to grams)
      const weightMatch = assumptions.weight.match(/([\d.]+)\s*kg/i);
      const weightG = weightMatch ? parseFloat(weightMatch[1]) * 1000 : undefined;
      
      // Parse volume
      const volumeMatch = assumptions.volume.match(/([\d.]+)\s*m³/i);
      const volumeCbm = volumeMatch ? parseFloat(volumeMatch[1]) : undefined;

      setFormData({
        incoterms: incotermsMatch ? incotermsMatch[1] : "",
        shipMode: assumptions.shippingMode,
        unitWeightG: weightG,
        unitVolumeCbm: volumeCbm,
        packagingType: assumptions.packaging,
      });
    }
  }, [isOpen, report]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Edit Assumptions</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Incoterms */}
          <div>
            <Label htmlFor="incoterms">Incoterms</Label>
            <select
              id="incoterms"
              value={formData.incoterms || ""}
              onChange={(e) =>
                setFormData({ ...formData, incoterms: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue-500"
            >
              <option value="">Select...</option>
              <option value="FOB">FOB (Free On Board)</option>
              <option value="CIF">CIF (Cost, Insurance, Freight)</option>
              <option value="EXW">EXW (Ex Works)</option>
              <option value="DDP">DDP (Delivered Duty Paid)</option>
            </select>
          </div>

          {/* Shipping Mode */}
          <div>
            <Label htmlFor="shipMode">Shipping Mode</Label>
            <select
              id="shipMode"
              value={formData.shipMode || ""}
              onChange={(e) =>
                setFormData({ ...formData, shipMode: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue-500"
            >
              <option value="">Select...</option>
              <option value="Air Express (DHL/FedEx)">Air Express (DHL/FedEx)</option>
              <option value="Air Freight">Air Freight</option>
              <option value="Ocean Freight">Ocean Freight</option>
              <option value="Express (EMS)">Express (EMS)</option>
            </select>
          </div>

          {/* Unit Weight */}
          <div>
            <Label htmlFor="unitWeightG">Unit Weight (g)</Label>
            <Input
              id="unitWeightG"
              type="number"
              step="0.1"
              value={formData.unitWeightG ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  unitWeightG: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="e.g., 150"
            />
          </div>

          {/* Unit Volume */}
          <div>
            <Label htmlFor="unitVolumeCbm">Unit Volume (m³)</Label>
            <Input
              id="unitVolumeCbm"
              type="number"
              step="0.0001"
              value={formData.unitVolumeCbm ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  unitVolumeCbm: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="e.g., 0.0015"
            />
          </div>

          {/* Packaging Type */}
          <div>
            <Label htmlFor="packagingType">Packaging Type</Label>
            <Input
              id="packagingType"
              type="text"
              value={formData.packagingType || ""}
              onChange={(e) =>
                setFormData({ ...formData, packagingType: e.target.value })
              }
              placeholder="e.g., Blister pack, 12 units per inner"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-electric-blue-600 hover:bg-electric-blue-700">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

