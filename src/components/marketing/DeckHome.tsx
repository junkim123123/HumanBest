"use client";

import { useRef, useState, useEffect } from "react";
import { DeckSection } from "./DeckSection";
import { DeckProgress } from "./DeckProgress";
import { DECK_SECTIONS } from "@/lib/marketing/sections";
import { PrimaryNav } from "@/components/PrimaryNav";

export function DeckHome() {
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = sectionRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              setActiveSection(index);
            }
          });
        },
        {
          threshold: [0.5],
          rootMargin: "-20% 0px -20% 0px",
        }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => {
        if (observer) observer.disconnect();
      });
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-white">
      <PrimaryNav />
      <DeckProgress
        sections={DECK_SECTIONS}
        activeIndex={activeSection}
        className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40"
      />
      <DeckProgress
        sections={DECK_SECTIONS}
        activeIndex={activeSection}
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
        variant="horizontal"
      />

      <div className="snap-y snap-mandatory overflow-y-scroll h-screen">
        {DECK_SECTIONS.map((section, index) => (
          <div
            key={section.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            data-section-index={index}
            className={`snap-start min-h-screen flex items-center justify-center px-5 md:px-6 py-16 md:py-24 ${
              index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
            }`}
            style={{
              minHeight: "calc(100vh - 80px)",
            }}
          >
            <div className="w-full max-w-[1120px] mx-auto">
              <DeckSection
                section={section}
                index={index}
                isActive={activeSection === index}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

