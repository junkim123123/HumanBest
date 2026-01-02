"use client";

import { ReactNode, forwardRef } from "react";

interface LandingSectionProps {
  children: ReactNode;
  index: number;
  className?: string;
  align?: "top" | "center";
}

const SECTION_IDS = [
  "upload",
  "baseline",
  "adjust",
  "evidence",
  "three-steps",
  "verify",
  "after-verification",
  "pricing",
  "faq",
];

export const LandingSection = forwardRef<HTMLElement, LandingSectionProps>(
  ({ children, index, className = "", align = "center" }, ref) => {
    const sectionId = SECTION_IDS[index] || `section-${index}`;
    const isHero = index === 0;

    const bg = isHero
      ? "bg-white"
      : index % 2 === 0
        ? "bg-white"
        : "bg-slate-50/50";

    const alignClass = align === "top" ? "items-start" : "items-center";

    return (
      <section
        ref={ref}
        id={sectionId}
        data-section-index={index}
        className={[
          bg,
          "slide-section",
          alignClass,
          className,
        ].join(" ")}
        style={{
          height: "calc(100svh - var(--siteHeaderH, 0px))",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          scrollMarginTop: `var(--siteHeaderH, 0px)`,
        }}
      >
        <div className={`landing-section-inner ${isHero ? "hero" : ""}`}>
          {children}
        </div>
      </section>
    );
  }
);

LandingSection.displayName = "LandingSection";

