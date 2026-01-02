/**
 * Generate Photo Manifest Script
 * 
 * Scans public/product-photos for image files and generates a JSON manifest
 * with category information derived from folder names (supports Korean names).
 * 
 * Usage: npx tsx scripts/generatePhotoManifest.ts
 */

import * as fs from "fs";
import * as path from "path";
import { getDisplayName, getSlug } from "../src/content/photoNameMap";

interface PhotoManifestEntry {
  id: string;
  folderName: string;
  displayName: string;
  slug: string;
  images: string[];
}

const PRODUCT_PHOTOS_DIR = path.join(process.cwd(), "public", "product-photos");
const OUTPUT_FILE = path.join(process.cwd(), "public", "product-photos", "photo-manifest.json");
const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Generate a stable hash for an ID based on folder + filename.
 */
function generateId(folderName: string, fileName: string): string {
  const input = `${folderName}/${fileName}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = (hash >>> 0).toString(16).padStart(8, "0");
  return `photo_${hashStr}`;
}

function scanDirectory(dir: string): PhotoManifestEntry[] {
  const entries: PhotoManifestEntry[] = [];

  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    console.log("Creating directory structure...");
    fs.mkdirSync(dir, { recursive: true });
    return entries;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (!item.isDirectory()) continue;

    const folderName = item.name;
    const folderPath = path.join(dir, folderName);
    
    // Skip if it's a special folder
    if (folderName.startsWith(".") || folderName === "node_modules") continue;

    // Get display name and slug
    const displayName = getDisplayName(folderName);
    const slug = getSlug(folderName);

    // Scan for images in this folder
    const images = scanImagesInFolder(folderPath, folderName);

    if (images.length > 0) {
      entries.push({
        id: generateId(folderName, "folder"),
        folderName,
        displayName,
        slug,
        images,
      });
    }
  }

  return entries;
}

function scanImagesInFolder(folderPath: string, folderName: string): string[] {
  const images: string[] = [];

  try {
    const items = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const item of items) {
      if (!item.isFile()) continue;

      const ext = path.extname(item.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        // Use forward slashes for web paths, keep original folder name
        const webPath = `/product-photos/${encodeURIComponent(folderName)}/${encodeURIComponent(item.name)}`;
        images.push(webPath);
      }
    }
  } catch (e) {
    console.warn(`Could not read folder: ${folderPath}`);
  }

  return images.sort();
}

function main() {
  console.log("📸 Generating photo manifest...\n");
  console.log(`Scanning: ${PRODUCT_PHOTOS_DIR}`);

  const manifest = scanDirectory(PRODUCT_PHOTOS_DIR);

  // Sort by display name
  manifest.sort((a, b) => a.displayName.localeCompare(b.displayName));

  // Write manifest
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`\n✅ Manifest generated: ${OUTPUT_FILE}`);
  console.log(`   Total products: ${manifest.length}`);
  console.log(`   Total images: ${manifest.reduce((sum, m) => sum + m.images.length, 0)}`);

  // Show products with Korean names
  const koreanNames = manifest.filter((m) => /[^\x00-\x7F]/.test(m.folderName));
  if (koreanNames.length > 0) {
    console.log(`\n🇰🇷 Korean folder names (${koreanNames.length}):`);
    koreanNames.slice(0, 5).forEach((m) => {
      console.log(`   - "${m.folderName}" → display: "${m.displayName}", slug: "${m.slug}"`);
    });
    if (koreanNames.length > 5) {
      console.log(`   ... and ${koreanNames.length - 5} more`);
    }
  }
}

main();
