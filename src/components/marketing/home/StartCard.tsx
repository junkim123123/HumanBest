"use client"

import React from "react"

interface StartCardProps {
  className?: string
}

const steps = [
  {
    title: "Step 1",
    text: "Upload a product photo",
  },
  {
    title: "Step 2",
    text: "Enter retail price (optional)",
  },
  {
    title: "Step 3",
    text: "Get a go / no-go snapshot",
  },
]

const reassurances = [
  "About 3 minutes",
  "No credit card",
  "Assumptions labeled when no proof",
]

export function StartCard({ className = "" }: StartCardProps) {
  return (
    <div
      className={[
        "relative rounded-3xl border border-slate-200/80 bg-white/85 backdrop-blur shadow-lg",
        "px-5 py-5 lg:px-6 lg:py-6",
        "transition-all duration-200 hover:-translate-y-[2px] hover:shadow-xl",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50" />
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-blue-700">Start here</div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">Illustration</span>
      </div>

      <h3 className="mt-2 text-lg font-semibold text-slate-900">Start here</h3>
      <p className="mt-1 text-sm text-slate-600">Follow three simple steps to see if the margin works.</p>

      <ol className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.title} className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-3 shadow-sm">
            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-xl bg-blue-50 text-blue-700 font-semibold flex items-center justify-center border border-blue-100">
              {step.title.replace("Step ", "")}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{step.title}</div>
              <div className="text-sm font-semibold text-slate-900">{step.text}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
        {reassurances.map((line) => (
          <div
            key={line}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center shadow-sm"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}
