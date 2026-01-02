"use client";

import { ReactNode, forwardRef } from "react";

interface LandingSlideShellProps {
  children: ReactNode;
  id: string;
  className?: string;
}

/**
 * Shell component for landing page slides
 * Each slide uses snap-start and snap-stop-always
 * Height equals scroll container height (100svh - header height)
 */
export const LandingSlideShell = forwardRef<HTMLElement, LandingSlideShellProps>(
  ({ children, id, className = "" }, ref) => {
    return (
      <section
        ref={ref}
        id={id}
        className={`slide-section ${className}`}
        style={{
          height: "calc(100svh - var(--siteHeaderH, 0px))",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          scrollMarginTop: `var(--siteHeaderH, 0px)`,
        }}
      >
        <div className="landing-slide-inner">
          {children}
        </div>
      </section>
    );
  }
);

LandingSlideShell.displayName = "LandingSlideShell";











