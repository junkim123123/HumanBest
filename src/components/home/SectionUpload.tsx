"use client";

import { forwardRef, useRef, useState } from "react";
import { SectionShell } from "./SectionShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface SectionUploadProps {
  isActive: boolean;
}

type DemoId = "magnetic-toy" | "phone-case" | "snack-pouch" | null;

interface DemoData {
  id: DemoId;
  name: string;
  link: string;
  deliveredCost: number;
  deliveredCostLow: number;
  deliveredCostHigh: number;
  factoryPrice: number;
  factoryPriceLow: number;
  factoryPriceHigh: number;
}

const DEMO_DATA: Record<string, DemoData> = {
  "magnetic-toy": {
    id: "magnetic-toy",
    name: "Magnetic toy",
    link: "https://amazon.com/dp/B08XYZ123",
    deliveredCost: 2.44,
    deliveredCostLow: 2.22,
    deliveredCostHigh: 2.66,
    factoryPrice: 0.80,
    factoryPriceLow: 0.75,
    factoryPriceHigh: 0.85,
  },
  "phone-case": {
    id: "phone-case",
    name: "Phone case",
    link: "https://shopify.com/products/phone-case-001",
    deliveredCost: 1.62,
    deliveredCostLow: 1.45,
    deliveredCostHigh: 1.78,
    factoryPrice: 0.38,
    factoryPriceLow: 0.32,
    factoryPriceHigh: 0.45,
  },
  "snack-pouch": {
    id: "snack-pouch",
    name: "Snack pouch",
    link: "https://amazon.com/dp/B09ABC456",
    deliveredCost: 0.92,
    deliveredCostLow: 0.81,
    deliveredCostHigh: 1.05,
    factoryPrice: 0.24,
    factoryPriceLow: 0.20,
    factoryPriceHigh: 0.29,
  },
};

const DEMO_CHIPS = [
  { id: "magnetic-toy" as DemoId, label: "Magnetic toy" },
  { id: "phone-case" as DemoId, label: "Phone case" },
  { id: "snack-pouch" as DemoId, label: "Snack pouch" },
];

