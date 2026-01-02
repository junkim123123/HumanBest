"use client";

import { VERIFICATION_SLA_LABEL } from "@/lib/constants/sla";

interface PricingHeroProps {}

export function PricingHero({}: PricingHeroProps) {
  return (
    <div className="text-center mb-12">
      <h1 className="text-[56px] leading-[64px] font-bold text-slate-900 mb-4">
        Pricing
      </h1>
      <p className="text-[18px] leading-[28px] text-slate-600 mb-2">
        Start free. Pay only when you want verified quotes and execution.
      </p>
      <p className="text-sm text-slate-500">
        All verification timelines are {VERIFICATION_SLA_LABEL}.
      </p>
    </div>
  );
}

