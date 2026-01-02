// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { TrendingUp, Package, Shield, AlertTriangle } from "lucide-react";

interface CostDriverCardProps {
  category?: string;
}

const defaultDrivers = [
  {
    icon: Package,
    title: "Packaging and Printing",
    items: [
      "Individual packaging costs",
      "Box specifications and materials",
      "Logo printing method (silkscreen, sticker, etc.)",
      "Labeling and instruction manual",
    ],
  },
  {
    icon: TrendingUp,
    title: "Materials and Component Count",
    items: [
      "Main material types and thickness",
      "Component count and complexity",
      "Customization level",
      "Color and design changes",
    ],
  },
  {
    icon: Shield,
    title: "Certification and Customs Risk",
    items: [
      "Required certifications (ASTM, CPSIA, FDA, etc.)",
      "Labeling requirements",
      "Customs documentation preparation",
      "Quality inspection costs",
    ],
  },
];

const categorySpecificDrivers: Record<string, any[]> = {
  "Confectionery & Sweets": [
    {
      icon: AlertTriangle,
      title: "Food Regulations",
      items: [
        "FDA Prior Notice",
        "Food labeling (allergens, nutrition facts)",
        "Food contact safety certification",
        "Storage and shelf life management",
      ],
    },
  ],
  "Toys": [
    {
      icon: Shield,
      title: "Toy Safety Standards",
      items: [
        "ASTM F963 (US)",
        "CPSIA (Consumer Product Safety)",
        "Small parts warning",
        "Age-appropriate safety standards",
      ],
    },
  ],
};

export function CostDriverCard({ category }: CostDriverCardProps) {
  const categoryDrivers = category && categorySpecificDrivers[category]
    ? categorySpecificDrivers[category]
    : [];
  const allDrivers = [...defaultDrivers, ...categoryDrivers];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6"
    >
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-xl">
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Cost Drivers
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Key factors that influence the price range for this product
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allDrivers.map((driver, index) => {
          const Icon = driver.icon;
          return (
            <div
              key={index}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-slate-600" />
                <h4 className="text-sm font-semibold text-slate-900">
                  {driver.title}
                </h4>
              </div>
              <ul className="space-y-1.5">
                {driver.items.map((item: any, itemIndex: number) => (
                  <li
                    key={itemIndex}
                    className="text-xs text-slate-600 flex items-start gap-2"
                  >
                    <span className="text-slate-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          💡 Clarifying these factors will help you get more accurate quotes.
        </p>
      </div>
    </motion.div>
  );
}

