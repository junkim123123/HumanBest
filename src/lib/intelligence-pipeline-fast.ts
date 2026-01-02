/**
 * Fast Facts Extraction Pipeline
 * Quick extraction of basic facts (barcode, label OCR, net weight) for sub-3s response
 * Returns a minimal partial report that can be displayed immediately
 * Heavy analysis (HS inference, supplier matching, market estimate) deferred to background job
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry } from "@/lib/gemini/client";

export interface FastFactsResult {
  productName: string;
  description: string;
  category: string;
  barcode: string | null;
  labelText: string | null;
  netWeight: number | null; // in kg
  keywords: string[];
  confidence: "low" | "medium" | "high";
  extractedAt: string; // ISO timestamp
}

/**
 * Extract fast facts from images - should complete in < 1 second
 * This is the minimal set of info shown in the draft report
 */
export async function extractFastFacts(
  imageDataUrl: string,
  barcodeDataUrl: string,
  labelDataUrl: string,
  requestId: string
): Promise<FastFactsResult> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

  console.log(`[FastFacts ${requestId}] Starting fast facts extraction`);
  const startTime = Date.now();

  try {
    // Step 1: Extract barcode (fast Vision call)
    let barcode: string | null = null;
    let category: string = "unknown";
    let productName: string = "Analyzing...";

    try {
      const barcodePrompt = [
        {
          type: "text" as const,
          text: "Extract the barcode or UPC number visible in this image. Return ONLY the barcode number, or 'NONE' if not visible.",
        },
        {
          type: "image" as const,
          image_url: { url: barcodeDataUrl },
        },
      ];

      const barcodeResult = await callGeminiWithRetry(genAI, "gemini-2.5-flash", barcodePrompt, {
        requestId: `${requestId}-barcode`,
        stepName: "barcode_extraction",
        retryConfig: { maxAttempts: 2, initialDelayMs: 50 },
      });

      if (barcodeResult.success && barcodeResult.data) {
        const barcodeText = (barcodeResult.data as any).text?.trim() || "";
        if (barcodeText !== "NONE" && barcodeText.length > 0) {
          barcode = barcodeText;
          console.log(`[FastFacts ${requestId}] Extracted barcode: ${barcodeText.substring(0, 10)}...`);
        }
      }
    } catch (err) {
      console.warn(`[FastFacts ${requestId}] Barcode extraction failed (non-blocking): ${err}`);
    }

    // Step 2: Extract label text (fast Vision call)
    let labelText: string | null = null;
    try {
      const labelPrompt = [
        {
          type: "text" as const,
          text: "Extract all visible text from the label. Include product name, brand, net weight, and ingredients if visible. Return as a simple list.",
        },
        {
          type: "image" as const,
          image_url: { url: labelDataUrl },
        },
      ];

      const labelResult = await callGeminiWithRetry(genAI, "gemini-2.5-flash", labelPrompt, {
        requestId: `${requestId}-label`,
        stepName: "label_extraction",
        retryConfig: { maxAttempts: 2, initialDelayMs: 50 },
      });

      if (labelResult.success && labelResult.data) {
        labelText = (labelResult.data as any).text?.substring(0, 500) || null; // Limit to 500 chars for speed
        console.log(`[FastFacts ${requestId}] Extracted label text (${labelText?.length || 0} chars)`);
      }
    } catch (err) {
      console.warn(`[FastFacts ${requestId}] Label extraction failed (non-blocking): ${err}`);
    }

    // Step 3: Quick product classification from main image
    try {
      const classifyPrompt = [
        {
          type: "text" as const,
          text: `Based on the image, identify:
1. Product name (one line)
2. Category (toy, food, beauty, electronics, apparel, home, other)
3. Net weight if visible (in kg, e.g., "0.5")
4. 3-5 keywords describing the product

Format: 
Product: [name]
Category: [category]
Weight: [kg or UNKNOWN]
Keywords: [comma separated]`,
        },
        {
          type: "image" as const,
          image_url: { url: imageDataUrl },
        },
      ];

      const classifyResult = await callGeminiWithRetry(genAI, "gemini-2.5-flash", classifyPrompt, {
        requestId: `${requestId}-classify`,
        stepName: "product_classification",
        retryConfig: { maxAttempts: 2, initialDelayMs: 50 },
      });

      if (classifyResult.success && classifyResult.data) {
        const classifyText = (classifyResult.data as any).text || "";
        
        // Parse structured response
        const productMatch = classifyText.match(/Product:\s*(.+?)(?=\n|Category:|$)/i);
        const categoryMatch = classifyText.match(/Category:\s*(.+?)(?=\n|Weight:|$)/i);
        const weightMatch = classifyText.match(/Weight:\s*(.+?)(?=\n|Keywords:|$)/i);
        const keywordsMatch = classifyText.match(/Keywords:\s*(.+?)(?=\n|$)/i);

        if (productMatch) {
          productName = productMatch[1].trim();
        }
        if (categoryMatch) {
          category = categoryMatch[1].trim().toLowerCase();
        }
        if (weightMatch) {
          const weightStr = weightMatch[1].trim().toLowerCase();
          if (weightStr !== "unknown") {
            const parsed = parseFloat(weightStr);
            if (!isNaN(parsed)) {
              // const netWeight = parsed;
            }
          }
        }

        console.log(`[FastFacts ${requestId}] Classified product: ${productName} (${category})`);
      }
    } catch (err) {
      console.warn(`[FastFacts ${requestId}] Product classification failed (non-blocking): ${err}`);
    }

    // Step 4: Net weight extraction from label/image (fast)
    let netWeight: number | null = null;
    if (labelText) {
      // Simple regex parse for common weight formats
      const weightRegex = /(\d+(?:\.\d+)?)\s*(?:kg|grams?|g|oz|lbs?)/i;
      const match = labelText.match(weightRegex);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        
        // Convert to kg
        if (unit.includes("oz")) {
          netWeight = value * 0.0283495; // oz to kg
        } else if (unit.includes("lb")) {
          netWeight = value * 0.453592; // lb to kg
        } else if (unit.includes("g")) {
          netWeight = value / 1000; // grams to kg
        } else {
          netWeight = value; // Already kg
        }
        
        console.log(`[FastFacts ${requestId}] Extracted net weight: ${netWeight.toFixed(2)}kg`);
      }
    }

    const elapsedMs = Date.now() - startTime;
    console.log(`[FastFacts ${requestId}] Fast facts extraction completed in ${elapsedMs}ms`);

    return {
      productName,
      description: labelText || "",
      category,
      barcode,
      labelText,
      netWeight,
      keywords: productName
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .slice(0, 5),
      confidence: netWeight && barcode ? "medium" : netWeight || barcode ? "low" : "low",
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[FastFacts ${requestId}] Error extracting fast facts: ${error}`);
    throw error;
  }
}
