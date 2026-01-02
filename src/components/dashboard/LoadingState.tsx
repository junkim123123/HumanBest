// @ts-nocheck
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Search, Globe, PackageCheck, TrendingUp, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";

const loadingSteps = [
  { 
    icon: Search, 
    title: "Analyzing product images", 
    description: "AI is extracting product details and specifications",
    duration: 3000 
  },
  { 
    icon: Globe, 
    title: "Tracking global supply chain", 
    description: "Scanning 10M+ import records for supplier matches",
    duration: 4000 
  },
  { 
    icon: PackageCheck, 
    title: "Calculating landed costs", 
    description: "Computing duties, tariffs, and shipping estimates",
    duration: 3000 
  },
  { 
    icon: TrendingUp, 
    title: "Generating insights", 
    description: "Preparing your comprehensive sourcing report",
    duration: 2000 
  },
];

const tips = [
  "💡 Tip: We analyze import records from the last 180 days for the most relevant suppliers",
  "💡 Tip: Our AI checks 6,000+ HS codes to find the most accurate tariff classification",
  "💡 Tip: Cost estimates update based on your order quantity and shipping preferences",
  "💡 Tip: We start outreach within 12 hours and share verified quotes in about a week",
  "💡 Tip: Save time by uploading clear photos with good lighting and minimal glare",
];

export function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    
    const totalDuration = loadingSteps.reduce((sum, step) => sum + step.duration, 0);
    const currentStepDuration = loadingSteps[currentStep].duration;
    
    // Progress animation within current step
    const progressInterval = 50;
    const progressIncrement = (100 / currentStepDuration) * progressInterval;
    
    progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + progressIncrement;
        return next >= 100 ? 100 : next;
      });
    }, progressInterval);

    // Move to next step
    stepTimer = setTimeout(() => {
      if (currentStep < loadingSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setProgress(0);
      }
    }, currentStepDuration);

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressTimer);
    };
  }, [currentStep]);

  // Rotate tips every 5 seconds
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);

    return () => clearInterval(tipTimer);
  }, []);

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center py-12 px-6 min-h-[500px]"
    >
      {/* Animated Icon with Glow Effect */}
      <div className="relative mb-8">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative"
        >
          {/* Glow effect */}
          <motion.div
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-electric-blue-400 to-purple-400 blur-2xl"
          />
          
          {/* Main icon circle */}
          <div className="relative rounded-full bg-gradient-to-br from-electric-blue-500 to-electric-blue-600 p-6 shadow-2xl">
            <Loader2 className="w-16 h-16 text-white" />
          </div>

          {/* Orbiting sparkles */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-6 h-6 text-amber-400" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 0.5 }}
            className="absolute inset-0"
          >
            <Sparkles className="absolute bottom-0 right-0 translate-x-2 translate-y-2 w-5 h-5 text-purple-400" />
          </motion.div>
        </motion.div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {loadingSteps.map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`h-2 rounded-full transition-all duration-500 ${
              index < currentStep 
                ? "w-8 bg-emerald-500" 
                : index === currentStep 
                ? "w-12 bg-electric-blue-500" 
                : "w-8 bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-3 mb-6 max-w-md"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-electric-blue-100">
              <CurrentIcon className="w-5 h-5 text-electric-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {loadingSteps[currentStep].title}
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {loadingSteps[currentStep].description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-electric-blue-500 via-electric-blue-600 to-purple-500 rounded-full relative overflow-hidden"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Shimmer effect */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>Step {currentStep + 1} of {loadingSteps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Rotating Tips */}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
          >
            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">
              {tips[currentTip]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtle background animation */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-electric-blue-400 to-purple-400 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-3xl"
        />
      </div>
    </motion.div>
  );
}

