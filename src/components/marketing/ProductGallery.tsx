"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface ProductItem {
  folderName: string;
  displayName: string;
  slug: string;
  images: string[];
}

interface ProductGalleryProps {
  products: ProductItem[];
}

export function ProductGallery({ products }: ProductGalleryProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (product: ProductItem) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
  };

  const closeLightbox = () => {
    setSelectedProduct(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (!selectedProduct) return;
    setCurrentImageIndex((prev) =>
      prev < selectedProduct.images.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    if (!selectedProduct) return;
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : selectedProduct.images.length - 1
    );
  };

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((product) => (
          <button
            key={product.slug}
            type="button"
            onClick={() => openLightbox(product)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt={product.displayName}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            )}
            {/* Overlay with name */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-[13px] font-medium text-white line-clamp-2">
                {product.displayName}
              </p>
              {product.images.length > 1 && (
                <p className="text-[11px] text-white/70">
                  {product.images.length} photos
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-900 sm:aspect-[4/3]">
              <Image
                src={selectedProduct.images[currentImageIndex]}
                alt={`${selectedProduct.displayName} - Image ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-contain"
                priority
              />

              {/* Navigation arrows */}
              {selectedProduct.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Caption */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-white">
                {selectedProduct.displayName}
              </h3>
              {selectedProduct.images.length > 1 && (
                <p className="mt-1 text-sm text-white/60">
                  {currentImageIndex + 1} / {selectedProduct.images.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
