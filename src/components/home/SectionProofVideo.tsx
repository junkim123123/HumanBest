"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { LiteYouTubeEmbed } from "@/components/marketing/LiteYouTubeEmbed";
import { getFeaturedVideo, formatDuration } from "@/content/proofVideos";

// Outcome-focused bullets (not process)
const outcomes = [
  "Photo-documented factory checks",
  "Customs data cross-checked",
  "3 vetted quotes delivered",
];

export function SectionProofVideo() {
  const featuredVideo = getFeaturedVideo();

  if (!featuredVideo) return null;

  return (
    <div className="landing-container py-12 lg:py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h2 className="text-[24px] font-bold text-center text-slate-900 sm:text-[28px]">
          Watch how we verify in the field
        </h2>

        {/* Video + bullets layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Video embed */}
          <div className="lg:col-span-3">
            <LiteYouTubeEmbed
              youtubeId={featuredVideo.youtubeId}
              title={featuredVideo.title}
            />
            <p className="mt-2 text-[12px] text-slate-500">
              {featuredVideo.title} · {formatDuration(featuredVideo.durationSeconds)}
            </p>
          </div>

          {/* Outcome bullets */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <ul className="space-y-3">
              {outcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-[14px] text-slate-700">{outcome}</span>
                </li>
              ))}
            </ul>

            {/* Link to all videos */}
            <Link
              href="/proof"
              className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              See all proof videos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
