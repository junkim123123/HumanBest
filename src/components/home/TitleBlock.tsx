"use client";

import { ReactNode } from "react";

interface TitleBlockProps {
  eyebrow: string;
  title: string;
  subtitle?: string | ReactNode;
  badges?: ReactNode;
  density?: "default" | "tight";
  maxWidth?: string | number;
}

export function TitleBlock({ eyebrow, title, subtitle, badges, density = "default", maxWidth }: TitleBlockProps) {
  const spacingClass = density === "tight" ? "title-block-tight" : "title-block-default";

  return (
    <div className={`${spacingClass} text-left`}>
      <div className="landing-kicker mb-2">{eyebrow}</div>
      <h2 className="landing-title" style={maxWidth ? { maxWidth } : undefined}>{title}</h2>
      {subtitle && <p className="landing-subtitle">{subtitle}</p>}
      {badges && <div className="mt-3 flex flex-wrap gap-2">{badges}</div>}
    </div>
  );
}

