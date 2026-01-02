/**
 * Unified Gemini Vision and Text Inference Helper
 * 
 * All Gemini API calls should use this module to ensure:
 * - Consistent API key handling (GEMINI_API_KEY or GOOGLE_API_KEY)
 * - Proper error handling and fallbacks
 * - Server-side only execution
 * - Request logging for debugging
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

let CACHED_MODEL_NAME: string | null = null;

/**
 * Get working Gemini model with automatic fallback
 * Tries gemini-1.5-flash-latest first, then tries known alternatives
 */
async function getWorkingModel(genAI: GoogleGenerativeAI, requestId?: string): Promise<string> {
  // Return cached model if already found
  if (CACHED_MODEL_NAME) {
    return CACHED_MODEL_NAME;
  }

  // List of models to try in order (2.5 flash, then 2.5 flash lite, then older fallbacks)
  const modelsToTry = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-pro",
    "gemini-1.0-pro"
  ];

  for (const modelName of modelsToTry) {
    try {
      const testModel = genAI.getGenerativeModel({ model: modelName });
      // Test with a simple prompt
      await testModel.generateContent("test");
      CACHED_MODEL_NAME = modelName;
      console.log(`[Gemini ${requestId || ""}] Using model: ${modelName}`);
      return modelName;
    } catch (error: any) {
      console.warn(`[Gemini ${requestId || ""}] Model ${modelName} failed, trying next...`);
      continue;
    }
  }
  
  // Final fallback - use first in list even if it fails
  CACHED_MODEL_NAME = modelsToTry[0];
  console.warn(`[Gemini ${requestId || ""}] All models failed, using default: ${CACHED_MODEL_NAME}`);
  return CACHED_MODEL_NAME;
}

/**
 * Safely extract base64 data from data URL
 * Throws error if format is invalid
 */
function extractBase64(dataUrl: string | null | undefined): string {
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("Invalid data URL: null or not a string");
  }
  const parts = dataUrl.split(",");
  if (parts.length < 2) {
    throw new Error("Invalid data URL format: missing comma separator");
  }
  return parts[1];
}

/**
 * Get Gemini API key from environment
 * Checks both GEMINI_API_KEY and GOOGLE_API_KEY
 */
function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

/**
 * Create Gemini client with proper error handling
 * Logs key presence and model for debugging
 */
export function createGeminiClient(requestId?: string): GoogleGenerativeAI | null {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    console.error(`[Gemini ${requestId || ""}] No API key found. Set GEMINI_API_KEY or GOOGLE_API_KEY.`);
    return null;
  }
  
  console.log(`[Gemini ${requestId || ""}] API key present`);
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Extract structured label fields using Gemini Vision
 */
