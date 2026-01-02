/**
 * Migrate Photo Folders Script (Optional)
 * 
 * Renames Korean folder names to English slugs under public/product-photos.
 * This is an optional one-time migration - the site works fine without it.
 * 
 * Usage: npx tsx scripts/migratePhotoFolders.ts
 * 
 * WARNING: This will rename folders. Make a backup first!
 */

import * as fs from "fs";
import * as path from "path";
import { photoNameMap, getSlug } from "../src/content/photoNameMap";

const PRODUCT_PHOTOS_DIR = path.join(process.cwd(), "public", "product-photos");
const DRY_RUN = process.argv.includes("--dry-run");

interface RenameOperation {
  from: string;
  to: string;
  fromPath: string;
  toPath: string;
}

function getAvailableName(basePath: string, desiredName: string): string {
  let candidate = desiredName;
  let counter = 1;

  while (fs.existsSync(path.join(basePath, candidate))) {
    counter++;
    candidate = `${desiredName}-${counter}`;
  }

  return candidate;
}

function planRenames(): RenameOperation[] {
  const operations: RenameOperation[] = [];

  if (!fs.existsSync(PRODUCT_PHOTOS_DIR)) {
    console.log(`Directory does not exist: ${PRODUCT_PHOTOS_DIR}`);
    return operations;
  }

  const items = fs.readdirSync(PRODUCT_PHOTOS_DIR, { withFileTypes: true });
  const existingNames = new Set(items.map((i) => i.name));

  for (const item of items) {
    if (!item.isDirectory()) continue;

    const folderName = item.name;
    
    // Skip if already ASCII-only (no need to rename)
    if (!/[^\x00-\x7F]/.test(folderName)) continue;

    // Get the target slug
    let targetName: string;
    
    // Check if there's a custom English name in the map
    const mappedName = photoNameMap[folderName];
    if (mappedName && mappedName !== folderName && !/[^\x00-\x7F]/.test(mappedName)) {
      // Use the mapped English name as the base for the slug
      targetName = mappedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    } else {
      // Fall back to hash-based slug
      targetName = getSlug(folderName);
    }

    // Skip if target equals source (shouldn't happen, but safety check)
    if (targetName === folderName) continue;

    // Handle collisions
    const fromPath = path.join(PRODUCT_PHOTOS_DIR, folderName);
    let finalName = targetName;
    
    // Check if target already exists (and it's not our source being renamed)
    if (existingNames.has(targetName) && targetName !== folderName) {
      finalName = getAvailableName(PRODUCT_PHOTOS_DIR, targetName);
    }

    const toPath = path.join(PRODUCT_PHOTOS_DIR, finalName);

    operations.push({
      from: folderName,
      to: finalName,
      fromPath,
      toPath,
    });

    // Track the new name to handle subsequent collisions
    existingNames.delete(folderName);
    existingNames.add(finalName);
  }

  return operations;
}

function executeRenames(operations: RenameOperation[]): void {
  let successCount = 0;
  let errorCount = 0;

  for (const op of operations) {
    try {
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would rename: "${op.from}" → "${op.to}"`);
      } else {
        fs.renameSync(op.fromPath, op.toPath);
        console.log(`  ✓ Renamed: "${op.from}" → "${op.to}"`);
      }
      successCount++;
    } catch (e) {
      console.error(`  ✗ Failed: "${op.from}" → "${op.to}"`);
      console.error(`    Error: ${e instanceof Error ? e.message : String(e)}`);
      errorCount++;
    }
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Summary:`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${errorCount}`);
}

function updatePhotoNameMap(operations: RenameOperation[]): void {
  if (DRY_RUN || operations.length === 0) return;

  const mapPath = path.join(process.cwd(), "src", "content", "photoNameMap.ts");
  
  if (!fs.existsSync(mapPath)) {
    console.log("\n⚠️  Could not find photoNameMap.ts to update");
    return;
  }

  let content = fs.readFileSync(mapPath, "utf-8");

  // Update the map: replace old folder names with new ones
  for (const op of operations) {
    // Replace the key in the map
    const oldKeyPattern = new RegExp(`"${escapeRegex(op.from)}":\\s*"`, "g");
    content = content.replace(oldKeyPattern, `"${op.to}": "`);
  }

  fs.writeFileSync(mapPath, content, "utf-8");
  console.log(`\n✅ Updated photoNameMap.ts with new folder names`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function main() {
  console.log("🔄 Photo Folder Migration Script\n");
  
  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("⚠️  This will rename folders in public/product-photos/");
    console.log("   Run with --dry-run first to preview changes.\n");
  }

  console.log(`Scanning: ${PRODUCT_PHOTOS_DIR}\n`);

  const operations = planRenames();

  if (operations.length === 0) {
    console.log("✅ No folders need renaming. All folder names are already ASCII.");
    return;
  }

  console.log(`Found ${operations.length} folder(s) to rename:\n`);
  executeRenames(operations);

  if (!DRY_RUN) {
    updatePhotoNameMap(operations);
    
    console.log("\n📸 Remember to regenerate the manifest:");
    console.log("   npx tsx scripts/generatePhotoManifest.ts");
  }
}

main();
