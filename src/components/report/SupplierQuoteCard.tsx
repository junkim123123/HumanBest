// @ts-nocheck
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle2, XCircle, MessageCircle, Copy, Mail } from "lucide-react";
import type { SupplierQuote } from "@/lib/report/types";
import { buildWhatsAppMessage, openWhatsAppDraft, normalizePhone } from "@/lib/messaging/whatsapp";
import { buildEmailSubject, buildEmailBody, openEmailDraft } from "@/lib/messaging/email";
import { buildQuoteRequestMessage } from "@/lib/messaging/templates";
import { DEFAULT_REQUESTER_EMAIL, DEFAULT_REQUESTER_WHATSAPP_RAW } from "@/lib/constants/contact";
import { SamplePlanQuickModal } from "./SamplePlanQuickModal";
import { findLatestProjectByReportId, appendProjectActivity, updateProjectMilestonesForOutreach } from "@/lib/storage/projects";

interface SupplierQuoteCardProps {
  quote: SupplierQuote;
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

export function SupplierQuoteCard({
  quote,
  productName,
  reportId,
  category,
  shippingMode,
  incoterms = "FOB",
  targetMoq,
  materialsAndDimensions,
  packagingAndPrinting,
  certificationsNeeded,
  upc,
  hasBackLabelPhoto,
}: SupplierQuoteCardProps) {
  const [copied, setCopied] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);

  const formatPrice = (min: number, max: number, currency: string) => {
    return `$${min.toFixed(2)}–$${max.toFixed(2)} ${quote.incoterms}`;
  };

  const generateMessage = () => {
    return buildQuoteRequestMessage({
      productName,
      category,
      targetMoq: targetMoq || quote.moq,
      incoterms: incoterms as "FOB",
      shippingMode,
      supplierType: quote.supplierType,
      supplierContactName: quote.supplierContactName || null,
      requestedSpecs: {
        certifications: quote.certifications,
      },
      notes: quote.notes,
    });
  };

  const logActivity = (channel: "whatsapp" | "email" | "copy", action: "sample_plan" | "quote_request" = "quote_request") => {
    if (!reportId) {
      return; // Fail silently if no reportId
    }

    const project = findLatestProjectByReportId(reportId);
    if (!project) {
      return; // Fail silently if no project found
    }

    // Build accurate message based on action and channel
    let message: string;
    if (action === "sample_plan") {
      if (channel === "copy") {
        message = `Sample plan message copied for ${quote.supplierName}`;
      } else if (channel === "email") {
        message = `Sample plan email draft opened for ${quote.supplierName}`;
      } else {
        message = `Sample plan draft opened for ${quote.supplierName} via WhatsApp`;
      }
    } else {
      // quote_request
      if (channel === "copy") {
        message = `Quote request message copied for ${quote.supplierName}`;
      } else if (channel === "email") {
        message = `Quote request email draft opened for ${quote.supplierName}`;
      } else {
        message = `Quote request draft opened for ${quote.supplierName} via WhatsApp`;
      }
    }

    appendProjectActivity(project.id, {
      type: "user_action",
      message,
      meta: {
        supplierId: quote.id,
        supplierName: quote.supplierName,
        channel: channel === "copy" ? null : channel,
        action,
      },
    });

    return project;
  };

  const handleOpenWhatsApp = () => {
    try {
      const message = generateMessage();
      const supplierPhone = quote.supplierWhatsApp
        ? normalizePhone(quote.supplierWhatsApp)
        : null;
      
      openWhatsAppDraft({
        supplierPhoneDigits: supplierPhone,
        requesterPhoneDigits: DEFAULT_REQUESTER_WHATSAPP_RAW,
        message,
      });

      // Log activity and advance milestones
      const project = logActivity("whatsapp", "quote_request");
      if (project) {
        updateProjectMilestonesForOutreach(project.id);
      }
    } catch (error) {
      toast.error("Failed to open WhatsApp");
      console.error("WhatsApp error:", error);
    }
  };

