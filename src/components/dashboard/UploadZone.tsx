// @ts-nocheck
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, Image as ImageIcon, X, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageSlotData {
  file: File | null;
  preview: string | null;
}

interface UploadZoneProps {
  onFileSelect: (files: { front: File | null; barcode: File | null; label: File | null }) => void;
  onLinkSubmit?: (url: string) => void;
  onSampleClick?: () => void;
  onAnalyzeClick?: () => void;
  uploading?: boolean;
  disabled?: boolean;
  hasValidInput?: boolean;
  // Optional uploads are handled by ImproveAccuracyPanel
  showOptionalUploads?: boolean;
}

export function UploadZone({
  onFileSelect,
  onLinkSubmit,
  onSampleClick,
  onAnalyzeClick,
  uploading = false,
  disabled = false,
  hasValidInput = false,
  showOptionalUploads = false,
}: UploadZoneProps) {
  const [activeTab, setActiveTab] = useState<"image" | "link">("image");
  const [linkUrl, setLinkUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [slots, setSlots] = useState<{
    front: ImageSlotData;
    barcode: ImageSlotData;
    label: ImageSlotData;
  }>({
    front: { file: null, preview: null },
    barcode: { file: null, preview: null },
    label: { file: null, preview: null },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);
  const onFileSelectRef = useRef(onFileSelect);

  // Keep the latest callback reference
  useEffect(() => {
    onFileSelectRef.current = onFileSelect;
  }, [onFileSelect]);

  // Notify parent when slots change (after render)
  useEffect(() => {
    // Skip initial mount to avoid calling onFileSelect during render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    onFileSelectRef.current({
      front: slots.front.file,
      barcode: slots.barcode.file,
      label: slots.label.file,
    });
  }, [slots]);

  const handleMainDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageSelect("front", file);
    }
  };

  const handleImageSelect = useCallback(
    (slotType: "front" | "barcode" | "label", file: File) => {
      const preview = URL.createObjectURL(file);
      setSlots((prev) => ({
        ...prev,
        [slotType]: { file, preview },
      }));
    },
    []
  );

  const handleImageRemove = useCallback(
    (slotType: "front" | "barcode" | "label") => {
      setSlots((prev) => {
        if (prev[slotType].preview) {
          URL.revokeObjectURL(prev[slotType].preview!);
        }
        return {
          ...prev,
          [slotType]: { file: null, preview: null },
        };
      });
    },
    []
  );

  const handlePaste = async () => {
    if (disabled || uploading) return;
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageTypes = item.types.filter((type) => type.startsWith("image/"));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const file = new File([blob], "pasted-image.png", { type: imageTypes[0] });
          handleImageSelect("front", file);
          break;
        }
      }
    } catch (err) {
      console.error("Failed to paste image:", err);
    }
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim() && onLinkSubmit) {
      onLinkSubmit(linkUrl.trim());
    }
  };


  return (
    <div className="w-full space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("image")}
          disabled={uploading || disabled}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "image"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700",
            (uploading || disabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          Image
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("link")}
          disabled={uploading || disabled}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "link"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700",
            (uploading || disabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Link
          </div>
        </button>
      </div>

      {/* Image Tab */}
      {activeTab === "image" && (
        <div className="space-y-4">
          {/* Main large dropzone for front photo */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled && !uploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleMainDrop}
            onClick={() => {
              if (!disabled && !uploading && !slots.front.file) {
                fileInputRef.current?.click();
              }
            }}
            className={cn(
              "relative border-2 border-dashed rounded-xl transition-all duration-300",
              uploading
                ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50/30 backdrop-blur cursor-wait shadow-lg shadow-blue-200/50"
                : isDragging
                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50/50 backdrop-blur scale-[1.02] shadow-xl shadow-blue-200/60"
                  : slots.front.file
                    ? "border-slate-200/80 bg-white/80 backdrop-blur cursor-default shadow-sm"
                    : "border-slate-300/80 hover:border-blue-400 bg-white/60 backdrop-blur cursor-pointer hover:shadow-lg hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-white",
              (disabled || uploading) && "opacity-50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect("front", file);
              }}
              className="hidden"
            />

            {slots.front.file ? (
              <div className="p-3">
                {/* Compact preview row */}
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    {slots.front.preview && (
                      <img
                        src={slots.front.preview}
                        alt="Front photo"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {slots.front.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(slots.front.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      disabled={disabled || uploading}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageRemove("front");
                      }}
                      disabled={disabled || uploading}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[160px]">
                <div
                  className={cn(
                    "p-2.5 rounded-full transition-colors mb-2.5",
                    isDragging ? "bg-blue-100" : "bg-slate-100"
                  )}
                >
                  {uploading ? (
                    <Upload className="w-5 h-5 text-blue-600 animate-pulse" />
                  ) : isDragging ? (
                    <Upload className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {uploading ? "Uploading..." : isDragging ? "Drop image here" : "Upload product photo"}
                </p>
                <p className="text-xs text-slate-500 mb-3">Drag and drop or click to select</p>

                {/* Actions inside empty dropzone */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={disabled || uploading}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Upload image
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePaste();
                    }}
                    disabled={disabled || uploading}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Paste
                  </button>
                  {onSampleClick && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSampleClick();
                      }}
                      disabled={disabled || uploading}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      Use sample
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Tab */}
      {activeTab === "link" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Paste product URL (Amazon, Shopify, Alibaba, etc.)"
              disabled={uploading || disabled}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLinkSubmit();
                }
              }}
            />
            <button
              type="button"
              onClick={handleLinkSubmit}
              disabled={!linkUrl.trim() || uploading || disabled}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Analyze from link
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
