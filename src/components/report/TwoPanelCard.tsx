// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";

interface TwoPanelCardProps {
  leftTitle: string;
  leftContent: React.ReactNode;
  rightTitle: string;
  rightContent: React.ReactNode;
}

export function TwoPanelCard({
  leftTitle,
  leftContent,
  rightTitle,
  rightContent,
}: TwoPanelCardProps) {
  return (
    <Card className="p-8 rounded-2xl border border-slate-200 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Panel */}
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-6">{leftTitle}</h3>
          {leftContent}
        </div>

        {/* Right Panel */}
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-6">{rightTitle}</h3>
          {rightContent}
        </div>
      </div>
    </Card>
  );
}


