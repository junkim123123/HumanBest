/**
 * Photo Categories Mapping
 * Maps Korean folder names to English labels for the photo taxonomy system.
 */

export interface PhotoCategory {
  key: string;
  label: string;
  description?: string;
}

/**
 * Mapping of folder names (which may be in Korean) to English labels.
 * Add new categories here as folders are created in public/product-photos/
 */
export const photoCategoryMap: Record<string, string> = {
  // Korean folder names → English labels
  "전자제품": "Electronics",
  "의류": "Apparel",
  "가방": "Bags",
  "신발": "Footwear",
  "악세서리": "Accessories",
  "주방용품": "Kitchenware",
  "가구": "Furniture",
  "화장품": "Cosmetics",
  "완구": "Toys",
  "스포츠": "Sports",
  "자동차부품": "Auto Parts",
  "공구": "Tools",
  
  // English folder names (pass-through)
  "electronics": "Electronics",
  "apparel": "Apparel",
  "bags": "Bags",
  "footwear": "Footwear",
  "accessories": "Accessories",
  "kitchenware": "Kitchenware",
  "furniture": "Furniture",
  "cosmetics": "Cosmetics",
  "toys": "Toys",
  "sports": "Sports",
  "auto-parts": "Auto Parts",
  "tools": "Tools",
  "uncategorized": "Uncategorized",
};

/**
 * Get the English label for a folder name.
 * Falls back to the folder name itself if no mapping exists.
 */
export function getCategoryLabel(folderName: string): string {
  return photoCategoryMap[folderName] || folderName;
}

/**
 * Get all category keys (folder names) that have mappings.
 */
export function getAllCategoryKeys(): string[] {
  return Object.keys(photoCategoryMap);
}
