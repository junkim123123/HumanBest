import { VideoCard } from "./VideoCard";
import type { ProofVideo } from "@/content/proofVideos";

interface VideoGridProps {
  videos: ProofVideo[];
  columns?: 2 | 3;
}

/**
 * Grid layout for displaying multiple video cards.
 */
export function VideoGrid({ videos, columns = 3 }: VideoGridProps) {
  const gridCols = columns === 2 
    ? "grid-cols-1 sm:grid-cols-2" 
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid gap-6 ${gridCols}`}>
      {videos.map((video) => (
        <VideoCard key={video.slug} video={video} />
      ))}
    </div>
  );
}
