"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DeckSection } from "@/lib/marketing/sections";

interface DeckProgressProps {
  sections: DeckSection[];
  activeIndex: number;
  className?: string;
  variant?: "vertical" | "horizontal";
}

export function DeckProgress({
  sections,
  activeIndex,
  className = "",
  variant = "vertical",
}: DeckProgressProps) {
  if (variant === "horizontal") {
    return (
      <TooltipProvider>
        <div className={`flex items-center gap-2 ${className}`}>
          {sections.map((section, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    const sectionEl = document.querySelector(
                      `[data-section-index="${index}"]`
                    );
                    sectionEl?.scrollIntoView({ behavior: "smooth" });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const sectionEl = document.querySelector(
                        `[data-section-index="${index}"]`
                      );
                      sectionEl?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="relative"
                  aria-label={`Go to ${section.headline}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activeIndex
                        ? "bg-electric-blue-600"
                        : "bg-slate-300"
                    }`}
                  />
                  {index === activeIndex && (
                    <motion.div
                      layoutId="activeProgress"
                      className="absolute inset-0 rounded-full bg-electric-blue-600"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{section.headline}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col gap-4 ${className}`}>
        {sections.map((section, index) => (
          <Tooltip key={section.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  const sectionEl = document.querySelector(
                    `[data-section-index="${index}"]`
                  );
                  sectionEl?.scrollIntoView({ behavior: "smooth" });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const sectionEl = document.querySelector(
                      `[data-section-index="${index}"]`
                    );
                    sectionEl?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="relative flex items-center gap-3 group"
                aria-label={section.headline}
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
                      layoutId="activeProgress"
                      className="absolute inset-0 rounded-full bg-electric-blue-600"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                {index === activeIndex && (
                  <span className="text-xs font-medium text-electric-blue-600 whitespace-nowrap">
                    {section.headline}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {index !== activeIndex && (
              <TooltipContent side="left">
                <p className="text-xs">{section.headline}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

