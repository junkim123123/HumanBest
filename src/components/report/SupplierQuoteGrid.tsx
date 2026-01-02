// @ts-nocheck
"use client";

import { SupplierQuoteCard } from "./SupplierQuoteCard";
import type { SupplierQuote } from "@/lib/report/types";

interface SupplierQuoteGridProps {
  quotes: SupplierQuote[];
  productName: string;
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

export function SupplierQuoteGrid({
  quotes,
  productName,
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
}: SupplierQuoteGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quotes.map((quote) => (
        <SupplierQuoteCard
          key={quote.id}
          quote={quote}
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
      ))}
    </div>
  );
}

