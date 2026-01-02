// @ts-nocheck
"use client";

interface ReportSlideTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function ReportSlideTitle({ title, subtitle, align = "left" }: ReportSlideTitleProps) {
  return (
    <div className={`mb-4 ${align === "center" ? "text-center" : ""}`}>
      <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 ${subtitle ? "mb-2" : ""}`}>{title}</h2>
      {subtitle && (
        <p className={`text-base md:text-lg text-slate-600 ${align === "center" ? "max-w-2xl mx-auto" : ""}`}>{subtitle}</p>
      )}
    </div>
  );
}


