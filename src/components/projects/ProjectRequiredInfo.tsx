// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Upload, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Project } from "@/lib/projects/types";
import type { ProjectRequiredInfo as ProjectRequiredInfoType } from "@/lib/types/project";
import { toast } from "sonner";

interface ProjectRequiredInfoProps {
  project: Project;
  onUpdate: (updates: Partial<ProjectRequiredInfoType>, activityMessage?: string) => Promise<void>;
  focusKey?: "label" | "upc" | "materials" | null;
}

export function ProjectRequiredInfo({ project, onUpdate, focusKey }: ProjectRequiredInfoProps) {
  const [labelPhoto, setLabelPhoto] = useState<File | null>(null);
  const [upc, setUpc] = useState(project.requiredInfo?.upc || "");
  const [materials, setMaterials] = useState(project.requiredInfo?.materialsAndDimensions || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<"label" | "upc" | "materials" | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const upcRef = useRef<HTMLDivElement>(null);
  const materialsRef = useRef<HTMLDivElement>(null);

  // Sync state when project updates
  useEffect(() => {
    setUpc(project.requiredInfo?.upc || "");
    setMaterials(project.requiredInfo?.materialsAndDimensions || "");
  }, [project.requiredInfo]);

  // Handle focus and highlight
  useEffect(() => {
    if (!focusKey) return;

    const targetRef = 
      focusKey === "label" ? labelRef :
      focusKey === "upc" ? upcRef :
      focusKey === "materials" ? materialsRef :
      null;

    if (targetRef?.current) {
      // Scroll into view
      setTimeout(() => {
        targetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);

      // Highlight
      setHighlightedKey(focusKey);
      const timer = setTimeout(() => {
        setHighlightedKey(null);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [focusKey]);

  const hasLabelPhoto = project.requiredInfo?.labelPhotoUrl || labelPhoto;
  const hasUpc = !!project.requiredInfo?.upc || !!upc;
  const hasMaterials = !!project.requiredInfo?.materialsAndDimensions || !!materials;

  const handleLabelPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLabelPhoto(file);
    setIsUploading(true);

    try {
      // Simulate file upload - in real implementation, upload to storage and get URL
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const placeholderUrl = `placeholder_${Date.now()}_${file.name}`;

      await onUpdate({ labelPhotoUrl: placeholderUrl }, "Label photo uploaded");
      toast.success("Label photo uploaded");
    } catch (error) {
      toast.error("Failed to upload photo");
      setLabelPhoto(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpcChange = async (value: string) => {
    setUpc(value);
    if (value) {
      setIsSaving(true);
      try {
        await onUpdate({ upc: value }, "UPC provided");
        toast.success("UPC saved");
      } catch (error) {
        toast.error("Failed to save UPC");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleMaterialsChange = async (value: string) => {
    setMaterials(value);
    if (value) {
      setIsSaving(true);
      try {
        await onUpdate({ materialsAndDimensions: value }, "Materials and dimensions provided");
        toast.success("Materials saved");
      } catch (error) {
        toast.error("Failed to save materials");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleUploadClick = () => {
    document.getElementById("label-photo-input")?.click();
  };

  return (
    <Card className="p-6 bg-white border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Required Information
      </h2>

      <div className="space-y-6">
        {/* Label Photo */}
        <div
          id="required-label"
          ref={labelRef}
          className={`transition-all duration-300 rounded-lg p-2 -m-2 ${
            highlightedKey === "label"
              ? "ring-4 ring-electric-blue-400 bg-electric-blue-50/50"
              : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="label-photo" className="text-sm font-medium text-slate-900">
              Back label photo
            </Label>
            {hasLabelPhoto && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
          </div>
          <input
            id="label-photo-input"
            type="file"
            accept="image/*"
            onChange={handleLabelPhotoChange}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={hasLabelPhoto ? "outline" : "default"}
              onClick={handleUploadClick}
              disabled={isUploading || !!hasLabelPhoto}
              className={`flex items-center gap-2 ${!hasLabelPhoto ? "bg-electric-blue-600 hover:bg-electric-blue-700" : ""}`}
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : hasLabelPhoto ? "Uploaded" : "Upload label photo"}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Why we need this"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">
                    Helps us verify ingredients, compliance labels, and product specifications for accurate quotes.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* UPC/Barcode */}
        <div
          id="required-upc"
          ref={upcRef}
          className={`transition-all duration-300 rounded-lg p-2 -m-2 ${
            highlightedKey === "upc"
              ? "ring-4 ring-electric-blue-400 bg-electric-blue-50/50"
              : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="upc" className="text-sm font-medium text-slate-900">
              Barcode/UPC
            </Label>
            {hasUpc && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Input
              id="upc"
              type="text"
              value={upc}
              onChange={(e) => handleUpcChange(e.target.value)}
              placeholder="Enter UPC, EAN, or barcode"
              className="flex-1"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Why we need this"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">
                    Enables product matching and cache lookup for faster, more accurate estimates.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Materials and Dimensions */}
        <div
          id="required-materials"
          ref={materialsRef}
          className={`transition-all duration-300 rounded-lg p-2 -m-2 ${
            highlightedKey === "materials"
              ? "ring-4 ring-electric-blue-400 bg-electric-blue-50/50"
              : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="materials" className="text-sm font-medium text-slate-900">
              Material and dimensions
            </Label>
            {hasMaterials && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Input
              id="materials"
              type="text"
              value={materials}
              onChange={(e) => handleMaterialsChange(e.target.value)}
              placeholder="e.g., Plastic, 10cm x 5cm x 3cm"
              className="flex-1"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Why we need this"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">
                    Used to calculate accurate shipping costs, packaging requirements, and material-specific pricing.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
}

