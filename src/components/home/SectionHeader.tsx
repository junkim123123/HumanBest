"use client";

import { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
  titleClassName = "",
  subtitleClassName = "",
}: SectionHeaderProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const defaultTitleClasses =
    "text-balance font-semibold tracking-tight leading-[1.08] max-w-[20ch] sm:max-w-[28ch] md:max-w-none text-3xl sm:text-4xl lg:text-[44px]";
  const defaultSubtitleClasses =
    "text-balance text-slate-600 mt-3 max-w-[44ch] sm:max-w-[56ch] md:max-w-none text-base sm:text-lg lg:text-[18px]";
  const defaultEyebrowClasses =
    "text-xs font-medium text-slate-500 uppercase tracking-wider";

  return (
    <div className={`mb-10 sm:mb-12 ${alignClasses[align]} ${className}`}>
      {eyebrow && (
        <div className={defaultEyebrowClasses}>{eyebrow}</div>
      )}
      <h2 className={`${defaultTitleClasses} ${titleClassName}`}>{title}</h2>
      {subtitle && (
        <p className={`${defaultSubtitleClasses} ${subtitleClassName}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

