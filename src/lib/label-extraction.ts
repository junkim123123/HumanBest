// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGeminiClient } from "@/lib/gemini-helper";

// ============================================================================
// Label Extraction with Gemini
// ============================================================================
// Extracts structured fields from package labels (no translation, field extraction only)

export interface LabelExtract {
  brand?: string | null;
  productLine?: string | null;
  netWeight?: string | null;
  ingredients?: string[] | null;
  allergens?: string[] | null;
  countryOfOrigin?: string | null;
  warnings?: string[] | null;
  batteryInfo?: string | null;
  manufacturerName?: string | null;
  dimensions?: string | null;
  ageGrade?: string | null;
  careInstructions?: string | null;
  powerSpec?: string | null;
  certifications?: string[] | null;
}

// Helper to get working model
async function getWorkingModel(genAI: GoogleGenerativeAI): Promise<string> {
  const modelsToTry = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-pro"
  ];

  for (const modelName of modelsToTry) {
    try {
      const testModel = genAI.getGenerativeModel({ model: modelName });
      await testModel.generateContent("test");
      return modelName;
    } catch {
      continue;
    }
  }
  
  return modelsToTry[0];
}

/**
 * Extract structured fields from package label image
 * Returns JSON with extracted fields (no translation, field extraction only)
 */
export async function extractLabelWithGemini(
  imageBase64: string,
  mimeType: string
): Promise<LabelExtract | null> {
  const genAI = createGeminiClient();
  if (!genAI) {
    return null;
  }

  const modelName = await getWorkingModel(genAI);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
Extract structured fields from this package label image.
Return JSON only.
Do not invent text that is not visible.
If a field is not visible, set it to null.

{
  "brand": null,
  "productLine": null,
  "netWeight": null,
  "ingredients": null,
  "allergens": null,
  "countryOfOrigin": null,
  "warnings": null,
  "batteryInfo": null,
  "manufacturerName": null,
  "dimensions": null,
  "ageGrade": null,
  "careInstructions": null,
  "powerSpec": null,
  "certifications": null
}

Extract only what is visible. Do not translate - extract the original text as shown.
`.trim();

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType } },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[LabelExtraction] Failed to parse JSON from Gemini response");
      return null;
    }

    return JSON.parse(jsonMatch[0]) as LabelExtract;
  } catch (error) {
    console.error("[LabelExtraction] Error extracting label:", error);
    return null;
  }
}














