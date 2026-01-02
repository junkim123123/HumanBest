"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrimaryNav } from "@/components/PrimaryNav";
import { ReportStickyHeader } from "@/components/report/ReportStickyHeader";
import { ReportDotNav } from "@/components/report/ReportDotNav";
import { SlideShell } from "@/components/report/SlideShell";
import { ReportSummarySlide } from "@/components/report/sections/ReportSummarySlide";
import { AdvancedDetailsSlide } from "@/components/report/sections/AdvancedDetailsSlide";
import { VerifiedQuotesSlide } from "@/components/report/VerifiedQuotesSlide";
import { TightenInputsSheet } from "@/components/report/TightenInputsSheet";
import { SourcingLeadsSheet } from "@/components/report/SourcingLeadsSheet";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/report/types";

type ReportClientProps = {
  reportId?: string;
  report?: Report;
  initialReport?: Report;
  isSample?: boolean;
  showPrimaryNav?: boolean;
};

export default function ReportClient({
  reportId,
  report,
  initialReport,
  isSample = false,
  showPrimaryNav = true,
}: ReportClientProps) {
  const activeReport = useMemo(() => initialReport ?? report, [initialReport, report]);
  const reportKey = useMemo(() => reportId ?? activeReport?.id, [reportId, activeReport?.id]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerH, setContainerH] = useState<number>(0);
  const [tightenSheetOpen, setTightenSheetOpen] = useState(false);
  const [sourcingLeadsSheetOpen, setSourcingLeadsSheetOpen] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<string>("classification");

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: "auto" });
    setActiveIndex(0);
    sectionRefs.current = [];
  }, [reportKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => setContainerH(el.clientHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (!activeReport || !reportKey) return null;

  const hasQuotes = (activeReport.verifiedQuotes?.suppliers?.length ?? 0) > 0;

  const scrollToIndex = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * el.clientHeight, behavior: "smooth" });
  }, []);

  const sections = useMemo(() => {
    const list = [
      { key: "summary", label: "Summary", title: "", render: () => null },
      {
        key: "details",
        label: "Details",
        title: "",
        render: () => (
          <AdvancedDetailsSlide
            report={activeReport}
            defaultTab={activeDetailsTab}
            onTabChange={setActiveDetailsTab}
          />
        ),
      },
      ...(hasQuotes
        ? [
            {
              key: "quotes",
              label: "Quotes",
              title: "",
              render: () => <VerifiedQuotesSlide report={activeReport} />,
            },
          ]
        : []),
    ];
    return list.map((s, i) => ({ ...s, index: i }));
  }, [hasQuotes, activeReport, activeDetailsTab]);

  const handleViewSourcingLeads = useCallback(() => {
    setSourcingLeadsSheetOpen(true);
  }, []);

  const renderSummary = useCallback(() => {
    const actionsOverride = isSample ? (
      <div className="flex gap-2">
        <Button
          asChild
          size="sm"
          className="h-8 px-3 text-xs bg-electric-blue-600 hover:bg-electric-blue-700"
        >
          <Link href="/signin">Sign in to save</Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Link href="/signup">Create free account</Link>
        </Button>
      </div>
    ) : null;

    return (
      <ReportSummarySlide
        report={activeReport}
        onTightenClick={!isSample ? () => setTightenSheetOpen(true) : undefined}
        onConfirm={!isSample ? () => {} : undefined}
        onRerun={!isSample ? () => {} : undefined}
        onViewSourcingLeads={!isSample ? handleViewSourcingLeads : undefined}
        actionsOverride={actionsOverride}
      />
    );
  }, [activeReport, handleViewSourcingLeads, isSample]);

  // Update summary section render
  const sectionsWithRender = useMemo(() => {
    return sections.map((s) => {
      if (s.key === "summary") {
        return { ...s, render: renderSummary };
      }
      return s;
    });
  }, [sections, renderSummary]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!best) return;
        const idxStr = (best.target as HTMLElement).dataset.index;
        const idx = idxStr ? Number(idxStr) : 0;
        if (!Number.isNaN(idx)) setActiveIndex(idx);
      },
      { root, threshold: [0.55, 0.6, 0.65] }
    );

    sectionRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [sectionsWithRender.length]);

  return (
    <>
      <div className="h-[100dvh] bg-white flex flex-col overflow-hidden">
        {showPrimaryNav && <PrimaryNav />}

        <div className="shrink-0 bg-white border-b">
          <ReportStickyHeader report={activeReport} />
        </div>

        <div className="relative flex-1 min-h-0 overflow-hidden">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto overscroll-contain snap-y snap-mandatory"
          >
            {sectionsWithRender.map((section, index) => {
              const isSummary = section.key === "summary";
              // Allow inner scroll for Summary slide
              return (
                <SlideShell
                  key={section.key}
                  ref={(el) => {
                    sectionRefs.current[index] = el;
                  }}
                  dataIndex={index}
                  height={containerH || undefined}
                  title={section.title}
                  allowInnerScroll={isSummary}
                >
                  {section.render()}
                </SlideShell>
              );
            })}
          </div>

          <ReportDotNav
            sections={sectionsWithRender.map((s) => ({ label: s.label, index: s.index }))}
            activeIndex={activeIndex}
            onSelect={scrollToIndex}
            scrollContainer={scrollRef.current}
          />
        </div>
      </div>

      {!isSample && (
        <>
          <TightenInputsSheet
            report={activeReport}
            open={tightenSheetOpen}
            onOpenChange={setTightenSheetOpen}
          />
          <SourcingLeadsSheet
            report={activeReport}
            open={sourcingLeadsSheetOpen}
            onOpenChange={setSourcingLeadsSheetOpen}
          />
        </>
      )}
    </>
  );
}
