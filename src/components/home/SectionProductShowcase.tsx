"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export interface ProductShowcaseItem {
  slug: string;
  displayName: string;
  images: string[];
}

interface SectionProductShowcaseProps {
  products: ProductShowcaseItem[];
}

// Case study data with measurable outcomes
const caseStudies = [
  {
    image: "/products/sample-candy.jpg",
    category: "Confectionery",
    outcome: "Estimated $0.42 saved per unit",
    description: "Matched to import record. 3 quotes received.",
  },
  {
    image: "/products/sample-toy.jpg",
    category: "Toys",
    outcome: "Lead time cut by 2 weeks",
    description: "Matched to customs-verified supplier.",
  },
  {
    image: "/products/sample-snack.jpg",
    category: "Snacks",
    outcome: "3 vetted quotes in 5 days",
    description: "Full compliance checklist included.",
  },
];

/**
 * Case studies section showing measurable outcomes.
 */
export function SectionProductShowcase({ products }: SectionProductShowcaseProps) {
  // Use actual product images if available, otherwise show case studies
  const displayProducts = products.slice(0, 3);
  const hasRealProducts = displayProducts.length >= 3;

  return (
    <div className="landing-container py-12 lg:py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
            Products we've sourced
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">
            Real products. Measurable results.
          </p>
        </div>

        {/* Case study cards - 3 columns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {hasRealProducts ? (
            displayProducts.map((product, idx) => (
              <div
                key={product.slug}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-slate-100">
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.displayName}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                {/* Content */}
                <div className="p-4">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {caseStudies[idx]?.category || "Product"}
                  </span>
                  <p className="mt-1 text-[14px] font-semibold text-slate-900">
                    {caseStudies[idx]?.outcome || "Verified sourcing"}
                  </p>
                  <p className="mt-1.5 text-[13px] text-slate-600 line-clamp-2">
                    {product.displayName}
                  </p>
                </div>
              </div>
            ))
          ) : (
            caseStudies.map((study, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* Placeholder image */}
                <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center">
                  <div className="text-[13px] text-slate-400">Product image</div>
                </div>
                {/* Content */}
                <div className="p-4">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {study.category}
                  </span>
                  <p className="mt-1 text-[14px] font-semibold text-slate-900">
                    {study.outcome}
                  </p>
                  <p className="mt-1.5 text-[13px] text-slate-600 line-clamp-2">
                    {study.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Link to full gallery */}
        <div className="mt-6 text-center">
          <Link
            href="/proof#products"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            See all products
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
