// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, Clock } from "lucide-react";

const verificationItems = [
  {
    title: "Verify Exporter vs Forwarder",
    description: "Confirm whether it's an actual manufacturer or a logistics intermediary",
  },
  {
    title: "Verify Actual Manufacturing",
    description: "Confirm factory ownership and production capacity",
  },
  {
    title: "Verify MOQ and Lead Time",
    description: "Confirm minimum order quantity and actual delivery timeline",
  },
  {
    title: "Sample Availability",
    description: "Confirm product sample availability and sample costs",
  },
  {
    title: "Labeling and Certification Requirements",
    description: "Confirm required certifications and labeling specifications",
  },
  {
    title: "Quality Control Process",
    description: "Confirm QC procedures and inspection standards",
  },
];

export function VerificationCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-sm border border-blue-200 p-6"
    >
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-blue-600 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-slate-900">
              24-Hour Verification Service
            </h3>
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
              Free
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Our expert managers verify suppliers and narrow down to 3 confirmed options
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {verificationItems.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-blue-100"
          >
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900 mb-0.5">
                {item.title}
              </div>
              <div className="text-xs text-slate-600">{item.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-4 bg-white/80 rounded-xl border border-blue-200">
        <Clock className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">
            What You'll Receive After Verification
          </div>
          <div className="text-xs text-slate-600 mt-1">
            3 verified suppliers, accurate quotes, sample plan, compliance checklist
          </div>
        </div>
      </div>
    </motion.div>
  );
}

