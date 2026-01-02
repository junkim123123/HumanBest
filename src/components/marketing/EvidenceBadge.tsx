"use client"

import React from "react"

interface EvidenceBadgeProps {
  status: "verified" | "assumption" | "needs-proof"
}

export default function EvidenceBadge({ status }: EvidenceBadgeProps) {
  const copy = {
    verified: { label: "Evidence attached", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    assumption: { label: "Assumptions labeled", tone: "bg-amber-50 text-amber-700 border-amber-100" },
    "needs-proof": { label: "Needs proof", tone: "bg-slate-50 text-slate-700 border-slate-200" },
  }[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${copy.tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {copy.label}
    </span>
  )
}
