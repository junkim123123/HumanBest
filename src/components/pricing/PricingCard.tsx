"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface PricingCardProps {
  title: string;
  price: ReactNode;
  priceSubLine?: string;
  description: string;
  included: string[];
  cta: {
    label: string;
    href: string;
    variant?: "default" | "outline";
    onClick?: () => void;
  };
  badge?: string;
  slaLine?: string;
}

export function PricingCard({
  title,
  price,
  priceSubLine,
  description,
  included,
  cta,
  badge,
  slaLine,
}: PricingCardProps) {
  return (
    <Card className="p-4 md:p-6 bg-white/80 backdrop-blur border border-slate-200/80 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
        <div className="flex items-baseline gap-2 mb-2">
          <div className="text-3xl font-bold text-slate-900">{price}</div>
          {badge && (
            <Badge variant="outline" className="bg-gradient-to-br from-slate-50 to-blue-50 text-slate-600 text-xs border-slate-200/80 shadow-sm">
              {badge}
            </Badge>
          )}
        </div>
        {priceSubLine && (
          <p className="text-xs text-slate-500 mb-2">{priceSubLine}</p>
        )}
        {slaLine && (
          <p className="text-xs text-slate-500 mt-2">{slaLine}</p>
        )}
        <p className="text-sm text-slate-600 mt-3">{description}</p>
      </div>

      {/* Included list */}
      <div className="flex-1 mb-6">
        <ul className="space-y-2">
          {included.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div>
        {cta.onClick ? (
          <Button
            size="lg"
            variant={cta.variant || "default"}
            onClick={cta.onClick}
            className={`w-full h-12 transition-all duration-300 ${
              cta.variant === "outline"
                ? "border-slate-300 hover:bg-slate-50"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-200/50"
            }`}
          >
            {cta.label}
          </Button>
        ) : (
          <Button
            asChild
            size="lg"
            variant={cta.variant || "default"}
            className={`w-full h-12 transition-all duration-300 ${
              cta.variant === "outline"
                ? "border-slate-300 hover:bg-slate-50"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-200/50"
            }`}
          >
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

