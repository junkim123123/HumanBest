"use client";

import { useEffect, useRef, useState } from "react";

interface SlideDeckQAProps {
  sectionId: string;
  sectionIndex: number;
  sectionRef: React.RefObject<HTMLElement>;
}

export function SlideDeckQA({ sectionId, sectionIndex, sectionRef }: SlideDeckQAProps) {
  const [metrics, setMetrics] = useState<{
    sectionHeight: number;
    titleTop: number;
    titleBlockHeight: number;
    contentAreaTop: number;
  } | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const section = sectionRef.current;
      if (!section) return;

      const root = document.documentElement;
      const sectionHeightStr = getComputedStyle(root).getPropertyValue("--home-vh") || "0px";
      const sectionHeight = parseFloat(sectionHeightStr);

      // Get titleTop from CSS variable (clamp value)
      const titleTopStr = getComputedStyle(root).getPropertyValue("--home-title-top") || "40px";
      // Parse clamp value - extract the middle value or use fallback
      const titleTopMatch = titleTopStr.match(/(\d+(?:\.\d+)?)px/);
      const titleTop = titleTopMatch ? parseFloat(titleTopMatch[1]) : 40;

      // Find title block slot
      const titleSlot = section.querySelector(".landing-section-title-slot") as HTMLElement;
      const titleBlockHeight = titleSlot?.offsetHeight || 0;

      // Content area starts after titleTop + titleBlockHeight
      const contentAreaTop = titleTop + titleBlockHeight;

      setMetrics({
        sectionHeight,
        titleTop,
        titleBlockHeight,
        contentAreaTop,
      });
    };

    updateMetrics();
    const resizeObserver = new ResizeObserver(updateMetrics);
    if (sectionRef.current) {
      resizeObserver.observe(sectionRef.current);
    }

    // Also observe window resize
    window.addEventListener("resize", updateMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, [sectionRef]);

  if (!metrics) return null;

  const section = sectionRef.current;
  if (!section) return null;

  const scrollContainer = section.closest(".home-scroll-container") as HTMLElement;
  if (!scrollContainer) return null;

  const sectionRect = section.getBoundingClientRect();
  const containerRect = scrollContainer.getBoundingClientRect();
  
  // Calculate positions relative to scroll container viewport
  const sectionTopInViewport = sectionRect.top - containerRect.top;
  const titleBaselineY = sectionTopInViewport + metrics.titleTop;
  const contentStartY = sectionTopInViewport + metrics.contentAreaTop;

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        top: `${containerRect.top}px`,
        left: `${containerRect.left}px`,
        width: `${containerRect.width}px`,
        height: `${containerRect.height}px`,
      }}
    >
      {/* Title baseline guide line */}
      <div
        className="absolute left-0 right-0 border-t-2 border-blue-500/60"
        style={{
          top: `${titleBaselineY}px`,
        }}
      >
        <div className="absolute left-2 -top-3 bg-blue-500/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
          Title Baseline
        </div>
      </div>

      {/* Content area start guide line */}
      <div
        className="absolute left-0 right-0 border-t-2 border-green-500/60"
        style={{
          top: `${contentStartY}px`,
        }}
      >
        <div className="absolute left-2 -top-3 bg-green-500/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
          Content Start
        </div>
      </div>

      {/* Section metrics label */}
      {sectionTopInViewport >= -metrics.sectionHeight && sectionTopInViewport <= containerRect.height && (
        <div
          className="absolute bg-slate-900/90 text-white text-[10px] px-2 py-1.5 rounded font-mono leading-tight shadow-lg"
          style={{
            top: `${Math.max(8, sectionTopInViewport + 8)}px`,
            right: "8px",
            maxWidth: "200px",
          }}
        >
          <div className="font-semibold text-blue-400 mb-1">{sectionId}</div>
          <div className="space-y-0.5">
            <div>
              <span className="text-slate-400">vh:</span>{" "}
              <span className="text-white">{metrics.sectionHeight.toFixed(0)}px</span>
            </div>
            <div>
              <span className="text-slate-400">titleTop:</span>{" "}
              <span className="text-white">{metrics.titleTop.toFixed(0)}px</span>
            </div>
            <div>
              <span className="text-slate-400">titleH:</span>{" "}
              <span className="text-white">{metrics.titleBlockHeight.toFixed(0)}px</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

