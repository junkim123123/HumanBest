"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface LiteYouTubeEmbedProps {
  youtubeId: string;
  title: string;
  aspectRatio?: "16:9" | "4:3";
  className?: string;
}

/**
 * Lightweight YouTube embed that only loads the iframe on click.
 * Shows a thumbnail with play button initially to avoid heavy iframe load.
 */
export function LiteYouTubeEmbed({
  youtubeId,
  title,
  aspectRatio = "16:9",
  className = "",
}: LiteYouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  const handleClick = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleThumbnailError = useCallback(() => {
    setThumbnailError(true);
  }, []);

  // Calculate padding for aspect ratio
  const paddingBottom = aspectRatio === "16:9" ? "56.25%" : "75%";

  // YouTube thumbnail URLs - use hqdefault as fallback since not all videos have maxresdefault
  const thumbnailUrl = thumbnailError
    ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
    : `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;

  if (isLoaded) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-black ${className}`}
        style={{ paddingBottom }}
      >
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative w-full overflow-hidden rounded-xl bg-slate-900 cursor-pointer ${className}`}
      style={{ paddingBottom }}
      aria-label={`Play video: ${title}`}
    >
      {/* Thumbnail */}
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={handleThumbnailError}
        unoptimized={thumbnailError}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
          <Play className="h-6 w-6 text-slate-900 ml-1 sm:h-8 sm:w-8" fill="currentColor" />
        </div>
      </div>
    </button>
  );
}
