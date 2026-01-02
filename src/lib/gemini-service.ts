// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeminiAnalysisResult {
  productName: string;
  hsCode: string | null;
  category: string;
  keywords: string[];
  material?: string;
  description: string;
  attributes?: Record<string, string>;
}

/**
 * Analyze product image using Gemini 1.5 Flash Vision API
 * Returns structured product information for sourcing intelligence
 * 
 * @param imageUrl - URL of the product image to analyze
 * @returns Structured analysis result with product details
 */
export async function analyzeImageWithGemini(
  imageUrl: string
): Promise<GeminiAnalysisResult> {
  try {
    // Use gemini-2.5-flash for latest image analysis capabilities
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Fetch image and convert to base64
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) {
      throw new Error(`Failed to fetch image: ${imageResp.statusText}`);
    }

    const arrayBuffer = await imageResp.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const binary = String.fromCharCode(...bytes);
    const base64Image =
      typeof Buffer !== "undefined"
        ? Buffer.from(binary, "binary").toString("base64")
        : btoa(binary);
    const mimeType = imageResp.headers.get("content-type") || "image/jpeg";

    const prompt = `Analyze this product image for a sourcing agent. Return a JSON object ONLY (no markdown, no code blocks):
{
  "productName": "Short descriptive name",
  "hsCode": "Estimated 6-digit HS Code (format: XXXX.XX) or null if uncertain",
  "category": "Product Category",
  "keywords": ["key1", "key2", "key3"],
  "material": "Primary material",
  "description": "Brief visual description",
  "attributes": {
    "color": "color if visible",
    "size": "size/dimensions if visible",
    "weight": "weight if applicable"
  }
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response (remove markdown code blocks if present)
    const jsonString = text
      .replace(/```json|```/g, "")
      .replace(/^[\s\n]*\{/, "{")
      .replace(/\}[\s\n]*$/, "}")
      .trim();

    const parsed = JSON.parse(jsonString) as GeminiAnalysisResult;

    // Validate and return with defaults
    return {
      productName: parsed.productName || "Unidentified Item",
      hsCode: parsed.hsCode || null,
      category: parsed.category || "Unknown",
      keywords: parsed.keywords || [],
      material: parsed.material,
      description: parsed.description || "Analysis completed",
      attributes: parsed.attributes || {},
    };
  } catch (error) {
    console.error("[Gemini Service] Vision API Error:", error);

    // Return safe defaults to prevent pipeline failure
    return {
      productName: "Unidentified Item",
      hsCode: null,
      category: "Unknown",
      keywords: [],
      description: "Analysis failed - check image URL and API key",
      attributes: {},
    };
  }
}

