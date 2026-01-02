"use client";

import { AnalyzeForm, type AnalyzeFormMode } from "@/components/analyze/AnalyzeForm";

interface AnalyzePageProps {
  mode: AnalyzeFormMode;
}

export function AnalyzePage({ mode }: AnalyzePageProps) {
  return (
    <div className="min-h-[calc(100vh-var(--topbar-h))] bg-white">
      <div className="container mx-auto px-4 py-10 lg:py-16 max-w-6xl">
        <AnalyzeForm mode={mode} />
      </div>
    </div>
  );
}
