"use client";

import { CheckCircle2 } from "lucide-react";

export function TrustBar() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span>Sign in to save your estimate</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span>Free baseline range</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span>Verify with real supplier quotes</span>
      </div>
    </div>
  );
}

