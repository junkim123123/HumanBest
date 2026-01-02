"use client"

import React from "react"

interface ReceiptItem {
  label: string
  amount: string
  type?: "normal" | "savings" | "total"
  helper?: string
}

function ReceiptCard({ 
  title, 
  items, 
  badge,
  variant = "default" 
}: { 
  title: string
  items: ReceiptItem[]
  badge?: string
  variant?: "default" | "highlight"
}) {
  return (
    <div className={`rounded-xl border p-5 ${
      variant === "highlight" 
        ? "border-slate-900 bg-white" 
        : "border-slate-200 bg-slate-50"
    }`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {badge && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-0">
        {items.map((item, i) => (
          <div key={item.label}>
            <div 
              className={`flex items-center justify-between py-2.5 ${
                i !== items.length - 1 ? "border-b border-slate-200" : ""
              }`}
            >
              <span className={`text-[13px] ${
                item.type === "savings" 
                  ? "font-medium text-emerald-600" 
                  : item.type === "total"
                  ? "font-semibold text-slate-900"
                  : "text-slate-600"
              }`}>
                {item.label}
              </span>
              <span className={`text-[13px] tabular-nums ${
                item.type === "savings" 
                  ? "font-medium text-emerald-600" 
                  : item.type === "total"
                  ? "font-semibold text-slate-900"
                  : "font-medium text-slate-900"
              }`}>
                {item.amount}
              </span>
            </div>
            {item.helper && (
              <p className="pb-2.5 text-[11px] text-slate-400 -mt-1">{item.helper}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReceiptCompare() {
  const asIs: ReceiptItem[] = [
    { label: "Factory + freight", amount: "$3.16" },
    { label: "Import duties", amount: "$0.22" },
    { label: "Clearance & fees", amount: "$0.12" },
    { label: "Risk buffer", amount: "$0.30", helper: "Buffer covers variance until verified" },
    { label: "Total delivered", amount: "$3.80", type: "total" },
  ]

  const withNexSupply: ReceiptItem[] = [
    { label: "Factory + freight", amount: "$2.66" },
    { label: "Import duties", amount: "$0.19" },
    { label: "Clearance & fees", amount: "$0.08" },
    { label: "Verified savings", amount: "-$0.27", type: "savings" },
    { label: "Total delivered", amount: "$2.66", type: "total" },
  ]

  return (
    <div className="landing-container py-14 lg:py-18">
      {/* Header */}
      <div className="max-w-2xl">
        <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.02em] text-slate-900 sm:text-[32px]">
          See the impact on the receipt
        </h2>
        <p className="mt-3 text-[15px] leading-[1.6] text-slate-600">
          Side-by-side receipts with real line items and clear delivered totals.
        </p>
      </div>

      {/* Receipt Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
        <ReceiptCard title="As is" items={asIs} />
        <ReceiptCard title="With NexSupply" items={withNexSupply} badge="Potential savings" variant="highlight" />
      </div>
    </div>
  )
}
