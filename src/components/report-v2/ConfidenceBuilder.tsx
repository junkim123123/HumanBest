"use client";

import type { Report } from "@/lib/report/types";
import ExtractionSummary from "./ExtractionSummary";

interface ConfidenceBuilderProps {
  report: Report;
}

export default function ConfidenceBuilder({ report }: ConfidenceBuilderProps) {
  return <ExtractionSummary report={report} />;
}
