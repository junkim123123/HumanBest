"use client"

import React from "react"
import { Upload, Calculator, FileCheck } from "lucide-react"

const steps = [
  {
    icon: Upload,
    number: 1,
    title: "Upload product, barcode, and label",
    desc: "We identify the product and pull available data.",
  },
  {
    icon: Calculator,
    number: 2,
    title: "Get landed cost range",
    desc: "Add retail price to see margin.",
  },
  {
    icon: FileCheck,
    number: 3,
    title: "Verify with real quotes",
    desc: "Lock in pricing with vetted suppliers.",
  },
]

const timeline = [
  { label: "Estimate in minutes" },
  { label: "Outreach within 12 hours" },
  { label: "3 quotes in about a week" },
]

export default function TrustSection() {
  return (
    <div className="landing-container py-12 lg:py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <h2 className="text-[24px] font-bold text-center text-slate-900 sm:text-[28px]">
          How it works
        </h2>

        {/* Steps - 3 columns */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-[13px] font-semibold">
                  {step.number}
                </div>
                <step.icon className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1.5 text-[13px] text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Timeline row */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {timeline.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[13px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
