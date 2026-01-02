"use client"

import React from "react"

interface TrustStripProps {
  sectionId?: string
}

const trustItems = [
  "US customs data when matched",
  "Assumptions labeled when not matched",
  "Results in about 3 minutes",
  "Save and resume when signed in",
]

export default function TrustStrip({ sectionId = "trust" }: TrustStripProps) {
  return (
    <section
      id={sectionId}
      className="bg-white border-y border-slate-100"
      aria-label="Trust signals"
    >
      <div className="landing-slide-inner py-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
          {trustItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
