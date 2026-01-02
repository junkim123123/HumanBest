"use client"

import React from "react"

type Item = {
  id: string
  label: string
}

const TOOLTIP_TEXTS: Record<string, string> = {
  upload: "Upload a product",
  baseline: "Get a cost range",
  adjust: "Test margin drivers",
  evidence: "See proof when available",
  verify: "Start outreach in 12 hours",
  pricing: "Plans and fees",
  faq: "Quick answers",
}

export default function HomeDotNav({
  items,
  activeId,
  onJump,
}: {
  items: Item[]
  activeId: string
  onJump: (id: string) => void
}) {
  // Only render if there are 2 or more sections
  if (items.length < 2) {
    return null
  }

  return (
    <nav
      className="fixed right-4 top-1/2 z-50 -translate-y-1/2 overflow-visible"
      aria-label="Section navigation"
    >
      <div className="flex flex-col items-end gap-2.5">
        {items.map((it) => {
          const active = it.id === activeId
          const tooltipText = TOOLTIP_TEXTS[it.id] || it.label
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onJump(it.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onJump(it.id)
                }
              }}
              className="group relative flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-full p-1"
              aria-label={tooltipText}
              aria-current={active ? "true" : "false"}
            >
              {/* Glow effect for active dot */}
              {active && (
                <span 
                  className="absolute inset-0 rounded-full bg-blue-500/20 blur-md animate-pulse"
                  aria-hidden="true"
                />
              )}
              <span
                className={[
                  "relative inline-flex items-center justify-center rounded-full",
                  "transition-all duration-300 ease-out",
                  active 
                    ? "h-2.5 w-2.5 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50" 
                    : "h-1.5 w-1.5 bg-slate-300 group-hover:bg-slate-400 group-hover:scale-125",
                  "motion-reduce:transition-none",
                ].join(" ")}
                aria-hidden="true"
              />
              <span
                className={[
                  "absolute right-full mr-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-white/95 backdrop-blur border border-slate-200 whitespace-nowrap shadow-xl",
                  "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-events-none",
                  "transition-all duration-200 ease-out",
                  "group-hover:translate-x-0 translate-x-2",
                  "motion-reduce:transition-none",
                ].join(" ")}
              >
                {tooltipText}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}


