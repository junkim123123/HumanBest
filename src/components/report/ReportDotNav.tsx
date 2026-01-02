// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Section {
  label: string;
  index: number;
}

interface ReportDotNavProps {
  activeIndex: number;
  sections: Section[];
  onSelect?: (index: number) => void;
  scrollContainer?: HTMLElement | null;
  className?: string;
}

export function ReportDotNav({ 
  activeIndex, 
  sections, 
  onSelect,
  scrollContainer,
  className = "" 
}: ReportDotNavProps) {
  const handleDotClick = (index: number) => {
    if (onSelect) {
      onSelect(index);
      return;
    }
    
    // Fallback to old behavior
    const sectionEl = document.querySelector(
      `[data-report-section-index="${index}"]`
    ) as HTMLElement;
    
    if (sectionEl && scrollContainer) {
      // Scroll within the container
      const containerRect = scrollContainer.getBoundingClientRect();
      const sectionRect = sectionEl.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;
      const relativeTop = sectionRect.top - containerRect.top + scrollTop;
      
      scrollContainer.scrollTo({
        top: relativeTop,
        behavior: "smooth",
      });
    } else if (sectionEl) {
      // Fallback to scrollIntoView
      sectionEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <TooltipProvider>
      <div className={`hidden lg:flex flex-col gap-4 fixed right-6 top-1/2 -translate-y-1/2 z-40 ${className}`}>
        {sections.map((section) => {
          const index = section.index;
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleDotClick(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleDotClick(index);
                    }
                  }}
                  className="relative flex items-center gap-3 group"
                  aria-label={section.label}
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
                        layoutId="activeReportDot"
                        className="absolute inset-0 rounded-full bg-electric-blue-600"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  {index === activeIndex && (
                    <span className="text-xs font-medium text-electric-blue-600 whitespace-nowrap">
                      {section.label}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {index !== activeIndex && (
                <TooltipContent side="left">
                  <p className="text-xs">{section.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

