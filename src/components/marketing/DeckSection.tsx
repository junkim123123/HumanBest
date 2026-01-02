// @ts-nocheck
"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadCard } from "./UploadCard";
import { RangeCard } from "./RangeCard";
import { DollarSign, Package } from "lucide-react";
import { CostStackDemo } from "./CostStackDemo";
import { EvidenceDemo } from "./EvidenceDemo";
import { VerificationDemo } from "./VerificationDemo";
import { CTADemo } from "./CTADemo";
import { VideoModal } from "./VideoModal";
import { useState } from "react";
import { Play, ChevronDown } from "lucide-react";
import type { DeckSection as DeckSectionType } from "@/lib/marketing/sections";

interface DeckSectionProps {
  section: DeckSectionType;
  index: number;
  isActive: boolean;
}

export function DeckSection({ section, index, isActive }: DeckSectionProps) {
  const [showVideo, setShowVideo] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const renderComponent = () => {
    switch (section.component) {
      case "upload":
        return <UploadCard isActive={isActive} />;
      case "baseline":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-3xl mx-auto">
            <RangeCard
              icon={DollarSign}
              title="Landed Cost Range"
              min={2.22}
              max={2.66}
              typical={2.44}
              isActive={isActive}
              color="electric-blue"
              delay={0.2}
            />
            <RangeCard
              icon={Package}
              title="FOB Range"
              min={0.75}
              max={0.85}
              typical={0.80}
              isActive={isActive}
              color="blue"
              delay={0.3}
            />
          </div>
        );
      case "assumptions":
        return <CostStackDemo isActive={isActive} />;
      case "evidence":
        return <EvidenceDemo isActive={isActive} />;
      case "verification":
        return <VerificationDemo isActive={isActive} />;
      case "cta":
        return <CTADemo isActive={isActive} />;
      default:
        return null;
    }
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        className="w-full max-w-5xl mx-auto text-center relative"
      >
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {section.headline}
          </h1>
          {section.subcopy && (
            <p className="text-sm md:text-base text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              {section.subcopy}
            </p>
          )}

          {renderComponent()}

          {section.cta && (
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
              animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.3, duration: shouldReduceMotion ? 0 : 0.4 }}
              className="mt-10"
            >
              <div className="flex flex-col items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-electric-blue-600 hover:bg-electric-blue-700 text-white text-lg px-8 py-6 h-auto"
                >
                  <Link href={section.cta.href}>
                    {section.cta.label.charAt(0).toUpperCase() + section.cta.label.slice(1)}
                  </Link>
                </Button>
                {index === 0 && (
                  <p className="text-xs text-slate-500">
                    Sign in required to run estimates • Try demo first
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Scroll hint for first section */}
          {index === 0 && isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-2 text-slate-400"
              >
                <span className="text-xs">Scroll to explore</span>
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </motion.div>
          )}

          {section.videoUrl && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={isActive ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.4 }}
              onClick={() => setShowVideo(true)}
              className="mt-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Play className="w-4 h-4" />
              Watch how it works
            </motion.button>
          )}
        </div>
      </motion.div>

      {section.videoUrl && (
        <VideoModal
          isOpen={showVideo}
          onClose={() => setShowVideo(false)}
          videoUrl={section.videoUrl}
        />
      )}
    </>
  );
}

