// @ts-nocheck
// ============================================================================
// Marketing Deck Sections Data
// ============================================================================

import { VERIFICATION_SLA_MARKETING_LABEL } from "@/lib/constants/sla";

export interface DeckSection {
  id: string;
  headline: string;
  subcopy?: string;
  cta?: {
    label: string;
    href: string;
  };
  videoUrl?: string;
  component?: "upload" | "baseline" | "assumptions" | "evidence" | "verification" | "cta";
}

export const DECK_SECTIONS: DeckSection[] = [
  {
    id: "upload",
    headline: "Upload a photo",
    subcopy: "Baseline in minutes",
    component: "upload",
  },
  {
    id: "baseline",
    headline: "Baseline first",
    subcopy: "Market ranges from LLM and category signals",
    component: "baseline",
  },
  {
    id: "assumptions",
    headline: "Change one assumption, watch the stack move",
    subcopy: "Interactive cost breakdown updates instantly",
    component: "assumptions",
    videoUrl: "https://www.youtube.com/embed/placeholder", // Replace with actual video
  },
  {
    id: "evidence",
    headline: "Evidence when available",
    subcopy: "Evidence is attached only when found",
    component: "evidence",
  },
  {
    id: "verification",
    headline: `Verified quotes ${VERIFICATION_SLA_MARKETING_LABEL}`,
    subcopy: "3 factories verified, confirmed numbers returned",
    component: "verification",
  },
  {
    id: "cta",
    headline: "Start a project",
    subcopy: "After verification, we coordinate with factories and manage your order",
    component: "cta",
  },
];

