// @ts-nocheck
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VERIFICATION_SLA_LABEL } from "@/lib/constants/sla";
import { SLA_DESCRIPTION } from "@/lib/copy";

interface VerificationBlockProps {
  onStartVerification?: () => void;
}

export function VerificationBlock({ onStartVerification }: VerificationBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const whatWeVerify = [
    "HS code confirmation",
    "Verify 3 real factory candidates",
    "Collect accurate shipping quotes",
    "Required certifications check",
    "MOQ and lead time confirmation",
    "Sample availability check",
  ];

  const whatYouGet = [
    `Confirmed numbers ${VERIFICATION_SLA_LABEL}`,
    "3 verified factory candidates",
    "Actual shipping quotes",
  ];

  return (
    <div className="bg-gradient-to-br from-electric-blue-50 to-white rounded-2xl shadow-sm border-2 border-electric-blue-200 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">72-Hour Verification Service</h2>
          <p className="text-sm text-slate-600">
            {SLA_DESCRIPTION}
          </p>
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

      {/* What you get - always visible */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">What You Get</h3>
        <ul className="space-y-2">
          {whatYouGet.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* What we verify - collapsible */}
      {expanded && (
        <div className="mb-4 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">What We Verify</h3>
          <ul className="space-y-1">
            {whatWeVerify.map((item, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-electric-blue-600 font-bold mt-0.5">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA Button */}
      <Button
        onClick={onStartVerification}
        className="w-full bg-electric-blue-600 hover:bg-electric-blue-700 h-12 text-base font-semibold"
      >
        <MessageCircle className="w-5 h-5 mr-2" />
        Start Verification
      </Button>
    </div>
  );
}

