// @ts-nocheck
"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/report/types";

interface SupplierTemplatesProps {
  report: Report;
}

export function SupplierTemplates({ report }: SupplierTemplatesProps) {
  const [copied, setCopied] = useState<"whatsapp" | "email" | null>(null);

  const generateWhatsAppTemplate = () => {
    return `Hi, I'm looking for a supplier for:

Product: ${report.productName}
Baseline FOB estimate range: $${report.baseline.costRange.standard.unitPrice.toFixed(2)} to $${report.baseline.costRange.conservative.unitPrice.toFixed(2)} per unit
This range is a baseline estimate. Please quote your best FOB with MOQ breaks.
MOQ: ${report.baseline.riskFlags.supply.moqRange.typical.toLocaleString()} units
Lead time: ${report.baseline.riskFlags.supply.leadTimeRange.typical} days

Required certifications:
${report.baseline.riskFlags.compliance.requiredCertifications.map((c) => `- ${c}`).join("\n")}

Please provide:
- Unit price breaks by MOQ
- MOQ
- Lead time
- Sample availability
- Payment terms
- Certifications and test reports if applicable`;
  };

  const generateEmailTemplate = () => {
    return `Subject: Quote Request - ${report.productName}

Dear Supplier,

I am interested in sourcing the following product:

Product Name: ${report.productName}
Category: ${report.category}
Baseline FOB estimate range: $${report.baseline.costRange.standard.unitPrice.toFixed(2)} to $${report.baseline.costRange.conservative.unitPrice.toFixed(2)} per unit
This range is a baseline estimate. Please quote your best FOB with MOQ breaks.
MOQ Target: ${report.baseline.riskFlags.supply.moqRange.typical.toLocaleString()} units
Lead Time Target: ${report.baseline.riskFlags.supply.leadTimeRange.typical} days

Required Certifications:
${report.baseline.riskFlags.compliance.requiredCertifications.map((c) => `- ${c}`).join("\n")}

Please provide:
- Unit price breaks by MOQ
- MOQ
- Lead time
- Sample availability
- Payment terms
- Certifications and test reports if applicable

Thank you.`;
  };

  const handleCopy = async (type: "whatsapp" | "email") => {
    const text = type === "whatsapp" ? generateWhatsAppTemplate() : generateEmailTemplate();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Send to Suppliers</h2>

      <div className="space-y-3">
        {/* WhatsApp template */}
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-slate-900">WhatsApp Template</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy("whatsapp")}
              className="flex items-center gap-2"
            >
              {copied === "whatsapp" ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {copied === "whatsapp" ? "Copied. Paste into WhatsApp." : "Copy template and paste into WhatsApp"}
          </p>
        </div>

        {/* Email template */}
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-slate-900">Email Template</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy("email")}
              className="flex items-center gap-2"
            >
              {copied === "email" ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {copied === "email" ? "Copied. Paste into your email client." : "Copy template and paste into email"}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        ✓ Checklist included automatically
      </p>
    </div>
  );
}

