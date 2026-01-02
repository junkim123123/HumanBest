// @ts-nocheck
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportSlideTitle } from "./ReportSlideTitle";
import { PlaceOrderModal } from "./PlaceOrderModal";
import type { Report } from "@/lib/report/types";

interface VerifiedQuote {
  id: string;
  label: string;
  badges: string[];
  region: string;
  sla: string;
  fobMin: number;
  fobMax: number;
  moq: number;
  leadTimeDays: number;
  sampleCost: number;
  paymentTerms: string;
  packaging: string;
  shippingStatus: string;
  complianceNote: string;
  riskNote: string;
}

interface VerifiedQuotesSlideProps {
  report: Report;
  onStartVerification?: () => void;
}

export function VerifiedQuotesSlide({ report, onStartVerification }: VerifiedQuotesSlideProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<VerifiedQuote | null>(null);
  const [showPlaceOrderModal, setShowPlaceOrderModal] = useState(false);

  const isVerified = report.verification.status === "quoted" || report.verification.status === "done";
  const verifiedQuotes = report.verifiedQuotes?.suppliers || [];

  // Mock verified quotes data
  const mockQuotes: VerifiedQuote[] = [
    {
      id: "supplier-a",
      label: "Supplier A",
      badges: ["Best price", "Verified"],
      region: "Guangdong, China",
      sla: "24h response",
      fobMin: report.baseline.costRange.standard.unitPrice * 0.95,
      fobMax: report.baseline.costRange.conservative.unitPrice * 0.95,
      moq: report.baseline.riskFlags.supply.moqRange.typical,
      leadTimeDays: report.baseline.riskFlags.supply.leadTimeRange.typical,
      sampleCost: 50,
      paymentTerms: "30% deposit, 70% before shipment",
      packaging: "Standard export carton",
      shippingStatus: "Quote ready",
      complianceNote: "All certifications confirmed",
      riskNote: "Low risk profile",
    },
    {
      id: "supplier-b",
      label: "Supplier B",
      badges: ["Fastest delivery", "Verified"],
      region: "Zhejiang, China",
      sla: "24h response",
      fobMin: report.baseline.costRange.standard.unitPrice * 1.05,
      fobMax: report.baseline.costRange.conservative.unitPrice * 1.05,
      moq: report.baseline.riskFlags.supply.moqRange.typical * 0.8,
      leadTimeDays: report.baseline.riskFlags.supply.leadTimeRange.typical - 5,
      sampleCost: 75,
      paymentTerms: "50% deposit, 50% before shipment",
      packaging: "Standard export carton",
      shippingStatus: "Quote ready",
      complianceNote: "Certifications pending review",
      riskNote: "Medium risk - new supplier",
    },
    {
      id: "supplier-c",
      label: "Supplier C",
      badges: ["Compliance ready", "Verified"],
      region: "Jiangsu, China",
      sla: "24h response",
      fobMin: report.baseline.costRange.standard.unitPrice,
      fobMax: report.baseline.costRange.conservative.unitPrice,
      moq: report.baseline.riskFlags.supply.moqRange.typical * 1.2,
      leadTimeDays: report.baseline.riskFlags.supply.leadTimeRange.typical + 3,
      sampleCost: 60,
      paymentTerms: "40% deposit, 60% before shipment",
      packaging: "Custom packaging available",
      shippingStatus: "Quote ready",
      complianceNote: "Full compliance documentation",
      riskNote: "Low risk - established supplier",
    },
  ];

  const quotes = isVerified && verifiedQuotes.length > 0
    ? verifiedQuotes.slice(0, 3).map((q, i) => ({
        id: q.id,
        label: q.supplierName,
        badges: i === 0 ? ["Best price", "Verified"] : i === 1 ? ["Fastest delivery", "Verified"] : ["Compliance ready", "Verified"],
        region: q.country,
        sla: "24h response",
        fobMin: q.quoteMin,
        fobMax: q.quoteMax,
        moq: q.moq,
        leadTimeDays: q.leadTimeDays,
        sampleCost: 50,
        paymentTerms: "30% deposit, 70% before shipment",
        packaging: "Standard export carton",
        shippingStatus: "Quote ready",
        complianceNote: q.certifications.length > 0 ? "All certifications confirmed" : "Certifications pending",
        riskNote: q.riskFlags.length > 0 ? `Risk: ${q.riskFlags.join(", ")}` : "Low risk profile",
      }))
    : mockQuotes;

  const handlePlaceOrder = (quote: VerifiedQuote) => {
    setSelectedSupplier(quote);
    setShowPlaceOrderModal(true);
  };

  return (
    <>
      {/* Trust lines */}
      <div className="flex flex-wrap justify-center gap-4 mb-8 text-xs text-slate-500">
        <span>Updated within 24 hours</span>
        <span>Deposit credited on order</span>
      </div>

      {/* Cards grid - Mobile gap 12, Desktop gap 16 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        {quotes.map((quote) => (
          <Card
            key={quote.id}
            className="p-5 rounded-2xl border border-slate-200 min-h-[380px] flex flex-col"
          >
            {/* Top row: Badges and SLA */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                {!isVerified ? (
                  <Badge variant="outline" className="bg-slate-100 text-slate-600">
                    Pending verification
                  </Badge>
                ) : (
                  quote.badges.slice(0, 2).map((badge, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className={
                        badge === "Best price"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : badge === "Fastest delivery"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }
                    >
                      {badge}
                    </Badge>
                  ))
                )}
              </div>
              <span className="text-xs text-slate-500">{quote.sla}</span>
            </div>

            {/* Title row */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{quote.label}</h3>
              <p className="text-sm text-slate-600">{quote.region}</p>
            </div>

            {/* Core metrics row */}
            <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-500 mb-1">FOB per unit</div>
                <div className="text-lg font-bold text-slate-900">
                  {!isVerified ? (
                    <span className="blur-sm">$X.XX</span>
                  ) : (
                    `$${quote.fobMin.toFixed(2)}`
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">MOQ</div>
                <div className="text-lg font-bold text-slate-900">
                  {!isVerified ? (
                    <span className="blur-sm">X,XXX</span>
                  ) : (
                    quote.moq.toLocaleString()
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Lead time</div>
                <div className="text-lg font-bold text-slate-900">
                  {!isVerified ? (
                    <span className="blur-sm">XX</span>
                  ) : (
                    `${quote.leadTimeDays} days`
                  )}
                </div>
              </div>
            </div>

            {/* Details list - exactly 6 rows */}
            <div className="space-y-2 mb-6 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sample cost</span>
                <span className="font-medium text-slate-900">
                  {!isVerified ? <span className="blur-sm">$XX</span> : `$${quote.sampleCost}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Payment terms</span>
                <span className="font-medium text-slate-900">
                  {!isVerified ? <span className="blur-sm">XX% deposit</span> : quote.paymentTerms.split(",")[0]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Packaging</span>
                <span className="font-medium text-slate-900">
                  {!isVerified ? <span className="blur-sm">Standard</span> : quote.packaging}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Shipping quote</span>
                <span className="font-medium text-slate-900">
                  {!isVerified ? <span className="blur-sm">Pending</span> : quote.shippingStatus}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Compliance note</span>
                <span className="font-medium text-slate-900 text-right max-w-[60%]">
                  {!isVerified ? <span className="blur-sm">Pending</span> : quote.complianceNote}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Risk note</span>
                <span className="font-medium text-slate-900 text-right max-w-[60%]">
                  {!isVerified ? <span className="blur-sm">Pending</span> : quote.riskNote}
                </span>
              </div>
            </div>

            {/* Bottom CTAs */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              {!isVerified ? (
                <>
                  <Button
                    onClick={onStartVerification}
                    className="w-full bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
                  >
                    Start verification
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    Verify to unlock 3 supplier quotes.
                  </p>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handlePlaceOrder(quote)}
                    className="w-full bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
                  >
                    Place order with NexSupply
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Request sample plan
                  </Button>
                </>
              )}
            </div>

            {/* Footer microcopy */}
            {isVerified && (
              <div className="mt-3 space-y-1 text-xs text-slate-500 text-center">
                <p>Deposit is credited on order.</p>
                <p>Execution fee applies only if you place an order.</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {selectedSupplier && (
        <PlaceOrderModal
          isOpen={showPlaceOrderModal}
          onClose={() => {
            setShowPlaceOrderModal(false);
            setSelectedSupplier(null);
          }}
          supplier={{
            id: selectedSupplier.id,
            label: selectedSupplier.label,
            fobMin: selectedSupplier.fobMin,
            fobMax: selectedSupplier.fobMax,
            moq: selectedSupplier.moq,
            leadTimeDays: selectedSupplier.leadTimeDays,
          }}
          reportId={report.id}
        />
      )}
    </>
  );
}
