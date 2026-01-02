"use client"

import React, { useMemo } from "react"

interface DecisionCardProps {
  retailPrice: number | null
  deliveredMin: number
  deliveredMax: number
  costBreakdown?: Array<{ label: string; value: number }>
}

type DecisionState = "neutral" | "likely" | "tight" | "not-worth-it"

function formatPct(n: number) {
  if (!Number.isFinite(n)) return "0.0%"
  return `${n.toFixed(1)}%`
}

function pickInsight(costBreakdown?: Array<{ label: string; value: number }>) {
  if (!costBreakdown || !costBreakdown.length) return "This estimate will tighten when we find proof."
  const biggest = costBreakdown.reduce((max, c) => (c.value > max.value ? c : max), costBreakdown[0])
  if (biggest.label.toLowerCase().includes("shipping")) {
    return "Most of your cost is freight. Ocean saves the most."
  }
  if (biggest.label.toLowerCase().includes("factory")) {
    return "Factory price drives most of the cost right now."
  }
  return "This estimate will tighten when we find proof."
}

export function DecisionCard({ retailPrice, deliveredMin, deliveredMax, costBreakdown }: DecisionCardProps) {
  const { state, title, message, insight } = useMemo(() => {
    if (!retailPrice || retailPrice <= 0 || !Number.isFinite(retailPrice)) {
      return {
        state: "neutral" as DecisionState,
        title: "Enter your retail price",
        message: "Enter your retail price to personalize margin and profit.",
        insight: pickInsight(costBreakdown),
      }
    }

    const marginLow = ((retailPrice - deliveredMax) / retailPrice) * 100
    const marginHigh = ((retailPrice - deliveredMin) / retailPrice) * 100

    let state: DecisionState = "neutral"
    if (marginLow >= 35) state = "likely"
    else if (marginLow >= 20) state = "tight"
    else state = "not-worth-it"

    let title = ""
    if (state === "likely") title = "Likely profitable"
    if (state === "tight") title = "Tight margin"
    if (state === "not-worth-it") title = "Not worth it yet"

    const msg = `At $${retailPrice.toFixed(2)} retail, you likely land around ${formatPct(marginLow)} to ${formatPct(marginHigh)} gross margin.`

    return {
      state,
      title,
      message: msg,
      insight: pickInsight(costBreakdown),
    }
  }, [retailPrice, deliveredMin, deliveredMax, costBreakdown])

  const stateStyles: Record<DecisionState, string> = {
    neutral: "border-slate-200 bg-white",
    likely: "border-emerald-200 bg-emerald-50/70",
    tight: "border-amber-200 bg-amber-50/70",
    "not-worth-it": "border-rose-200 bg-rose-50/70",
  }

  const badgeStyles: Record<DecisionState, string> = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    likely: "bg-emerald-100 text-emerald-800 border-emerald-200",
    tight: "bg-amber-100 text-amber-800 border-amber-200",
    "not-worth-it": "bg-rose-100 text-rose-800 border-rose-200",
  }

  return (
    <div className={`rounded-2xl border ${stateStyles[state]} p-4 shadow-sm transition-all duration-200`}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyles[state]}`}>
            {state === "neutral" ? "Enter retail price" : "Decision"}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-700 leading-6">{message}</p>
        </div>
        <div className="text-xs text-slate-500">About 3 minutes</div>
      </div>
      <div className="mt-3 rounded-xl bg-white/70 border border-slate-200 px-3 py-2 text-sm text-slate-700">
        {insight}
      </div>
    </div>
  )
}
