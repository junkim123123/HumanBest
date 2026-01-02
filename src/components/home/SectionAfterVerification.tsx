"use client";

import * as React from "react";
import { forwardRef, useState } from "react";
import { SectionShell } from "./SectionShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlideCard } from "@/components/ui/slide-card";
import Link from "next/link";
import { TitleBlock } from "./TitleBlock";

interface SectionAfterVerificationProps {
  isActive?: boolean;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface StepData {
  number: 1 | 2 | 3;
  title: string;
  outcome: string;
  youDo: string[];
  weDo: string[];
}

const STEPS: StepData[] = [
  {
    number: 1,
    title: "Verification summary delivered",
    outcome: "What is delivered",
    youDo: [],
    weDo: [
      "Confirmed quotes",
      "Supplier options and MOQ",
      "Compliance checklist",
    ],
  },
  {
    number: 2,
    title: "Lock order details",
    outcome: "You approve the plan",
    youDo: [
      "Confirm order quantity",
      "Confirm packaging and labeling",
      "Confirm ship date and payment terms",
    ],
    weDo: [],
  },
  {
    number: 3,
    title: "Execution support",
    outcome: "We coordinate the work",
    youDo: [],
    weDo: [
      "Supplier negotiation and PO support",
      "QC and inspection plan",
      "Production timeline updates",
    ],
  },
];

function StepCard({ step }: { step: StepData }) {
  const [expanded, setExpanded] = React.useState(false);
  const youDoVisible = expanded ? step.youDo : step.youDo.slice(0, 2);
  const weDoVisible = expanded ? step.weDo : step.weDo.slice(0, 2);
  const hasMoreYouDo = step.youDo.length > 2;
  const hasMoreWeDo = step.weDo.length > 2;
  const hasMore = hasMoreYouDo || hasMoreWeDo;

  return (
    <SlideCard className="h-full">
      <div className="space-y-3 p-4">
        {/* Step number and title */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700 tabular-nums">
              {step.number}
            </div>
            <div className="text-[10px] font-semibold text-slate-500">
              {step.outcome}
            </div>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {step.title}
          </div>
        </div>

        {/* You do / We do columns */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          {/* You do column */}
          <div className="min-w-0">
            <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              You do
            </div>
            {step.youDo.length > 0 ? (
              <ul className="space-y-1">
                {youDoVisible.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-xs text-slate-700"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-400 italic">—</div>
            )}
          </div>

          {/* We do column */}
          <div className="min-w-0">
            <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              We do
            </div>
            {step.weDo.length > 0 ? (
              <ul className="space-y-1">
                {weDoVisible.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-xs text-slate-700"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-400 italic">—</div>
            )}
          </div>
        </div>

        {/* Expand control */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-medium text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-electric-blue-500 focus:ring-offset-2 rounded px-1 py-0.5"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </SlideCard>
  );
}

function Connector() {
  return (
    <div className="hidden md:flex items-center justify-center flex-shrink-0 px-2">
      <div className="flex items-center gap-1">
        <div className="h-px w-4 bg-slate-200" />
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4 text-slate-300"
          aria-hidden="true"
        >
          <path
            d="M7.5 5L12.5 10L7.5 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="h-px w-4 bg-slate-200" />
      </div>
    </div>
  );
}

export const SectionAfterVerification = forwardRef<
  HTMLElement,
  SectionAfterVerificationProps
>(({ isActive = false }, ref) => {
  return (
    <SectionShell
      ref={ref}
      index={6}
      contentAlign="center"
      density="default"
      budgets={{
        titleBlock: 160,
        mainContent: 420,
        actionRow: 120,
      }}
      className="!py-0"
    >
      <div className="w-full h-full flex flex-col">
        <div className="slot-title-block">
          <div className="flex flex-col items-center text-center">
            <TitleBlock
              eyebrow="AFTER"
              title="What happens after verification"
              subtitle="You confirm final order details. We handle supplier coordination and execution support."
              badges={
                <>
                  <Badge
                    variant="outline"
                    className="h-5 px-2.5 text-xs bg-slate-50 text-slate-600 border-slate-200"
                  >
                    Order details locked
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-5 px-2.5 text-xs bg-slate-50 text-slate-600 border-slate-200"
                  >
                    QC and inspection support
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-5 px-2.5 text-xs bg-slate-50 text-slate-600 border-slate-200"
                  >
                    Production timeline tracking
                  </Badge>
                </>
              }
              density="default"
            />
          </div>
        </div>

        <div className="slot-main-content flex-1 min-h-0 overflow-hidden">
          <div className="w-full px-6">
            {/* 3 step ladder */}
            <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-0">
              {STEPS.map((step, idx) => (
                <React.Fragment key={step.number}>
                  <div className="flex-1">
                    <StepCard step={step} />
                  </div>
                  {idx < STEPS.length - 1 && <Connector />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="slot-action-row">
          <div className="w-full px-6">
            {/* Action card / Footer CTA */}
            <SlideCard>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <div className="text-sm font-semibold text-slate-900 mb-1">
                  Ready to proceed?
                </div>
                <div className="text-xs text-slate-600">
                  Start with one box. We handle the rest.
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link href="/analyze">
                  <Button size="md" className="w-full md:w-auto">
                    Continue to execution
                  </Button>
                </Link>
                <Link
                  href="/contact"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-electric-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </SlideCard>
          </div>
        </div>
      </div>
    </SectionShell>
  );
});

SectionAfterVerification.displayName = "SectionAfterVerification";
