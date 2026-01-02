"use client";

import { forwardRef } from "react";
import { SectionShell } from "./SectionShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SectionDemoProps {
  isActive: boolean;
}

const FAQ_ITEMS = [
  {
    q: "How accurate is the estimate?",
    a: "Estimate ranges come from LLM analysis and category signals. Final numbers require supplier verification.",
  },
  {
    q: "When is evidence attached?",
    a: "Evidence is attached only when found in US import records or our network.",
  },
  {
    q: "What happens after verification?",
    a: "You receive at least 3 verified suppliers, confirmed quotes, and a compliance checklist in about a week.",
  },
];

export const SectionDemo = forwardRef<HTMLElement, SectionDemoProps>(
  ({ isActive }, ref) => {
    return (
      <SectionShell ref={ref} index={5}>
      <div className="flex justify-center mb-8">
        <Card className="w-full max-w-[860px] h-[180px] p-4 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Demo report */}
            <div className="flex flex-col justify-center">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full h-12 border-slate-300"
              >
                <Link href="/reports/toy-example">Demo report</Link>
              </Button>
              <p className="text-xs text-slate-500 text-center mt-2">
                See a real example
              </p>
            </div>

            {/* Start analysis */}
            <div className="flex flex-col justify-center">
              <Button
                asChild
                size="lg"
                className="w-full h-12 bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
              >
                <Link href="/analyze">Start analysis</Link>
              </Button>
              <p className="text-xs text-slate-500 text-center mt-2">
                Upload your photo
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* FAQ */}
      <div className="max-w-[860px] mx-auto">
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className="border-b border-slate-100 pb-3 last:border-0"
            >
              <div className="text-xs font-semibold text-slate-900 mb-1">
                {item.q}
              </div>
              <div className="text-xs text-slate-600">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
    );
  }
);

SectionDemo.displayName = "SectionDemo";

