// @ts-nocheck
"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageSlotProps {
  slotType: "front" | "barcode" | "label";
  label: string;
  required?: boolean;
  image: File | null;
  preview?: string;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  uploading?: boolean;
  disabled?: boolean;
}

export function ImageSlot({
  slotType,
  label,
  required = false,
  image,
  preview,
  onImageSelect,
  onImageRemove,
  uploading = false,
  disabled = false,
}: ImageSlotProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !disabled && !uploading) {
      onImageSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && !uploading && !required) {
      onImageRemove();
    }
  };

  const handlePaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || uploading) return;

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageTypes = item.types.filter((type) => type.startsWith("image/"));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const file = new File([blob], `pasted-${slotType}.png`, { type: imageTypes[0] });
          onImageSelect(file);
          break;
        }
      }
    } catch (err) {
      console.error("Failed to paste image:", err);
    }
  };

  const hasImage = !!image || !!preview;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {!required && <span className="text-slate-400 ml-1">(optional)</span>}
        </label>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer",
          uploading
            ? "border-blue-300 bg-blue-50 cursor-wait"
            : isDragging
              ? "border-blue-500 bg-blue-50 scale-[1.02]"
              : hasImage
                ? "border-slate-200 bg-white"
                : "border-slate-300 hover:border-slate-400 bg-white",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {hasImage ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative p-3"
            >
              <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                {preview && (
                  <img
                    src={preview}
                    alt={label}
                    className="w-full h-full object-contain"
                  />
                )}
                {image && !preview && (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              {image && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-600 truncate flex-1">
                    {image.name}
                  </p>
                  <div className="flex gap-1 ml-2">
                    {!required && (
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleReplace}
                      className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                      title="Replace"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 flex flex-col items-center justify-center"
            >
              <div
                className={cn(
                  "p-3 rounded-full transition-colors",
                  isDragging ? "bg-blue-100" : "bg-slate-100"
                )}
              >
                {uploading ? (
                  <Upload className="w-6 h-6 text-blue-600 animate-pulse" />
                ) : isDragging ? (
                  <Upload className="w-6 h-6 text-blue-600" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {uploading ? "Uploading..." : "Drag & drop or click"}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Paste
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}











