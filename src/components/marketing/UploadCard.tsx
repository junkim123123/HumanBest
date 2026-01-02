"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileImage } from "lucide-react";
import Link from "next/link";

interface UploadCardProps {
  isActive: boolean;
}

export function UploadCard({ isActive }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="w-full max-w-[560px] mx-auto mt-8"
    >
      <Card className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-slate-600">Drop a product photo</span>
          <span className="text-xs text-slate-500">PNG JPG up to 10MB</span>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileSelect}
          className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-electric-blue-500 bg-electric-blue-50"
              : "border-slate-300 bg-slate-50 hover:border-slate-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={() => {}}
          />
          <FileImage className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-700 mb-1">
            Drag and drop or browse
          </p>
          <p className="text-xs text-slate-500">Select a product image to analyze</p>
        </div>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            asChild
            size="lg"
            className="flex-1 bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
          >
            <Link href="/signin?next=%2Fapp%2Fanalyze">Sign in to estimate</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="flex-1 border-slate-300"
          >
            <Link href="/reports/toy-example">Try demo report</Link>
          </Button>
        </div>

        {/* Microcopy */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-xs text-slate-500">Sign in to run and save your estimate</p>
          <p className="text-xs text-slate-500">Baseline first, verify later</p>
        </div>
      </Card>
    </motion.div>
  );
}