  const handleOpenEmail = () => {
    try {
      const message = generateMessage();
      const subject = buildEmailSubject(productName);
      const body = buildEmailBody(message);
      
      openEmailDraft({
        supplierEmail: quote.supplierEmail,
        requesterEmail: DEFAULT_REQUESTER_EMAIL,
        subject,
        body,
      });

      // Log activity
      logActivity("email", "quote_request");
    } catch (error) {
      toast.error("Failed to open email");
      console.error("Email error:", error);
    }
  };

  const handleCopyMessage = () => {
    const message = generateMessage();
    
    // Log activity
    logActivity("copy", "quote_request");
    
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy message");
    });
  };

  const handleRequestSample = () => {
    setShowSampleModal(true);
  };

  return (
    <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col min-h-[320px]">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate mb-1">
              {quote.supplierName}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs border-slate-300">
                {quote.country}
              </Badge>
              <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                Verified
              </Badge>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs border-slate-300 ml-2 flex-shrink-0"
          >
            {quote.supplierType === "manufacturer" ? "Manufacturer" : "Trading"}
          </Badge>
        </div>
      </div>

      {/* Core pricing block */}
      <div className="mb-6">
        <div className="text-2xl font-bold text-electric-blue-600 mb-1">
          {formatPrice(quote.quoteMin, quote.quoteMax, quote.currency)}
        </div>
        <p className="text-xs text-slate-500">
          Unit price at MOQ {quote.moq.toLocaleString()}
        </p>
      </div>

      {/* KPI grid 2x2 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Package className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">MOQ</span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {quote.moq.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">Lead time</span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {quote.leadTimeDays} days
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            {quote.sampleAvailable ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <XCircle className="w-3 h-3 text-slate-400" />
            )}
            <span className="text-xs text-slate-500">Sample</span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {quote.sampleAvailable ? "Available" : "Not available"}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <CheckCircle2 className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">Certifications</span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {quote.certifications.length}
          </div>
        </div>
      </div>

      {/* Risk flags row */}
      {quote.riskFlags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {quote.riskFlags.slice(0, 3).map((flag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs border-amber-300 text-amber-700"
            >
              {flag}
            </Badge>
          ))}
        </div>
      )}

      {/* Actions - pinned bottom */}
      <div className="mt-auto pt-4 border-t border-slate-200 space-y-3">
        {/* Primary: Request sample plan */}
        <Button
          onClick={handleRequestSample}
          className="w-full bg-electric-blue-600 hover:bg-electric-blue-700"
        >
          Request sample plan
        </Button>
        
        {/* Primary: WhatsApp draft (quote request) */}
        <Button
          onClick={handleOpenWhatsApp}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Open WhatsApp draft
        </Button>
        
        {/* Secondary: Email draft */}
        <Button
          variant="outline"
          onClick={handleOpenEmail}
          className="w-full border-slate-300"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email draft
        </Button>
        
        {/* Tertiary: Copy message */}
        <button
          onClick={handleCopyMessage}
          className="w-full text-xs text-slate-600 hover:text-slate-900 underline text-center"
        >
          {copied ? "Copied!" : "Copy message"}
        </button>
        
        <p className="text-xs text-slate-500 text-center">
          Opens a draft. You press send.
        </p>
        <p className="text-xs text-slate-500 text-center">
          If supplier contact is missing, we open the draft to your own WhatsApp so you can forward it.
        </p>
        <p className="text-xs text-slate-500 text-center">
          We coordinate next steps in Projects.
        </p>
      </div>

      {/* Sample Plan Quick Modal */}
      <SamplePlanQuickModal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        quote={quote}
        productName={productName}
        reportId={reportId}
        category={category}
        targetMoq={targetMoq}
        incoterms={incoterms}
        shippingMode={shippingMode}
        materialsAndDimensions={materialsAndDimensions}
        packagingAndPrinting={packagingAndPrinting}
        certificationsNeeded={certificationsNeeded}
        upc={upc}
        hasBackLabelPhoto={hasBackLabelPhoto}
      />
    </Card>
  );
}

