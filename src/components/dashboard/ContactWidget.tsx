// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, X, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContactWidgetProps {
  analysisData?: {
    id?: string;
    productName?: string;
    landedCost?: number;
    category?: string;
    genericCategory?: string;
  };
}

export function ContactWidget({ analysisData }: ContactWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const whatsappNumber = "13146577892"; // US country code 1 included (314-657-7892)

  useEffect(() => {
    // Appears naturally 2 seconds after analysis results
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleWhatsAppClick = async () => {
    if (!analysisData) return;

    try {
      // 1. Trigger report to server (for CTO email notification)
      await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysisId: analysisData.id,
          productName: analysisData.productName,
          landedCost: analysisData.landedCost,
          category: analysisData.genericCategory || analysisData.category,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to send contact report:", error);
      // Continue even if report fails
    }

    // 2. Generate WhatsApp message (Professional Business Tone)
    const landedCost = analysisData.landedCost?.toFixed(2) || "N/A";
    const category = analysisData.genericCategory || analysisData.category || "product";

    const message = `Hi NexSupply Team. I reviewed the analysis for ${analysisData.productName || "a product"}. Please verify the best supplier candidates and confirm unit price, MOQ, and lead time. Reference ${analysisData.id || "N/A"}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodedMessage}`,
      "_blank"
    );
  };

  if (!analysisData) return null;

  const marginMultiplier = analysisData.landedCost
    ? ((analysisData.landedCost * 2) / analysisData.landedCost).toFixed(1)
    : "2.0";

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border-2 border-green-500 overflow-hidden"
          >
            <div className="p-6 relative">
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close widget"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-tight">
                  Sourcing expert available
                </span>
              </div>

              <h4 className="text-slate-900 font-extrabold text-xl leading-tight mb-2">
                Get a real factory quote
              </h4>
              <p className="text-sm text-slate-600 mb-6">
                This page shows market estimates. We can verify suppliers and confirm unit price, MOQ, and lead time.
              </p>

              <button
                onClick={handleWhatsAppClick}
                className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-green-500 text-white rounded-xl text-lg font-bold hover:bg-green-600 shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle size={22} /> Chat on WhatsApp
              </button>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Share this analysis and get next steps.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-green-600 transition-colors"
      >
        <MessageCircle size={28} />
      </motion.button>
    </div>
  );
}

