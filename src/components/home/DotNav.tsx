"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SECTION_LABELS = [
  "Upload",
  "Estimate",
  "Adjust",
  "Evidence",
  "Steps",
  "Verify",
  "After",
  "Pricing",
  "FAQ",
];

import { SLA_HEADLINE } from "@/lib/copy";

const SECTION_TOOLTIPS = [
  "Upload a photo",
  "Estimate first",
  "Change one assumption",
  "Evidence when available",
  "Estimate, Quote, Order",
  SLA_HEADLINE,
  "After verification",
  "Pricing summary",
  "Frequently asked questions",
];

interface DotNavProps {
  activeIndex: number;
  className?: string;
  onDotClick?: (index: number) => void;
}

export function DotNav({ activeIndex, className = "", onDotClick }: DotNavProps) {
  return (
    <TooltipProvider>
      <div className={`hidden lg:flex flex-col gap-4 fixed right-6 top-1/2 -translate-y-1/2 z-40 ${className}`}>
        {SECTION_LABELS.map((label, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (onDotClick) {
                    onDotClick(index);
                  } else {
                    const sectionEl = document.querySelector(
                      `[data-section-index="${index}"]`
                    );
                    sectionEl?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (onDotClick) {
                      onDotClick(index);
                    } else {
                      const sectionEl = document.querySelector(
                        `[data-section-index="${index}"]`
                      );
                      sectionEl?.scrollIntoView({ behavior: "smooth" });
                    }
                  }
                }}
                className="relative flex items-center gap-3 group"
                aria-label={SECTION_TOOLTIPS[index]}
              >
                <div className="relative w-2 h-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activeIndex
                        ? "bg-electric-blue-600"
                        : "bg-slate-300 group-hover:bg-slate-400"
                    }`}
                  />
                  {index === activeIndex && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute inset-0 rounded-full bg-electric-blue-600"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                {index === activeIndex && (
                  <span className="text-xs font-medium text-electric-blue-600 whitespace-nowrap">
                    {label}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {index !== activeIndex && (
              <TooltipContent side="left">
                <p className="text-xs">{SECTION_TOOLTIPS[index]}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

