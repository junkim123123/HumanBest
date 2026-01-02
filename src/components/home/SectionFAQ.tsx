"use client";

import * as React from "react";
import { forwardRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface SectionFAQProps {
  isActive?: boolean;
}

const faqs = [
  {
    q: "How accurate is the estimate?",
    a: "Ranges based on your inputs. Confidence rises when we match customs or supplier proof.",
  },
  {
    q: "What does the $45 cover?",
    a: "Outreach to factories, 3 vetted quotes, MOQ, lead time, and a compliance checklist. We update your numbers with the quotes and deliver a short execution plan.",
  },
  {
    q: "Is the deposit refunded?",
    a: "Not refunded. It is credited on your first order within 30 days.",
  },
  {
    q: "What do you need from me?",
    a: "Product photo, barcode photo, label photo. Target quantity and destination port help. Retail price is optional.",
  },
];

export const SectionFAQ = forwardRef<HTMLDivElement, SectionFAQProps>(
  ({ isActive = false }, ref) => {
    // First item open by default
    const [openIndex, setOpenIndex] = useState<number>(0);

    return (
      <div ref={ref} className="landing-container py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <h2 className="text-[24px] font-bold text-center text-slate-900 sm:text-[28px]">
            Questions
          </h2>

          {/* FAQ Accordion */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {faqs.map((faq, idx) => (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50"
                  aria-expanded={openIndex === idx}
                >
                  <span className="text-[14px] font-medium text-slate-900">{faq.q}</span>
                  <ChevronDown 
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      openIndex === idx ? "rotate-180" : ""
                    }`} 
                  />
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    openIndex === idx ? "max-h-40" : "max-h-0"
                  }`}
                >
                  <div className="px-4 pb-4">
                    <p className="text-[13px] text-slate-600">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

SectionFAQ.displayName = "SectionFAQ";
