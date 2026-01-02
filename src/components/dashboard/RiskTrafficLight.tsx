// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { ImageAnalysisResult } from "@/lib/intelligence-pipeline";

interface RiskTrafficLightProps {
  analysis: ImageAnalysisResult;
}

interface RiskItem {
  label: string;
  status: "low" | "medium" | "high";
  description: string;
}

export function RiskTrafficLight({ analysis }: RiskTrafficLightProps) {
  const category = analysis.category?.toLowerCase() || "";
  const isToy = category.includes("toy") || category.includes("game");
  const isFood = category.includes("food") || category.includes("beverage");
  const isElectronics = category.includes("electronic") || category.includes("battery");

  const risks: RiskItem[] = [];

  // Toy-specific risks
  if (isToy) {
    risks.push(
      {
        label: "CPSIA Compliance",
        status: "high",
        description: "Children's product safety certification required",
      },
      {
        label: "ASTM F963",
        status: "high",
        description: "Toy safety standard compliance needed",
      },
      {
        label: "Small Parts Warning",
        status: "medium",
        description: "Choking hazard labeling may be required",
      }
    );
  }

  // Food-specific risks
  if (isFood) {
    risks.push(
      {
        label: "FDA Registration",
        status: "high",
        description: "Food facility registration required",
      },
      {
        label: "Labeling Requirements",
        status: "high",
        description: "Nutrition facts and allergen labeling needed",
      }
    );
  }

  // Electronics risks
  if (isElectronics) {
    risks.push(
      {
        label: "FCC Certification",
        status: "high",
        description: "Radio frequency compliance required",
      },
      {
        label: "Battery Safety",
        status: "medium",
        description: "Battery testing and labeling needed",
      }
    );
  }

  // General risks
  risks.push(
    {
      label: "Customs Classification",
      status: analysis.hsCode ? "low" : "medium",
      description: analysis.hsCode 
        ? "HS code identified"
        : "HS code needs confirmation",
    },
    {
      label: "IP Risk",
      status: "medium",
      description: "Intellectual property verification recommended",
    }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "low":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "high":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "bg-green-50 border-green-200";
      case "medium":
        return "bg-yellow-50 border-yellow-200";
      case "high":
        return "bg-red-50 border-red-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  if (risks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          Risk Checklist
        </h2>
      </div>

      <div className="space-y-3">
        {risks.map((risk, index) => (
          <div
            key={index}
            className={`border rounded-xl p-3 ${getStatusColor(risk.status)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(risk.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">
                    {risk.label}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-white text-slate-600 capitalize">
                    {risk.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{risk.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