export async function extractLabelWithVision(
  labelImageDataUrl: string,
  requestId?: string
): Promise<{
  success: boolean;
  labelDraft?: {
    originCountryDraft: { value: string | null; confidence: number; evidenceSnippet: string; source: "VISION" };
    netWeightDraft: { value: string | null; confidence: number; evidenceSnippet: string; source: "VISION" };
    allergensDraft: { value: string[] | null; confidence: number; evidenceSnippet: string; source: "VISION" };
    brandDraft: { value: string | null; confidence: number; evidenceSnippet: string; source: "VISION" };
    productNameDraft: { value: string | null; confidence: number; evidenceSnippet: string; source: "VISION" };
  };
  error?: string;
}> {
  const genAI = createGeminiClient(requestId);
  
  if (!genAI) {
    return {
      success: false,
      error: "Gemini API key not configured",
    };
  }

  try {
    const modelName = await getWorkingModel(genAI, requestId);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Analyze this product label image and extract structured information. Return ONLY valid JSON:

{
  "originCountryDraft": {"value": "string or null (ISO country)", "confidence": 0.0-1.0, "evidenceSnippet": "quoted text max 50 chars"},
  "netWeightDraft": {"value": "string or null (e.g., 500g, 12 oz)", "confidence": 0.0-1.0, "evidenceSnippet": "quoted text"},
  "allergensDraft": {"value": ["array", "of", "strings"] or null, "confidence": 0.0-1.0, "evidenceSnippet": "quoted text"},
  "brandDraft": {"value": "string or null", "confidence": 0.0-1.0, "evidenceSnippet": "quoted text"},
  "productNameDraft": {"value": "string or null", "confidence": 0.0-1.0, "evidenceSnippet": "quoted text"}
}

Rules:
- confidence: 1.0 = clearly visible, 0.7-0.9 = partially visible, 0.3-0.6 = unclear, 0.0-0.2 = not found
- evidenceSnippet: quote exact text from label (max 50 chars) or "Not visible"
- For originCountryDraft: look for "Product of", "Made in", "Country of Origin"
- For allergensDraft: extract allergen warnings or null if none
- Return ONLY valid JSON, no markdown`;

    const imagePart = {
      inlineData: {
        data: extractBase64(labelImageDataUrl),
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    let jsonText = responseText.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonText);
    
    // Add source to each field
    const labelDraft = {
      originCountryDraft: { ...parsed.originCountryDraft, source: "VISION" as const },
      netWeightDraft: { ...parsed.netWeightDraft, source: "VISION" as const },
      allergensDraft: { ...parsed.allergensDraft, source: "VISION" as const },
      brandDraft: { ...parsed.brandDraft, source: "VISION" as const },
      productNameDraft: { ...parsed.productNameDraft, source: "VISION" as const },
    };

    return { success: true, labelDraft };
  } catch (error: any) {
    console.error(`[Gemini ${requestId || ""}] Label extraction failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Extract barcode digits from image
 */
export async function extractBarcodeWithVision(
  barcodeImageDataUrl: string,
  requestId?: string
): Promise<{
  success: boolean;
  barcodeDraft?: { value: string | null; confidence: number; evidenceSnippet: string; source: "VISION" };
  error?: string;
}> {
  const genAI = createGeminiClient(requestId);
  
  if (!genAI) {
    return { success: false, error: "Gemini API key not configured" };
  }

  try {
    const modelName = await getWorkingModel(genAI, requestId);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Extract the barcode number from this image. Return ONLY valid JSON:

{
  "value": "string (barcode digits) or null",
  "confidence": 0.0-1.0,
  "evidenceSnippet": "description of barcode visibility"
}

Rules:
- confidence: 1.0 = all digits clear, 0.7-0.9 = mostly clear, 0.3-0.6 = damaged, 0.0-0.2 = can't read
- If unreadable, set value to null
- Return ONLY valid JSON`;

    const imagePart = {
      inlineData: {
        data: extractBase64(barcodeImageDataUrl),
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    let jsonText = responseText.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonText);

    return {
      success: true,
      barcodeDraft: { ...parsed, source: "VISION" as const },
    };
  } catch (error: any) {
    console.error(`[Gemini ${requestId || ""}] Barcode extraction failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Infer unit weight from product photo
 */
export async function inferUnitWeightFromPhoto(
  productImageDataUrl: string,
  labelImageDataUrl?: string,
  requestId?: string
): Promise<{
  success: boolean;
  weightDraft?: { value: number; unit: string; confidence: number; evidenceSnippet: string; source: "VISION" };
  error?: string;
}> {
  const genAI = createGeminiClient(requestId);
  
  if (!genAI) {
    return { success: false, error: "Gemini API key not configured" };
  }

  try {
    const modelName = await getWorkingModel(genAI, requestId);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Analyze ${labelImageDataUrl ? 'these product images (product photo and label close-up)' : 'this product image'} and extract the unit weight. Return ONLY valid JSON:

{
  "value": number (numeric value only),
  "unit": "g" or "ml" or "oz" or "kg",
  "confidence": 0.0-1.0,
  "evidenceSnippet": "exact text from package or reasoning"
}

Rules:
- Look carefully for NET WEIGHT, NET WT, PESO NETO on packaging
- Common locations: front label, back panel, near barcode
- Extract ONLY the numeric value (e.g., if "25g" write value: 25, unit: "g")
- confidence: 0.9-1.0 = clearly printed text visible, 0.6-0.8 = partially visible, 0.4-0.5 = estimated from size, 0.0-0.3 = pure guess
- If you see the weight clearly, use high confidence (0.9+)
- Return ONLY valid JSON, no markdown`;

    const imageParts: any[] = [prompt, {
      inlineData: {
        data: extractBase64(productImageDataUrl),
        mimeType: "image/jpeg",
      },
    }];
    
    // Add label image if provided
    if (labelImageDataUrl) {
      imageParts.push({
        inlineData: {
          data: extractBase64(labelImageDataUrl),
          mimeType: "image/jpeg",
        },
      });
    }

    const result = await model.generateContent(imageParts);
    const responseText = result.response.text();
    let jsonText = responseText.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonText);

    return {
      success: true,
      weightDraft: { ...parsed, source: "VISION" as const },
    };
  } catch (error: any) {
    console.error(`[Gemini ${requestId || ""}] Unit weight inference failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Infer units per case from box/case photo
 * Returns default candidates if no image provided
 */
export async function inferUnitsPerCaseFromBox(
  boxImageDataUrl: string | null,
  productName?: string | null,
  category?: string | null,
  requestId?: string
): Promise<{
  success: boolean;
  unitsPerCaseDraft?: {
    candidates: Array<{ value: number; confidence: number; evidenceSnippet: string }>;
    source: "VISION" | "DEFAULT";
  };
  error?: string;
}> {
  // If no box image, return default candidates immediately
  if (!boxImageDataUrl) {
    return {
      success: true,
      unitsPerCaseDraft: {
        candidates: [
          { value: 12, confidence: 0.4, evidenceSnippet: "Common case pack for this category" },
          { value: 24, confidence: 0.3, evidenceSnippet: "Alternative case pack for this category" },
        ],
        source: "DEFAULT" as const,
      },
    };
  }

  const genAI = createGeminiClient(requestId);
  
  if (!genAI) {
    return { success: false, error: "Gemini API key not configured" };
  }

  try {
    const modelName = await getWorkingModel(genAI, requestId);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Analyze this box/case image and determine how many individual units are packed inside. Return ONLY valid JSON:

{
  "candidates": [
    {"value": number, "confidence": 0.0-1.0, "evidenceSnippet": "exact text from box or reasoning"}
  ]
}

Rules:
- Look carefully for text like "12 units", "Case of 24", "Pack of 48", "Qty: 36", "12x" on the box
- Common locations: front of case, side panel, top flap
- If you can count individual units visible in the image, use that count
- Return 1-3 candidates sorted by confidence (highest first)
- confidence: 0.9-1.0 = text clearly visible, 0.6-0.8 = partially visible or countable, 0.4-0.5 = estimated from box size
- If text is visible, use high confidence (0.8+)
- Return ONLY valid JSON, no markdown`;

    const imagePart = {
      inlineData: {
        data: extractBase64(boxImageDataUrl),
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    let jsonText = responseText.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonText);

    return {
      success: true,
      unitsPerCaseDraft: { ...parsed, source: "VISION" as const },
    };
  } catch (error: any) {
    console.error(`[Gemini ${requestId || ""}] Units per case inference failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Infer customs category and HS candidates using text reasoning
 */
export async function inferCustomsAndHS(
  productName: string,
  category: string | null,
  originCountry: string | null,
  requestId?: string
): Promise<{
  success: boolean;
  customsCategoryDraft?: { value: string; confidence: number; evidenceSnippet: string; source: "VISION" };
  hsCandidatesDraft?: Array<{
    code: string;
    confidence: number;
    rationale: string;
    evidenceSnippet: string;
    source: "VISION";
  }>;
  error?: string;
}> {
  const genAI = createGeminiClient(requestId);
  
  if (!genAI) {
    return { success: false, error: "Gemini API key not configured" };
  }

  try {
    const modelName = await getWorkingModel(genAI, requestId);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Based on this product info, infer customs category and HS codes. Return ONLY valid JSON:

Product: ${productName}
Category: ${category || "Unknown"}
Origin: ${originCountry || "Unknown"}

{
  "customsCategoryDraft": {
    "value": "plain language category (e.g., Food & Beverages)",
    "confidence": 0.0-1.0,
    "evidenceSnippet": "reasoning"
  },
  "hsCandidatesDraft": [
    {
      "code": "6-digit HS code",
      "confidence": 0.0-1.0,
      "rationale": "1-2 sentence explanation",
      "evidenceSnippet": "key detail from product"
    }
  ]
}

Rules:
- customsCategoryDraft: Use broad categories (Food & Beverages, Electronics, Clothing, etc.)
- hsCandidatesDraft: Return 1-3 candidates sorted by confidence
- confidence: 0.7-1.0 = clear match, 0.5-0.6 = possible, 0.3-0.4 = weak
- Return ONLY valid JSON`;

    const result = await model.generateContent([prompt]);
    const responseText = result.response.text();
    let jsonText = responseText.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonText);

    return {
      success: true,
      customsCategoryDraft: { ...parsed.customsCategoryDraft, source: "VISION" as const },
      hsCandidatesDraft: parsed.hsCandidatesDraft.map((hs: any) => ({
        ...hs,
        source: "VISION" as const,
      })),
    };
  } catch (error: any) {
    console.error(`[Gemini ${requestId || ""}] Customs/HS inference failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get category-based defaults when all inference fails
 */
export function getCategoryDefaults(category: string | null): {
  unitWeightDraft: { value: string; confidence: number; evidenceSnippet: string; source: "DEFAULT" };
  unitsPerCaseDraft: {
    candidates: Array<{ value: number; confidence: number; evidenceSnippet: string }>;
    source: "DEFAULT";
  };
  customsCategoryDraft: { value: string; confidence: number; evidenceSnippet: string; source: "DEFAULT" };
} {
  const categoryLower = (category || "").toLowerCase();
  
  let unitWeight = "25g";
  let customsCategory = "Food & Beverages";
  
  if (categoryLower.includes("candy") || categoryLower.includes("chocolate")) {
    unitWeight = "25g";
    customsCategory = "Confectionery";
  } else if (categoryLower.includes("beverage") || categoryLower.includes("drink")) {
    unitWeight = "250ml";
    customsCategory = "Beverages";
  } else if (categoryLower.includes("snack")) {
    unitWeight = "30g";
    customsCategory = "Snacks";
  } else if (categoryLower.includes("supplement") || categoryLower.includes("vitamin")) {
    unitWeight = "5g";
    customsCategory = "Dietary Supplements";
  }

  return {
    unitWeightDraft: {
      value: unitWeight,
      confidence: 0.25,
      evidenceSnippet: "Default category assumption",
      source: "DEFAULT",
    },
    unitsPerCaseDraft: {
      candidates: [
        { value: 12, confidence: 0.4, evidenceSnippet: "Common case pack for this category" },
        { value: 24, confidence: 0.3, evidenceSnippet: "Alternative case pack for this category" },
      ],
      source: "DEFAULT",
    },
    customsCategoryDraft: {
      value: customsCategory,
      confidence: 0.5,
      evidenceSnippet: "Inferred from product category",
      source: "DEFAULT",
    },
  };
}
