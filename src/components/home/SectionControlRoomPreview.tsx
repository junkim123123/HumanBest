"use client"

import React from "react"

export function SectionControlRoomPreview() {
  return (
    <div className="landing-container py-20 lg:py-28">
      {/* Header */}
      <div className="max-w-2xl">
        <h2 className="text-[32px] leading-[1.2] font-bold tracking-[-0.02em] text-slate-900 sm:text-[40px]">
          Update once, see cost and margin
        </h2>
        <p className="mt-4 text-[17px] leading-[1.6] text-slate-600">
          All inputs in one spot. Cost, margin, confidence update instantly.
        </p>
        <p className="mt-2 text-[14px] text-slate-500">
          Last good numbers stay visible while we recalc.
        </p>
      </div>

      {/* Control Room Preview */}
      <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          
          {/* Inputs Column */}
          <div>
            <div className="text-[12px] font-semibold tracking-wide text-slate-500 uppercase">Inputs</div>
            
            <div className="mt-5 space-y-4">
              {/* Retail Price */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div>
                  <div className="text-[14px] font-medium text-slate-900">Retail price <span className="text-slate-400">(optional)</span></div>
                  <div className="text-[13px] text-slate-500">Used for margin.</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-400">$</span>
                    <input
                      disabled
                      placeholder="0.00"
                      className="h-10 w-24 rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-3 text-right text-[14px] font-medium text-slate-900"
                    />
                  </div>
                  <button className="text-[13px] font-medium text-blue-600 hover:text-blue-700">Use sample</button>
                </div>
              </div>

              {/* Shipping Mode */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div>
                  <div className="text-[14px] font-medium text-slate-900">Shipping mode</div>
                  <div className="text-[13px] text-slate-500">Air faster, ocean cheaper.</div>
                </div>
                <div className="flex rounded-lg border border-slate-200 p-1">
                  <button className="h-8 rounded-md bg-slate-900 px-4 text-[13px] font-medium text-white">
                    Air
                  </button>
                  <button className="h-8 rounded-md px-4 text-[13px] font-medium text-slate-600 hover:text-slate-900">
                    Ocean
                  </button>
                </div>
              </div>

              {/* Size */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-medium text-slate-900">Size</div>
                    <div className="text-[13px] text-slate-500">Weight & volume per unit.</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-semibold text-slate-500">Weight</span>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900">
                        150
                      </div>
                      <span className="text-[12px] text-slate-600">g</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-semibold text-slate-500">Volume</span>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-medium text-slate-900">
                        0.0015
                      </div>
                      <span className="text-[12px] text-slate-600">m</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[13px] text-slate-500">Default</div>
              </div>
            </div>
          </div>

          {/* Outcomes Column */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-semibold tracking-wide text-slate-500 uppercase">OUTCOMES</div>
                <div className="text-[14px] font-medium text-slate-900">Delivered cost per unit</div>
              </div>
              <span className="text-[13px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">Needs proof</span>
            </div>
            <div className="mt-4">
              <div className="text-[40px] font-bold text-slate-900 tracking-tight">$2.22</div>
              <div className="text-[13px] text-slate-500">Range $2.22 to $2.66</div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[12px] font-semibold text-slate-500 uppercase">Margin and profit</div>
                <div className="text-[13px] text-slate-500">Add a retail price to see margin & profit.</div>
              </div>
              <button className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">Use sample price</button>
            </div>
            <div className="mt-6">
              <div className="text-[12px] font-semibold text-slate-500 uppercase">Confidence</div>
              <div className="mt-2 flex items-center gap-3">
                <button className="text-[13px] font-semibold text-blue-700 hover:text-blue-800">See evidence</button>
              </div>
              <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-600">
                Evidence 0/2
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
