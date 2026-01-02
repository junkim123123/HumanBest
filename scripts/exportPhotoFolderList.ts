/**
 * Export Photo Folder List Script
 * 
 * Scans public/product-photos for subfolders and generates/updates
 * src/content/photoNameMap.ts with all folder names as keys.
 * 
 * Usage: npx tsx scripts/exportPhotoFolderList.ts
 */

import * as fs from "fs";
import * as path from "path";

const PRODUCT_PHOTOS_DIR = path.join(process.cwd(), "public", "product-photos");
const OUTPUT_FILE = path.join(process.cwd(), "src", "content", "photoNameMap.ts");

function scanFolders(): string[] {
  const folders: string[] = [];

  if (!fs.existsSync(PRODUCT_PHOTOS_DIR)) {
    console.log(`Directory does not exist: ${PRODUCT_PHOTOS_DIR}`);
    console.log("Creating directory...");
    fs.mkdirSync(PRODUCT_PHOTOS_DIR, { recursive: true });
    return folders;
  }

  const items = fs.readdirSync(PRODUCT_PHOTOS_DIR, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      folders.push(item.name);
    }
  }

  return folders.sort();
}

function loadExistingMap(): Record<string, string> {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return {};
  }

  try {
    const content = fs.readFileSync(OUTPUT_FILE, "utf-8");
    // Extract the object from the file using regex
    const match = content.match(/export const photoNameMap[^=]*=\s*({[\s\S]*?});/);
    if (match) {
      // Parse the object (this is a simple approach, works for simple objects)
      const objStr = match[1]
        .replace(/\/\/[^\n]*/g, "") // Remove comments
        .replace(/,\s*}/g, "}"); // Remove trailing commas
      
      // Use Function constructor to safely evaluate the object
      // eslint-disable-next-line no-new-func
      const obj = new Function(`return ${objStr}`)();
      return obj;
    }
  } catch (e) {
    console.warn("Could not parse existing photoNameMap.ts, starting fresh");
  }

  return {};
}

function generateFileContent(map: Record<string, string>): string {
  const entries = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      // Escape quotes in keys and values
      const escapedKey = key.replace(/"/g, '\\"');
      const escapedValue = value.replace(/"/g, '\\"');
      return `  "${escapedKey}": "${escapedValue}",`;
    })
    .join("\n");

  return `/**
 * Photo Name Map
 * 
 * Maps folder names (which may be Korean) to English display names.
 * Keys are the actual folder names under public/product-photos/.
 * Values are the English display names shown in the UI.
 * 
 * To regenerate this file, run:
 *   npx tsx scripts/exportPhotoFolderList.ts
 * 
 * Auto-generated: ${new Date().toISOString()}
 */

export const photoNameMap: Record<string, string> = {
${entries}
};

/**
 * Get the display name for a folder.
 * Returns the mapped English name if available, otherwise returns the folder name as-is.
 */
export function getDisplayName(folderName: string): string {
  return photoNameMap[folderName] || folderName;
}

/**
 * Generate a stable URL-safe slug from a folder name.
 * For ASCII-only names, returns a slugified version.
 * For non-ASCII names (Korean, etc.), returns "p-" + 8-char hash for stability.
 */
export function getSlug(folderName: string): string {
  // Check if folder name contains non-ASCII characters
  const hasNonAscii = /[^\\x00-\\x7F]/.test(folderName);
  
  if (hasNonAscii) {
    // Generate stable hash for non-ASCII names
    const hash = stableHash(folderName);
    return \`p-\${hash.slice(0, 8)}\`;
  }
  
  // For ASCII names, create a simple slug
  return folderName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a stable hash string from input.
 * Uses a simple but stable hashing algorithm.
 */
function stableHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive hex string
  const positiveHash = (hash >>> 0).toString(16);
  // Pad to ensure minimum length and add extra entropy
  const extended = positiveHash + Math.abs(hash).toString(16);
  return extended.slice(0, 8);
}
`;
}

function main() {
  console.log("📁 Exporting photo folder list...\n");
  console.log(`Scanning: ${PRODUCT_PHOTOS_DIR}`);

  const folders = scanFolders();
  console.log(`Found ${folders.length} folders`);

  // Load existing map to preserve manual translations
  const existingMap = loadExistingMap();
  console.log(`Existing mappings: ${Object.keys(existingMap).length}`);

  // Merge: keep existing mappings, add new folders with default value
  const mergedMap: Record<string, string> = { ...existingMap };
  let newCount = 0;

  for (const folder of folders) {
    if (!(folder in mergedMap)) {
      // Default: use folder name as display name (to be translated manually)
      mergedMap[folder] = folder;
      newCount++;
    }
  }

  // Remove mappings for folders that no longer exist
  let removedCount = 0;
  for (const key of Object.keys(mergedMap)) {
    if (!folders.includes(key)) {
      delete mergedMap[key];
      removedCount++;
    }
  }

  // Write the file
  const content = generateFileContent(mergedMap);
  fs.writeFileSync(OUTPUT_FILE, content, "utf-8");

  console.log(`\n✅ Updated: ${OUTPUT_FILE}`);
  console.log(`   Total folders: ${folders.length}`);
  console.log(`   New entries added: ${newCount}`);
  console.log(`   Stale entries removed: ${removedCount}`);

  if (newCount > 0) {
    console.log("\n💡 New folders added with default names.");
    console.log("   Edit photoNameMap.ts to add English translations.");
  }

  // Show folders needing translation (Korean names)
  const needsTranslation = folders.filter((f) => /[^\x00-\x7F]/.test(f) && mergedMap[f] === f);
  if (needsTranslation.length > 0) {
    console.log(`\n📝 Folders needing English translation (${needsTranslation.length}):`);
    needsTranslation.slice(0, 10).forEach((f) => console.log(`   - "${f}"`));
    if (needsTranslation.length > 10) {
      console.log(`   ... and ${needsTranslation.length - 10} more`);
    }
  }
}

main();
