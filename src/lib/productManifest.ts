import * as fs from "fs";
import * as path from "path";
import type { ProductItem } from "@/components/marketing/ProductGallery";

/**
 * Load product manifest from public folder.
 * For server-side use only.
 */
export function loadProductManifest(): ProductItem[] {
  try {
    const manifestPath = path.join(process.cwd(), "public", "product-photos", "photo-manifest.json");
    
    if (!fs.existsSync(manifestPath)) {
      console.warn("Photo manifest not found. Run: npx tsx scripts/generatePhotoManifest.ts");
      return [];
    }

    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content) as ProductItem[];
    
    return manifest;
  } catch (e) {
    console.error("Error loading product manifest:", e);
    return [];
  }
}

/**
 * Get a subset of products for showcase.
 */
export function getShowcaseProducts(count: number = 8): ProductItem[] {
  const all = loadProductManifest();
  // Shuffle and pick
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
