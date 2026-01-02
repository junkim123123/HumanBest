// @ts-nocheck
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Report } from "@/lib/report/types";

interface TightenInputsSheetProps {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TightenInputsSheet({
  report,
  open,
  onOpenChange,
}: TightenInputsSheetProps) {
  const [upc, setUpc] = useState(report.upc || "");
  const [materials, setMaterials] = useState(
    report.materialsAndDimensions || ""
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleSubmit = () => {
    // TODO: Implement save logic
    // For now, just close and show toast
    onOpenChange(false);
    // Could add toast notification here: "Saved, will improve next recalculation"
  };

  const validateUPC = (value: string) => {
    if (!value) return true; // Empty is allowed
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.length >= 8 && digitsOnly.length <= 14;
  };

  const isUPCValid = validateUPC(upc);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>Tighten inputs</SheetTitle>
          <SheetDescription>
            Add details to improve confidence and narrow cost estimates
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* UPC or barcode */}
          <div>
            <Label htmlFor="upc" className="text-sm font-semibold text-slate-900">
              UPC or barcode
            </Label>
            <Input
              id="upc"
              value={upc}
              onChange={(e) => setUpc(e.target.value)}
              className="h-10 mt-2"
              placeholder="Enter UPC or barcode"
            />
            <p className="text-xs text-slate-500 mt-1">
              Helps classification
            </p>
            {upc && !isUPCValid && (
              <p className="text-xs text-red-500 mt-1">
                UPC must be 8-14 digits
              </p>
            )}
          </div>

          {/* Packaging photo */}
          <div>
            <Label className="text-sm font-semibold text-slate-900">
              Packaging photo
            </Label>
            <div
              className="h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center mt-2 cursor-pointer hover:border-slate-400 transition-colors"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) setPhotoFile(file);
                };
                input.click();
              }}
            >
              <div className="text-center">
                {photoFile ? (
                  <span className="text-sm text-slate-900 font-medium">
                    {photoFile.name}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">
                    Click to upload photo
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Warnings, materials, certifications
            </p>
          </div>

          {/* Materials and size */}
          <div>
            <Label
              htmlFor="materials"
              className="text-sm font-semibold text-slate-900"
            >
              Materials and size
            </Label>
            <Input
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="h-10 mt-2"
              placeholder="e.g., Polyester, 8x6x4 inches"
            />
            <p className="text-xs text-slate-500 mt-1">
              Most impactful for duty and shipping
            </p>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-electric-blue-600 hover:bg-electric-blue-700"
            disabled={!isUPCValid}
          >
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

