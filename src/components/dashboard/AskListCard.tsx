// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { CheckSquare, Copy, Clipboard } from "lucide-react";
import { useState } from "react";

interface AskListCardProps {
  category?: string;
  productName?: string;
  hsCodeCandidates?: Array<{ code: string; confidence: number }>;
  targetQty?: number;
}

const defaultAskList = [
  "Material specifications and thickness",
  "Packaging method (box, individual packaging, etc.)",
  "Certification requirements (ASTM F963, CPSIA, HACCP, etc.)",
  "Logo printing method (silkscreen, sticker, etc.)",
  "Incoterms (FOB, CIF, etc.)",
  "Color and design customization availability",
  "Minimum order quantity (MOQ)",
  "Lead time (production + shipping)",
  "Sample availability",
  "Payment terms (deposit, letter of credit, etc.)",
];

const categorySpecificAsks: Record<string, string[]> = {
  "Confectionery & Sweets": [
    "Food labeling requirements (allergens, nutrition facts, etc.)",
    "FDA Prior Notice requirement",
    "Storage temperature and shelf life",
    "Packaging material (food contact safety)",
  ],
  "Anime Merchandise": [
    "License ownership confirmation",
    "Character design approval requirement",
    "IP usage rights confirmation",
  ],
  "Toys": [
    "ASTM F963 (US Toy Safety Standard)",
    "CPSIA (Consumer Product Safety Improvement Act)",
    "Small parts warning label",
    "Age-appropriate safety standards",
  ],
};

export function AskListCard({ category, productName, hsCodeCandidates, targetQty = 3000 }: AskListCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  
  const categoryAsks = category && categorySpecificAsks[category] 
    ? categorySpecificAsks[category] 
    : [];
  const allAsks = [...defaultAskList, ...categoryAsks];
  
  // Determine if this is a toy category
  const isToyCategory = category?.toLowerCase().includes("toy") || 
    category?.toLowerCase().includes("robotic") ||
    category?.toLowerCase().includes("dinosaur");
  const isFoodCategory = category?.toLowerCase().includes("food") ||
    category?.toLowerCase().includes("confectionery") ||
    category?.toLowerCase().includes("dessert");
  
  // Check HS code for toy classification
  const topHsCode = hsCodeCandidates && hsCodeCandidates.length > 0 
    ? hsCodeCandidates[0].code 
    : "";
  const isToyHs = topHsCode.startsWith("9503");
  const isFoodHs = topHsCode.startsWith("2106") || topHsCode.startsWith("2007");
  
  const finalIsToy = isToyCategory || isToyHs;
  const finalIsFood = isFoodCategory || isFoodHs;

  const handleCopy = () => {
    const text = allAsks.map((item, i) => `${i + 1}. ${item}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleCopyWhatsApp = () => {
    const product = productName || "this item";
    const qty1 = targetQty;
    const qty2 = Math.round(targetQty * 1.67); // ~5000 if 3000
    
    let template = `Hello, we are sourcing ${product}. Please confirm\n`;
    template += `1 FOB unit price for ${qty1.toLocaleString()} and ${qty2.toLocaleString()} units\n`;
    template += `2 MOQ and production lead time\n`;
    template += `3 Case pack units per carton and carton size weight\n`;
    
    if (finalIsToy) {
      template += `4 Required tests for US toys CPSIA ASTM F963 small parts\n`;
    } else if (finalIsFood) {
      template += `4 Required tests for US food FDA labeling allergens\n`;
    } else {
      template += `4 Required certifications and compliance\n`;
    }
    
    template += `5 Can you do sample and cost time`;
    
    navigator.clipboard.writeText(template);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };
  
  const handleCopyEmail = () => {
    const product = productName || "this item";
    const qty1 = targetQty;
    const qty2 = Math.round(targetQty * 1.67);
    
    let subject = `FOB quote request for ${product}`;
    let body = `Hello,\n\nPlease quote FOB unit price for ${qty1.toLocaleString()} and ${qty2.toLocaleString()} units.\n\n`;
    body += `Confirm MOQ, production lead time, and case pack details (units per carton and carton size and weight).\n\n`;
    
    if (finalIsToy) {
      body += `Confirm US toy compliance (CPSIA, ASTM F963) and small parts labeling.\n\n`;
    } else if (finalIsFood) {
      body += `Confirm US food compliance (FDA labeling, allergens, facility registration).\n\n`;
    } else {
      body += `Confirm required certifications and compliance requirements.\n\n`;
    }
    
    body += `Confirm whether you are the manufacturer or a trading company.\n\n`;
    body += `Please share sample cost and sample lead time.\n\nThank you.`;
    
    const emailText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(emailText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <CheckSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Send this to suppliers
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Copy ready templates for WhatsApp and email. Checklist remains below.
            </p>
          </div>
        </div>
      </div>

      {/* Copy Templates Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={handleCopyWhatsApp}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-sm font-medium text-green-700 transition-colors"
        >
          {copiedWhatsApp ? (
            <>
              <Clipboard className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy WhatsApp template
            </>
          )}
        </button>
        <button
          onClick={handleCopyEmail}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
        >
          {copiedEmail ? (
            <>
              <Clipboard className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy fast email template
            </>
          )}
        </button>
      </div>

      {/* Checklist Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700">Quote Request Checklist</h4>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Clipboard className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy All
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {allAsks.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-slate-300 mt-0.5" />
            <span className="text-sm text-slate-700 flex-1">{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          💡 Sending this checklist to suppliers will help you get more accurate quotes.
        </p>
      </div>
    </motion.div>
  );
}

