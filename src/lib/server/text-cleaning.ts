// @ts-nocheck
/**
 * Text cleaning utilities for ImportKey data ingestion
 * Removes logistics tokens, container patterns, and normalizes product text
 */

/**
 * Clean supplier or buyer name by splitting on "|" and extracting name part
 */
export function cleanSupplierName(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  
  // Split by "|" if present
  const parts = raw.split("|").map(p => p.trim()).filter(p => p.length > 0);
  
  // Take first part as name (usually the name, rest is address)
  const name = parts[0] || raw.trim();
  
  // Collapse whitespace
  return name.replace(/\s+/g, " ").trim();
}

/**
 * Clean product text by removing logistics tokens and container patterns
 * Returns first meaningful phrase for product_name (max 120 chars)
 */
export function cleanProductText(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  
  let cleaned = raw.trim();
  
  // Remove container number patterns (4 letters + 7 digits, e.g., TCNU1234567)
  cleaned = cleaned.replace(/\b[A-Z]{4}\d{7}\b/g, "");
  
  // Remove common logistics tokens (case-insensitive)
  const logisticsTokens = [
    /\bHBL\b/gi,
    /\bSEAL\b/gi,
    /\bVOYAGE\b/gi,
    /\bVESSEL\b/gi,
    /\bBOOKING\b/gi,
    /\bCONTAINER\b/gi,
    /\bCARTON\s*\d+\b/gi,
    /\bCTN\s*\d+\b/gi,
    /\bPKG\s*\d+\b/gi,
    /\bPCS\s*\d+\b/gi,
    /\bPALLET\b/gi,
    /\bSHIPMENT\b/gi,
    /\bFREIGHT\b/gi,
    /\bCARGO\b/gi,
    /\bMANIFEST\b/gi,
  ];
  
  for (const pattern of logisticsTokens) {
    cleaned = cleaned.replace(pattern, "");
  }
  
  // Remove long digit blocks (likely container numbers, weights, etc.)
  // Keep short numbers (1-3 digits) as they might be quantities
  cleaned = cleaned.replace(/\b\d{4,}\b/g, "");
  
  // Remove special characters except letters, numbers, spaces, and basic punctuation
  cleaned = cleaned.replace(/[^\w\s.,-]/g, " ");
  
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  // Extract first meaningful phrase (split by common delimiters)
  const phrases = cleaned.split(/[.,;]/).map(p => p.trim()).filter(p => p.length > 0);
  const firstPhrase = phrases[0] || cleaned;
  
  // Cap length to 120 characters for product_name
  if (firstPhrase.length > 120) {
    return firstPhrase.substring(0, 117) + "...";
  }
  
  return firstPhrase;
}

/**
 * Create a longer cleaned version for product_description (up to 800 chars)
 */
export function cleanProductDescription(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  
  let cleaned = raw.trim();
  
  // Less aggressive cleaning for description - keep more context
  // Just remove obvious container patterns
  cleaned = cleaned.replace(/\b[A-Z]{4}\d{7}\b/g, "");
  
  // Remove only the most obvious logistics tokens
  cleaned = cleaned.replace(/\b(HBL|SEAL|VOYAGE|VESSEL|BOOKING)\b/gi, "");
  
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  // Cap length to 800 characters
  if (cleaned.length > 800) {
    cleaned = cleaned.substring(0, 797) + "...";
  }
  
  return cleaned;
}

