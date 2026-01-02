// @ts-nocheck
/**
 * Noise Token Removal Utility
 * 
 * Removes character names, franchise/brand tokens, and marketing fluff that harm
 * supplier search recall. Examples:
 * - "Doraemon" (character) → removed for search
 * - "Pokemon" (franchise) → removed for search
 * - "Disney" (brand) → removed for search
 * - "authentic" (marketing) → removed for search
 * 
 * Strategy: Identify and remove noisy tokens while preserving at least one functional
 * token (e.g., "fan", "handheld", "portable") for fallback search. Tokens are removed
 * from search queries but original product names are preserved for display.
 */

/**
 * Character/Franchise/Celebrity names that are noise tokens
 * These are famous characters, franchises, and brands that appear as product descriptions
 * but don't indicate supplier matching capability
 * 
 * Format: lowercase tokens to match against lowercased search terms
 */
const CHARACTER_TOKENS = new Set([
  // Disney properties
  "disney", "mickey", "minnie", "donald", "goofy",
  
  // Pokemon franchise
  "pokemon", "pikachu", "charizard", "blastoise", "venusaur",
  
  // Hello Kitty / Sanrio
  "hello kitty", "kitty", "sanrio",
  
  // Anime/Manga characters
  "doraemon", "dora", "totoro", "spirited", "ghibli",
  "naruto", "sasuke", "ichigo", "bleach", "dragonball",
  "dbz", "one piece", "luffy", "naruto", "boruto",
  
  // Marvel/DC
  "spiderman", "batman", "superman", "ironman", "captain america",
  "avengers", "xmen", "marvel", "dc comics",
  
  // Video game characters
  "mario", "luigi", "sonic", "zelda", "link", "pikachu",
  
  // Other popular characters
  "transformer", "barbie", "elmo", "sesame", "winnie",
  "frozen", "elsa", "anna", "moana", "lion king",
]);

/**
 * Marketing fluff words that indicate generic/promotional products
 * rather than specific supplier capability
 */
const MARKETING_FLUFF = new Set([
  "official", "authentic", "genuine", "original", "official licensed",
  "cute", "kawaii", "adorable", "lovely", "sweet",
  "cartoon", "animated", "toy", "collectible", "replica",
  "gift", "souvenir", "merchandise", "novelty",
  "fancy", "pretty", "beautiful", "amazing", "awesome",
  "premium", "deluxe", "special", "limited", "exclusive",
]);

/**
 * Generic brand modifiers that don't indicate manufacturing capability
 */
const BRAND_MODIFIERS = new Set([
  "brand new", "unopened", "sealed", "boxed",
  "licensed", "official", "authentic",
  "high quality", "quality", "excellent",
]);

/**
 * Functional stopwords - meaningless connector/count words that add noise
 * These improve search recall by reducing query noise for character-branded products
 */
const FUNCTIONAL_STOPWORDS = new Set([
  "with", "set", "kit", "pack", "pcs", "pc", "count", "piece", "pieces",
  "bunch", "bunch", "bag", "box", "case", "unit", "lot",
]);

/**
 * Category-specific noise (e.g., "toy" in toy products is noise, "fan" in fan products is not)
 * These are contextual - only considered noise in their respective categories
 */
const CATEGORY_NOISE = {
  toy: new Set(["toy", "toys", "doll", "game", "action"]),
  electronics: new Set(["electronic", "electrical", "device", "gadget"]),
  decoration: new Set(["decoration", "decor", "ornament", "display"]),
};

/**
 * Remove noise tokens from a search query
 * 
 * Strategy:
 * 1. Tokenize the query
 * 2. Filter out character names, marketing fluff, and brand modifiers
 * 3. Ensure at least one functional token remains (avoid empty results)
 * 4. Return filtered tokens
 * 
 * @param query - The search query (e.g., "Pokemon Doraemon mini fan")
 * @param category - Optional product category for context-aware filtering
 * @returns Filtered tokens and removal metadata
 */
