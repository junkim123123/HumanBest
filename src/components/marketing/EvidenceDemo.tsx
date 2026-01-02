"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileText, Search, CheckCircle2 } from "lucide-react";

interface EvidenceDemoProps {
  isActive: boolean;
}

const EVIDENCE_LEVELS = [
  {
    level: "baseline",
    label: "Baseline",
    description: "LLM + category signals",
    icon: FileText,
    chips: ["LLM baseline", "Category baseline"],
  },
  {
    level: "evidence_backed",
    label: "Evidence-backed",
    description: "US import records found",
    icon: Search,
    chips: ["Import record", "Category baseline"],
  },
  {
    level: "verified",
    label: "Verified",
    description: "3 factories verified",
    icon: CheckCircle2,
    chips: ["Network verified", "Factory quotes"],
  },
];

export function EvidenceDemo({ isActive }: EvidenceDemoProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EVIDENCE_LEVELS.map((level, index) => {
              const Icon = level.icon;
              return (
                <motion.div
                  key={level.level}
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isActive
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 20 }
                  }
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Card className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm h-full flex flex-col">
                    {/* Icon circle */}
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-slate-600" />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h4 className="font-semibold text-slate-900 mb-2 text-center">
                      {level.label}
                    </h4>
                    
                    {/* One sentence */}
                    <p className="text-sm text-slate-600 mb-4 text-center flex-1">
                      {level.description}
                    </p>
                    
                    {/* Chips (max 2) */}
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {level.chips.slice(0, 2).map((chip, chipIndex) => (
                        <Badge
                          key={chipIndex}
                          variant="outline"
                          className="bg-slate-50 text-slate-600 text-xs"
                        >
                          {chip}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Bottom line */}
                    <p className="text-xs text-slate-500 text-center border-t border-slate-100 pt-4">
                      When you get this
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
    </div>
  );
}

