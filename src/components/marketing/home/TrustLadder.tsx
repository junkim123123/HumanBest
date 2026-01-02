"use client"

import React, { useState } from "react"

interface Step {
  title: string
  description: string
  bullets: string[]
  ctaLabel: string
  onClick?: () => void
}

const steps: Step[] = [
  {
    title: "Quick estimate",
    description: "Fast range for go no go decisions.",
    bullets: [
      "Delivered cost range with confidence",
      "Assumptions clearly labeled",
      "Instant margin checks",
    ],
    ctaLabel: "Run estimate",
  },
  {
    title: "Customs proof when found",
    description: "Real shipment unit prices when a match is found.",
    bullets: [
      "Shipment unit prices confirmed",
      "HS codes and record links included",
      "Higher confidence in baseline",
    ],
    ctaLabel: "View sample record",
    onClick: () => window.open("/reports/sample", "_blank"),
  },
  {
    title: "Verified quotes",
    description: "Confirm price, MOQ, lead time, and compliance.",
    bullets: [
      "Up to 3 supplier options",
      "MOQ and lead time confirmed",
      "Compliance checklist included",
    ],
    ctaLabel: "Start verification",
    onClick: () => {
      const el = document.getElementById("verify-pricing")
      if (el) el.scrollIntoView({ behavior: "smooth" })
    },
  },
]

export function TrustLadder() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const open = openIndex === idx
        return (
          <div
            key={step.title}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                <p className="mt-1 text-sm text-slate-700 leading-6">{step.description}</p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-blue-700 hover:underline"
                onClick={() => setOpenIndex(open ? null : idx)}
              >
                {open ? "Hide details" : "Expand details"}
              </button>
            </div>

            {open ? (
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                {step.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-4">
              <button
                type="button"
                onClick={step.onClick}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
              >
                {step.ctaLabel}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
