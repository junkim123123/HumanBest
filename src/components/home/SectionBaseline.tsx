"use client";

import * as React from "react";
import { forwardRef, useState } from "react";
import Link from "next/link";
import { RangeBar } from "@/components/ui/range-bar";
import { useShelfPrice } from "@/contexts/ShelfPriceContext";
import { DecisionCard } from "@/components/marketing/home/DecisionCard";

interface SectionBaselineProps {
  isActive?: boolean;
}

function formatMoney(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPct(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

// Top highlight line helper
function TopHighlight() {
  return (
    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
  );
}

// Retail price input field - compact version for card header
function ShelfPriceInput(props: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const { value, onChange } = props;

  return (
    <div className="w-full max-w-[180px]">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label htmlFor="shelf-price-input" className="text-xs font-medium text-slate-600">
          Retail price
        </label>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 tabular-nums text-sm">
          $
        </span>
        <input
          id="shelf-price-input"
          inputMode="decimal"
          value={value !== null && value > 0 ? value : ""}
          onChange={(e) => {
            const val = e.target.value ? parseFloat(e.target.value) : null;
            onChange(val && val > 0 ? val : null);
          }}
          className="h-10 w-full rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur pl-6 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white tabular-nums transition-all"
          placeholder="0.00"
          aria-label="Retail price in dollars"
          aria-describedby="shelf-price-description"
        />
      </div>
      <p id="shelf-price-description" className="sr-only">
        Enter your retail price to calculate margin estimates
      </p>
    </div>
  );
}

// Metric row component for the right panel
function MetricRow(props: {
  title: string;
  typical: number;
  min: number;
  max: number;
  domainMin?: number;
  domainMax?: number;
}) {
  const { title, typical, min, max, domainMin = 0, domainMax = Math.max(max * 1.35, typical * 1.35, 1) } = props;

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-0.5 text-xs text-slate-500">Market range</div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">Typical</div>
          <div className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900">
            ${formatMoney(typical)}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">Range</div>
          <div className="text-xs font-medium tabular-nums text-slate-700">
            Range ${formatMoney(min)}–${formatMoney(max)}
          </div>
        </div>

        <div className="mt-2">
          <RangeBar
            min={min}
            max={max}
            domainMin={domainMin}
            domainMax={domainMax}
            marker={typical}
          />
        </div>
      </div>
    </div>
  );
}

export const SectionBaseline = forwardRef<HTMLElement, SectionBaselineProps>(
  ({ isActive = false }, ref) => {
    const { shelfPrice, setShelfPrice } = useShelfPrice();
    const [showDetails, setShowDetails] = useState(false);

    // Delivered cost range values
    const deliveredTypical = 2.44;
    const deliveredMin = 2.22;
    const deliveredMax = 2.66;

    // Factory price range values
    const factoryTypical = 0.8;
    const factoryMin = 0.75;
    const factoryMax = 0.85;

    // Calculate margin range and profit per unit
    const SAMPLE_SHELF_PRICE = 4.99;

    const costBreakdown = [
      { label: "Factory price", value: factoryTypical },
      { label: "Shipping", value: 1.2 },
      { label: "Import tax", value: 0.19 },
      { label: "Clearance fees", value: 0.08 },
    ];

    const shelfPriceNum = shelfPrice ?? 0;
    const hasShelfPrice =
      shelfPrice !== null && shelfPriceNum > 0 && Number.isFinite(shelfPriceNum);

    let displayShelfPrice = SAMPLE_SHELF_PRICE;
    if (hasShelfPrice) displayShelfPrice = shelfPriceNum;

    const isExample = !hasShelfPrice;

    const marginLow = ((displayShelfPrice - deliveredMax) / displayShelfPrice) * 100;
    const marginHigh = ((displayShelfPrice - deliveredMin) / displayShelfPrice) * 100;

    const profitLow = displayShelfPrice - deliveredMax;
    const profitHigh = displayShelfPrice - deliveredMin;

    const marginMid = (marginLow + marginHigh) / 2;

    const handleClearPrice = () => setShelfPrice(null);

    return (
      <section
        id="estimate"
        className="slide-section bg-slate-50/50"
      >
        <div className="landing-slide-inner">
          {/* Header */}
          <div className="mb-5 lg:mb-6">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              ESTIMATE
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              A quick decision before the details
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              Enter your retail price to personalize margin and profit. We estimate delivered cost first, then you can verify when ready.
            </div>
          </div>

          <div className="mb-6">
            <DecisionCard
              retailPrice={hasShelfPrice ? shelfPriceNum : null}
              deliveredMin={deliveredMin}
              deliveredMax={deliveredMax}
              costBreakdown={costBreakdown}
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
            {/* Left col */}
            <div className="min-w-0 lg:col-span-7 lg:max-w-[700px]">
              {/* Margin summary card */}
              <div className="group relative h-full rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md">
                <TopHighlight />
                {/* Card header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      Margin summary
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Based on delivered cost range. Before overhead and sales tax.
                    </div>
                  </div>

                  {/* Retail price input */}
                  <div className="w-full sm:w-[260px]">
                    <div className="flex items-end gap-2 sm:justify-end">
                      <ShelfPriceInput
                        value={shelfPrice}
                        onChange={setShelfPrice}
                      />

                      {!isExample && (
                        <button
                          type="button"
                          onClick={handleClearPrice}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col p-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-500">
                            Estimated gross margin
                          </div>

                        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                          {formatPct(marginLow)}% to {formatPct(marginHigh)}%
                        </div>

                        <div className="mt-2 text-sm text-slate-600 tabular-nums">
                          Profit per unit ${formatMoney(profitLow)}–${formatMoney(profitHigh)}
                        </div>
                      </div>

                    </div>

                    <div className="mt-4">
                      <RangeBar
                        min={marginLow}
                        max={marginHigh}
                        domainMin={0}
                        domainMax={100}
                        marker={marginMid}
                      />
                    </div>

                    <div className="mt-3 text-xs text-slate-600">
                      {isExample
                        ? "Shown with a sample retail price. Enter yours to personalize."
                        : "Updates instantly when your retail price changes."}
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setShowDetails((v) => !v)}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        {showDetails ? "Hide details" : "Expand details"}
                      </button>
                      {showDetails && (
                        <div className="mt-2 text-xs text-slate-600 space-y-1">
                          <div>We combine factory, freight, duty, and fees to estimate delivered cost.</div>
                          <div>Proof when available. Assumptions are labeled when not.</div>
                          <div>Retail price personalizes gross margin and profit per unit.</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href="/signin?next=%2Fapp%2Fanalyze"
                          className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                        >
                          Get my estimate
                        </Link>
                      </div>

                      <Link
                        href="#adjust"
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-1 py-0.5 transition-colors"
                      >
                        Change shipping and size
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right col */}
            <div className="min-w-0 lg:col-span-5 lg:justify-self-end lg:max-w-[420px]">
              <div className="group h-full flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md">
                <TopHighlight />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Cost baseline</div>
                    <div className="mt-1 text-xs leading-5 text-slate-600">
                      Ranges update when we can match records
                    </div>
                  </div>
                </div>

                <div className="mt-4 divide-y divide-slate-100">
                  <MetricRow
                    title="Delivered cost per unit"
                    typical={deliveredTypical}
                    min={deliveredMin}
                    max={deliveredMax}
                    domainMax={Math.max(deliveredMax, deliveredTypical) * 1.35}
                  />

                  <MetricRow
                    title="Factory price per unit"
                    typical={factoryTypical}
                    min={factoryMin}
                    max={factoryMax}
                    domainMax={Math.max(factoryMax, factoryTypical) * 1.7}
                  />
                </div>

                <div className="mt-auto pt-3 text-xs leading-5 text-slate-500">
                  Supplier outreach starts within 12 hours; verified quotes arrive in about a week.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

SectionBaseline.displayName = "SectionBaseline";
