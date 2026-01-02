// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

interface TemplateBlockProps {
  title: string;
  helperText: string;
  template: string;
  onCopy?: () => void;
}

export function TemplateBlock({ title, helperText, template, onCopy }: TemplateBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy();
  };

  return (
    <Card className="p-6 rounded-2xl border border-slate-200 h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600">{helperText}</p>
      </div>
      <div className="bg-slate-50 rounded-lg p-4 mb-4 max-h-[400px] overflow-y-auto" data-inner-scroll="true">
        <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
          {template}
        </pre>
      </div>
      <Button
        variant="outline"
        size="lg"
        onClick={handleCopy}
        className="w-full h-11"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </>
        )}
      </Button>
    </Card>
  );
}


