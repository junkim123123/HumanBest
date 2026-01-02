"use client";

import * as React from "react";
import { forwardRef } from "react";
import { SectionShell } from "./SectionShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlideCard } from "@/components/ui/slide-card";
import { TitleBlock } from "./TitleBlock";
import Link from "next/link";

interface SectionVerifyProps {
  isActive?: boolean;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function TimelineStep(props: {
  day: string;
  dayNumber: number;
  title: string;
  desc: string;
  timeBadge: string;
  active?: boolean;
}) {
  return (
    <div className="relative flex gap-2.5">
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={cx(
            "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
            props.active
              ? "border-electric-blue-200 bg-electric-blue-50 text-electric-blue-700"
              : "border-slate-200 bg-white text-slate-700"
          )}
        >
          {props.dayNumber}
        </div>
        {props.dayNumber < 3 && (
          <div className="mt-1 h-8 w-px bg-slate-100" />
        )}
      </div>

      <div className="flex-1 pb-2 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="text-[10px] font-semibold tracking-wide text-slate-500">
            {props.day.toUpperCase()}
          </div>
          <Badge
            variant="outline"
            className="h-3.5 px-1.5 text-[9px] bg-slate-50 text-slate-600 border-slate-200 flex-shrink-0"
          >
            {props.timeBadge}
          </Badge>
        </div>
        <div className="text-xs font-semibold text-slate-900 mb-0.5">
          {props.title}
        </div>
        <div className="text-[11px] leading-4 text-slate-600">{props.desc}</div>
      </div>
    </div>
  );
}

export const SectionVerify = forwardRef<HTMLElement, SectionVerifyProps>(
  ({ isActive = false }, ref) => {
    const deposit = 45;

    return (
      <SectionShell
        ref={ref}
        index={5}
        contentAlign="top"
        density="tight"
        budgets={{
          titleBlock: 150,
          badgesRow: 72,
          mainContent: 520,
        }}
        className="!py-0"
      >
        <div className="w-full h-full flex flex-col">
          <div className="slot-title-block">
            <div className="flex flex-col items-center text-center">
              <TitleBlock
                eyebrow="Verification and Execution"
                title="Get real quotes and ship to your port"
                subtitle="We start outreach within 12 hours, share updates while we validate, and deliver vetted quotes in about a week."
                density="tight"
              />
            </div>
          </div>

          <div className="slot-badges-row">
            <div className="flex flex-wrap justify-center items-center gap-2">
              <Badge
                variant="outline"
                className="h-4 px-2 text-[10px] bg-slate-50 text-slate-600 border-slate-200"
              >
                Outreach starts within 12 hours
              </Badge>
              <Badge
                variant="outline"
                className="h-4 px-2 text-[10px] bg-slate-50 text-slate-600 border-slate-200"
              >
                Updates while we validate quotes
              </Badge>
              <Badge
                variant="outline"
                className="h-4 px-2 text-[10px] bg-slate-50 text-slate-600 border-slate-200"
              >
                At least 3 supplier options
              </Badge>
            </div>
          </div>

          <div className="slot-main-content flex-1 min-h-0 overflow-hidden">
            <div className="w-full px-6">

              {/* Two column layout: Start card first on mobile, Timeline second */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
              {/* Start card - appears first on mobile */}
              <SlideCard className="md:col-span-2 order-1 md:order-2">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-slate-500 mb-1.5">
                      START
                    </div>
                    <div className="text-base font-semibold text-slate-900">
                      Start verification
                    </div>
                  </div>

                  {/* Deposit with risk reversal */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <div className="text-sm font-medium text-slate-700">
                        Planning deposit per product
                      </div>
                      <div className="text-xl font-semibold text-slate-900 tabular-nums">
                        ${deposit}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 font-medium line-clamp-2">
                      We align specs and build a quick execution plan; deposit credits back when you order.
                    </div>
                  </div>

                  {/* Deliverables block - limit to 3 visible */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      DELIVERABLES
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <div className="h-1 w-1 rounded-full bg-slate-400" />
                        <span>At least 3 viable factory quotes</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <div className="h-1 w-1 rounded-full bg-slate-400" />
                        <span>MOQ confirmed</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <div className="h-1 w-1 rounded-full bg-slate-400" />
                        <span>Lead time confirmed</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <div className="h-1 w-1 rounded-full bg-slate-400" />
                        <span>Execution plan summary</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <div className="h-1 w-1 rounded-full bg-slate-400" />
                        <span>Compliance checklist when available</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA button */}
                  <div className="pt-1">
                    <Link href="/analyze">
                      <Button size="sm" className="w-full">
                        Start verification
                      </Button>
                    </Link>
                  </div>
                </div>
              </SlideCard>

              {/* Timeline card - appears second on mobile */}
              <SlideCard className="md:col-span-3 order-2 md:order-1">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-slate-500 mb-1">
                      VERIFICATION TIMELINE
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-1">
                      Clear milestones so you know exactly what is happening
                    </div>
                  </div>

                  <div className="pt-1.5 space-y-1">
                    <TimelineStep
                      day="Step 1"
                      dayNumber={1}
                      title="Start outreach and align specs"
                      desc="We begin supplier outreach within 12 hours and make sure specs, MOQ, and packaging are clear."
                      timeBadge="Within 12 hours"
                      active
                    />
                    <TimelineStep
                      day="Step 2"
                      dayNumber={2}
                      title="Share updates while we validate"
                      desc="Regular updates while we collect, compare, and validate quotes with factories."
                      timeBadge="Updates during the week"
                    />
                    <TimelineStep
                      day="Step 3"
                      dayNumber={3}
                      title="Deliver verified quotes"
                      desc="About 1 week to share at least 3 viable quotes with MOQ and lead time confirmed."
                      timeBadge="About 1 week"
                    />
                  </div>

                  {/* What you receive - compact, limit to 3 visible */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-500 mb-1.5">
                      WHAT YOU RECEIVE
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div>Confirmed price, MOQ, and lead time</div>
                      <div>Execution plan summary and next steps</div>
                      <div>Compliance checklist when available</div>
                    </div>
                  </div>
                </div>
              </SlideCard>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }
);

SectionVerify.displayName = "SectionVerify";