export function removeNoiseTokens(
  query: string,
  category?: string
): {
  originalTokens: string[];
  filteredTokens: string[];
  removedTokens: string[];
  hadNoiseRemoval: boolean;
} {
  if (!query || typeof query !== "string") {
    return {
      originalTokens: [],
      filteredTokens: [],
      removedTokens: [],
      hadNoiseRemoval: false,
    };
  }

  // Tokenize: lowercase, remove special chars, split on whitespace
  const originalTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2); // Min 2 chars

  // Filter out noise tokens
  const removedTokens: string[] = [];
  const filteredTokens = originalTokens.filter((token) => {
    // Check if token is noise
    const isCharacter = CHARACTER_TOKENS.has(token);
    const isMarketing = MARKETING_FLUFF.has(token);
    const isBrandMod = BRAND_MODIFIERS.has(token);
    const isStopword = FUNCTIONAL_STOPWORDS.has(token);
    const isCategoryNoise =
      category && CATEGORY_NOISE[category as keyof typeof CATEGORY_NOISE]?.has(token);

    if (isCharacter || isMarketing || isBrandMod || isStopword || isCategoryNoise) {
      removedTokens.push(token);
      return false; // Filter out
    }

    return true; // Keep
  });

  // Safety: if all tokens were removed, restore original (to avoid empty search)
  // This prevents "Pokemon fan" from becoming empty
  const finalTokens = filteredTokens.length > 0 ? filteredTokens : originalTokens;

  return {
    originalTokens,
    filteredTokens: finalTokens,
    removedTokens,
    hadNoiseRemoval: removedTokens.length > 0,
  };
}

/**
 * Check if a single token is a noise token
 * Useful for pre-filtering individual terms
 * 
 * @param token - Single token to check (e.g., "pokemon", "cute", "official")
 * @returns true if token should be filtered out
 */
export function isNoiseToken(token: string): boolean {
  const t = (token || "").toLowerCase().trim();
  return (
    CHARACTER_TOKENS.has(t) ||
    MARKETING_FLUFF.has(t) ||
    BRAND_MODIFIERS.has(t)
  );
}

/**
 * Expand character token lookups for multi-word characters
 * Needed because some character names are multi-word (e.g., "hello kitty")
 * This checks for partial matches in multi-word tokens
 */
export function containsCharacterToken(query: string): boolean {
  const q = (query || "").toLowerCase();
  // Check exact tokens
  for (const char of CHARACTER_TOKENS) {
    if (q.includes(char)) {
      return true;
    }
  }
  return false;
}

/**
 * Add custom noise tokens (for tuning based on logs)
 * Call this at runtime to extend the noise token list
 * 
 * @param tokens - Array of tokens to add as noise
 * @param category - Optional category to add to (defaults to global)
 */
export function addNoiseTokens(tokens: string[], category?: string): void {
  const normalized = tokens.map((t) => (t || "").toLowerCase().trim()).filter(Boolean);

  if (category && category in CATEGORY_NOISE) {
    normalized.forEach((t) =>
      CATEGORY_NOISE[category as keyof typeof CATEGORY_NOISE].add(t)
    );
  } else {
    // Add to global fluff (safer default)
    normalized.forEach((t) => MARKETING_FLUFF.add(t));
  }
}

/**
 * Get current noise token counts for debugging
 */
export function getNoiseTokenStats(): {
  characterTokens: number;
  marketingFluff: number;
  brandModifiers: number;
  categoryNoise: Record<string, number>;
} {
  return {
    characterTokens: CHARACTER_TOKENS.size,
    marketingFluff: MARKETING_FLUFF.size,
    brandModifiers: BRAND_MODIFIERS.size,
    categoryNoise: {
      toy: CATEGORY_NOISE.toy.size,
      electronics: CATEGORY_NOISE.electronics.size,
      decoration: CATEGORY_NOISE.decoration.size,
    },
  };
}
