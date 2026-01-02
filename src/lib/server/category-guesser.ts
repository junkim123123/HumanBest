// @ts-nocheck
/**
 * Simple keyword-based category guesser for ImportKey data
 * Returns category family label (Food, Toys, Beauty, etc.)
 */

export type CategoryFamily = 
  | "Food"
  | "Toys"
  | "Beauty"
  | "Electronics"
  | "Home"
  | "Apparel"
  | "Industrial"
  | "Other";

/**
 * Guess category from product text using keyword matching
 */
export function guessCategoryFromText(text: string): CategoryFamily {
  if (!text || typeof text !== "string") {
    return "Other";
  }
  
  const textLower = text.toLowerCase();
  
  // Food: candy, snack, beverage, supplement, jelly, chocolate, etc.
  if (
    /(candy|snack|beverage|supplement|jelly|chocolate|food|drink|confectionery|cookie|biscuit|gum)/.test(textLower)
  ) {
    return "Food";
  }
  
  // Toys: toy, game, kids, plush, figure, etc.
  if (
    /(toy|game|kids|children|play|collectible|figure|novelty|plush|doll)/.test(textLower)
  ) {
    return "Toys";
  }
  
  // Beauty: cosmetic, skincare, makeup, etc.
  if (
    /(cosmetic|skincare|makeup|beauty|lotion|cream|serum|shampoo|perfume|lipstick)/.test(textLower)
  ) {
    return "Beauty";
  }
  
  // Electronics: electronic, charger, battery, etc.
  if (
    /(electronic|charger|battery|usb|led|bluetooth|device|tech|phone|tablet)/.test(textLower)
  ) {
    return "Electronics";
  }
  
  // Home: kitchen, decor, furniture, etc.
  if (
    /(kitchen|decor|furniture|home|household|chair|table|shelf|sofa|cabinet)/.test(textLower)
  ) {
    return "Home";
  }
  
  // Apparel: clothing, textile, etc.
  if (
    /(clothing|textile|apparel|garment|fabric|shirt|hoodie|pants|dress|cotton|polyester)/.test(textLower)
  ) {
    return "Apparel";
  }
  
  // Industrial: industrial, machinery, equipment, etc.
  if (
    /(industrial|machinery|equipment|parts|component|pipe|conduit|valve|fitting|steel|aluminum)/.test(textLower)
  ) {
    return "Industrial";
  }
  
  // Default
  return "Other";
}