function isValidUrl(url: string): boolean {
  if (!url.trim()) return true; // Empty is valid (no error shown)
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const SectionUpload = forwardRef<HTMLElement, SectionUploadProps>(
  ({ isActive }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDemo, setSelectedDemo] = useState<DemoId>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [productLink, setProductLink] = useState("");
    const [linkError, setLinkError] = useState("");

    const handleDemoSelect = (demoId: DemoId) => {
      setSelectedDemo(demoId);
      if (demoId && DEMO_DATA[demoId]) {
        setProductLink(DEMO_DATA[demoId].link);
      }
      setUploadedFile(null);
      setLinkError("");
    };

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
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        setUploadedFile(file);
        setSelectedDemo(null);
        setProductLink("");
        setLinkError("");
      }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploadedFile(file);
        setSelectedDemo(null);
        setProductLink("");
        setLinkError("");
      }
    };

    const handleLinkChange = (value: string) => {
      setProductLink(value);
      if (value.trim() && !isValidUrl(value)) {
        setLinkError("Please enter a valid URL");
      } else {
        setLinkError("");
        if (value.trim()) {
          setSelectedDemo(null);
          setUploadedFile(null);
        }
      }
    };

    const handleClick = () => {
      fileInputRef.current?.click();
    };

    const currentDemo = selectedDemo ? DEMO_DATA[selectedDemo] : null;
    const hasData = selectedDemo || uploadedFile || (productLink.trim() && isValidUrl(productLink));

    return (
      <SectionShell ref={ref} index={0} className="!py-0">
        <div className="slide-inner">
          <div className="w-full max-w-[1120px] mx-auto px-6 pt-[72px] pb-[56px] [@media(max-height:780px)]:pt-12 [@media(max-height:780px)]:pb-10">
            <div className="grid grid-cols-12 gap-12 items-start">
              {/* Left column - 7 columns */}
              <div className="col-span-12 lg:col-span-7">
                {/* Label */}
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase mb-4">
                  UPLOAD
                </p>

                {/* Headline */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight font-bold text-slate-900 mb-4">
                  Know your delivered cost before you reorder.
                </h1>

                {/* Subhead */}
                <p className="text-lg text-slate-600 mb-2 leading-relaxed">
                  Upload a photo or product link. We show a delivered cost range first. Verify only when you are ready to reorder.
                </p>

                {/* Helper line */}
                <p className="text-sm text-slate-500 mb-8">
                  Updates with size and order quantity.
                </p>

                {/* CTA row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                  <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto h-11 px-6 bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
                  >
                    <Link href="/signin?next=%2Fapp%2Fanalyze">Sign in to estimate</Link>
                  </Button>
                  <Link
                    href="/reports/toy-example"
                    className="text-sm text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline text-center sm:text-left"
                  >
                    View sample report
                  </Link>
                </div>

                {/* Trust strip */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="text-xs text-slate-500">Sign in to save your estimate</span>
                  <span className="text-xs text-slate-500">Cost range in minutes</span>
                  <span className="text-xs text-slate-500">Outreach in 12 hours, quotes in about a week</span>
                </div>
              </div>

              {/* Right column - 5 columns */}
              <div className="col-span-12 lg:col-span-5 mt-8 lg:mt-0">
                <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  {/* Card title */}
                  <h3 className="text-base font-semibold text-slate-900 mb-6">
                    Upload your product
                  </h3>

                  {/* Demo section */}
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                      Try a demo
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Pick one to see a real example.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {DEMO_CHIPS.map((chip) => (
                        <button
                          key={chip.id}
                          onClick={() => handleDemoSelect(chip.id)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                            selectedDemo === chip.id
                              ? "bg-electric-blue-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          )}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 1: Dropzone */}
                  <div
                    onClick={!selectedDemo ? handleClick : undefined}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border border-dashed rounded-xl p-6 transition-all duration-200",
                      selectedDemo
                        ? "border-slate-200 bg-slate-50/30 cursor-default"
                        : isDragging
                        ? "border-electric-blue-500 bg-electric-blue-50 cursor-pointer"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/50 cursor-pointer"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    {selectedDemo ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-slate-700">
                            Demo loaded
                          </p>
                          <p className="text-xs text-slate-500">
                            {DEMO_DATA[selectedDemo].name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-700 mb-3">
                          Drop photo here
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                          }}
                        >
                          Choose file
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-6 border-t border-slate-200" />

                  {/* Section 2: Link input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Product link
                    </label>
                    <input
                      type="text"
                      placeholder="Paste an Amazon or Shopify link"
                      value={productLink}
                      onChange={(e) => handleLinkChange(e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue-500 focus:border-transparent",
                        linkError
                          ? "border-red-300 focus:ring-red-500"
                          : "border-slate-300"
                      )}
                    />
                    {linkError && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        {linkError}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-6 border-t border-slate-200" />

                  {/* Section 3: Preview */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-4">
                      Preview
                    </label>

                    {!hasData ? (
                      <p className="text-sm text-slate-500 mb-5">
                        Select a demo or upload to see your cost range.
                      </p>
                    ) : (
                      <>
                        {/* Metric 1: Delivered cost per unit */}
                        <div className="mb-4">
                          <div className="text-xs font-medium text-slate-600 mb-1">
                            Delivered cost per unit
                          </div>
                          <div className="text-2xl font-bold text-slate-900 tabular-nums mb-1">
                            {currentDemo
                              ? formatCurrency(currentDemo.deliveredCost)
                              : formatCurrency(2.44)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {currentDemo
                              ? `Range ${formatCurrency(currentDemo.deliveredCostLow)}–${formatCurrency(currentDemo.deliveredCostHigh)}`
                              : `Range ${formatCurrency(2.22)}–${formatCurrency(2.66)}`}
                          </div>
                        </div>

                        {/* Metric 2: Factory price per unit */}
                        <div className="mb-4">
                          <div className="text-xs font-medium text-slate-600 mb-1">
                            Factory price per unit
                          </div>
                          <div className="text-2xl font-bold text-slate-900 tabular-nums mb-1">
                            {currentDemo
                              ? formatCurrency(currentDemo.factoryPrice)
                              : formatCurrency(0.80)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {currentDemo
                              ? `Range ${formatCurrency(currentDemo.factoryPriceLow)}–${formatCurrency(currentDemo.factoryPriceHigh)}`
                              : `Range ${formatCurrency(0.75)}–${formatCurrency(0.85)}`}
                          </div>
                        </div>

                        {/* Note */}
                        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                          Market range based on category and shipping model.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Bottom badges */}
                  <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="h-5 px-2.5 text-[11px] bg-white text-slate-600 border-slate-200"
                    >
                      Proof when available
                    </Badge>
                    <Badge
                      variant="outline"
                      className="h-5 px-2.5 text-[11px] bg-white text-slate-600 border-slate-200"
                    >
                      Updates every 24 hours
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }
);

SectionUpload.displayName = "SectionUpload";
