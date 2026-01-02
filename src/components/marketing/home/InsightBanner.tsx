"use client"

import React from "react"

interface InsightBannerProps {
  shippingMode: "Air" | "Ocean"
  biggestDriver?: "Shipping" | "Factory" | "Other"
  emptyPrice?: boolean
}

export function InsightBanner({ shippingMode, biggestDriver = "Other", emptyPrice = false }: InsightBannerProps) {
  const modeLine = shippingMode === "Air"
    ? "Ocean is slower but can lower cost per unit."
    : "Air is faster but usually increases cost per unit."

  let driverLine = "This estimate will tighten when we find proof."
  if (biggestDriver === "Shipping") driverLine = "Shipping is the biggest driver right now."
  if (biggestDriver === "Factory") driverLine = "Factory price is the biggest driver right now."

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Quick insight</div>
      <div className="mt-2 text-sm text-slate-800">{modeLine}</div>
      <div className="mt-1 text-sm text-slate-700">{driverLine}</div>
      {emptyPrice ? (
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Enter a retail price to see margin and profit.
        </div>
      ) : null}
    </div>
  )
}
