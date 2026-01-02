import { Metadata } from "next";
import { Check } from "lucide-react";
import { LiteYouTubeEmbed } from "@/components/marketing/LiteYouTubeEmbed";
import { VideoGrid } from "@/components/marketing/VideoGrid";
import { ProductGallery } from "@/components/marketing/ProductGallery";
import { proofVideos, getFeaturedVideo, formatDuration } from "@/content/proofVideos";
import { loadProductManifest } from "@/lib/productManifest";

export const metadata: Metadata = {
  title: "Proof | NexSupply",
  description: "Watch how we verify suppliers and costs in the field. Factory audits, customs data matching, and supplier outreach—all documented.",
};

export default function ProofPage() {
  const featuredVideo = getFeaturedVideo();
  const allVideos = proofVideos;
  const products = loadProductManifest();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Start Here */}
      <section id="proof-hero" className="border-b border-slate-100">
        <div className="container mx-auto px-4 py-10 lg:py-14">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-[28px] font-bold text-slate-900 sm:text-[32px] mb-2">Proof in action</h1>
            <p className="text-[15px] text-slate-600 mb-4">See how we verify products and attach evidence to your numbers</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-3">
              <a href="/verify" className="bg-slate-900 text-white rounded-full px-5 py-2 text-[15px] font-medium hover:bg-slate-800 transition-colors">Start verification</a>
              <a href="/analyze" className="bg-slate-100 text-slate-900 rounded-full px-5 py-2 text-[15px] font-medium border border-slate-200 hover:bg-slate-200 transition-colors">Run an estimate</a>
            </div>
            <p className="text-[13px] text-slate-500 mb-1">Most proof packs include photos, checklists, and supplier docs</p>
          </div>
        </div>
      </section>

      {/* Proof in Action - All Videos */}
      <section className="bg-slate-50/50">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
                Proof in action
              </h2>
              <p className="mt-2 text-[15px] text-slate-600">
                Watch our verification process across different scenarios
              </p>
            </div>

            {/* Video grid */}
            <VideoGrid videos={allVideos} columns={3} />
          </div>
        </div>
      </section>

      {/* Products Gallery */}
      {products.length > 0 && (
        <section id="products" className="border-t border-slate-100">
          <div className="container mx-auto px-4 py-12 lg:py-16">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="text-center mb-10">
                <h2 className="text-[24px] font-bold text-slate-900 sm:text-[28px]">
                  Products we've sourced
                </h2>
                <p className="mt-2 text-[15px] text-slate-600">
                  {products.length} products from verified factories
                </p>
              </div>

              {/* Gallery */}
              <ProductGallery products={products} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
