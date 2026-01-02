"use client";

import { useEffect, useState, useRef } from "react";

interface ReportV2SectionTabsProps {
  sections: Array<{ id: string; label: string }>;
}

export default function ReportV2SectionTabs({ sections }: ReportV2SectionTabsProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const observerOptions = {
      threshold: [0.6],
      rootMargin: "-120px 0px -40% 0px",
    };

    let currentInView: string | null = null;

    const observer = new IntersectionObserver((entries) => {
      // Find the section with highest intersection ratio above threshold
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleSections.length > 0) {
        const topSection = visibleSections[0].target.id;
        if (topSection !== currentInView) {
          currentInView = topSection;
          setActiveSection(topSection);
        }
      }
    }, observerOptions);

    // Observe all sections
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 145; // Account for sticky header + tabs
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Blur the button to remove focus outline after click
      const button = tabRefs.current.get(id);
      if (button) {
        button.blur();
      }
    }
  };

  return (
    <div className="sticky top-[105px] z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide" aria-label="Section navigation">
          {sections.map((section) => (
            <button
              key={section.id}
              ref={(el) => {
                if (el) tabRefs.current.set(section.id, el);
              }}
              onClick={() => scrollToSection(section.id)}
              className={[
                "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:rounded",
                activeSection === section.id
                  ? "text-blue-600 border-blue-600"
                  : "text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300",
              ].join(" ")}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
