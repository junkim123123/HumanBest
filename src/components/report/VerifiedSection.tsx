// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SupplierQuoteSummary } from "./SupplierQuoteSummary";
import { SupplierQuoteGrid } from "./SupplierQuoteGrid";
import type { SupplierQuote } from "@/lib/report/types";

interface VerifiedSectionProps {
  autoOpen?: boolean;
  highlight?: boolean;
  quotes?: SupplierQuote[];
  productName?: string;
  reportId?: string;
  category?: string;
  shippingMode?: string;
  incoterms?: string;
  targetMoq?: number;
  materialsAndDimensions?: string | null;
  packagingAndPrinting?: string | null;
  certificationsNeeded?: string[] | null;
  upc?: string | null;
  hasBackLabelPhoto?: boolean;
}

export function VerifiedSection({
  autoOpen = false,
  highlight = false,
  quotes = [],
  productName = "Product",
  reportId,
  category,
  shippingMode,
  incoterms,
  targetMoq,
  materialsAndDimensions,
  packagingAndPrinting,
  certificationsNeeded,
  upc,
  hasBackLabelPhoto,
}: VerifiedSectionProps) {
  const [expanded, setExpanded] = useState(autoOpen);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoOpen) {
      setExpanded(true);
      // Show skeleton for 400ms if we have quotes
      if (quotes.length > 0) {
        setShowSkeleton(true);
        const timer = setTimeout(() => setShowSkeleton(false), 400);
        return () => clearTimeout(timer);
      }
    }
  }, [autoOpen, quotes.length]);

  useEffect(() => {
    if (highlight && sectionRef.current) {
      sectionRef.current.classList.add(
        "ring-4",
        "ring-electric-blue-400",
        "bg-electric-blue-50/50",
        "transition-all",
        "duration-300"
      );
      
      const timer = setTimeout(() => {
        if (sectionRef.current) {
          sectionRef.current.classList.remove(
            "ring-4",
            "ring-electric-blue-400",
            "bg-electric-blue-50/50"
          );
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [highlight]);

  if (quotes.length === 0) {
    return null;
  }

  return (
    <Card
      id="section-verified"
      ref={sectionRef}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Verified Quotes</h2>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="pt-4 border-t border-slate-200">
          {showSkeleton ? (
            <div className="space-y-6">
              <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-[320px] bg-slate-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              <SupplierQuoteSummary supplierCount={quotes.length} />
              <SupplierQuoteGrid
                quotes={quotes}
                productName={productName}
                reportId={reportId}
                category={category}
                shippingMode={shippingMode}
                incoterms={incoterms}
                targetMoq={targetMoq}
                materialsAndDimensions={materialsAndDimensions}
                packagingAndPrinting={packagingAndPrinting}
                certificationsNeeded={certificationsNeeded}
                upc={upc}
                hasBackLabelPhoto={hasBackLabelPhoto}
              />
            </>
          )}
        </div>
      )}
    </Card>
  );
}

