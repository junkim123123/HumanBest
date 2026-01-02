/**
 * Centralized Gemini client with automatic model selection
 * - Validates API key on server side
 * - Performs ListModels query to select first working model
 * - Implements fallback order: gemini-2.5-flash → gemini-2.0-flash → first available
 * - Caches model choice per process
 * - Never calls without GEMINI_API_KEY
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedModel: { name: string; client: GoogleGenerativeAI } | null = null;
let modelSelectionInProgress = false;
const modelSelectionPromises: Promise<{ name: string; client: GoogleGenerativeAI }>[] = [];

interface GeminiClientResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  modelUsed?: string;
}

/**
 * Validate that GEMINI_API_KEY is available on server
 */
function validateApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY not set. Server-side Gemini calls require this env var."
    );
  }
  return apiKey;
}

/**
 * List available models and select the first one that supports generateContent
 * Falls back to hardcoded list if REST call fails
 */
async function selectModelFromAvailable(
  client: GoogleGenerativeAI
): Promise<string> {
  const fallbackModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  try {
    // Try to list available models via REST API
    const apiKey = validateApiKey();
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?pageSize=50",
      {
        headers: { "x-goog-api-key": apiKey },
      }
    );

    if (!response.ok) {
      console.warn(
        "[Gemini] ListModels failed, using fallback model list:",
        response.status
      );
      return fallbackModels[0];
    }

    const data = (await response.json()) as any;
    const models = data.models || [];

    // Find first model that supports generateContent
    for (const model of models) {
      const modelName = model.name?.split("/").pop();
      const supportedMethods = model.supportedGenerationMethods || [];
      if (
        modelName &&
        supportedMethods.includes("generateContent") &&
        !modelName.includes("embedding")
      ) {
        console.log(`[Gemini] Selected model from API: ${modelName}`);
        return modelName;
      }
    }

    console.warn(
      "[Gemini] No compatible model found in list, using fallback:",
      fallbackModels[0]
    );
    return fallbackModels[0];
  } catch (error: any) {
    console.warn(
      "[Gemini] Failed to query ListModels:",
      error.message,
      "using fallback:",
      fallbackModels[0]
    );
    return fallbackModels[0];
  }
}

/**
 * Initialize Gemini client with model selection
 * Thread-safe: multiple concurrent calls will wait for first selection
 */
async function initializeGeminiClient(): Promise<{
  name: string;
  client: GoogleGenerativeAI;
}> {
  // Return cached model if available
  if (cachedModel) {
    return cachedModel;
  }

  // If selection is in progress, wait for it
  if (modelSelectionInProgress) {
    const promise = new Promise<{ name: string; client: GoogleGenerativeAI }>(
      (resolve) => {
        const checkCached = () => {
          if (cachedModel) {
            resolve(cachedModel);
          } else {
            setTimeout(checkCached, 50);
          }
        };
        checkCached();
      }
    );
    return promise;
  }

  // Start selection
  modelSelectionInProgress = true;
  try {
    const apiKey = validateApiKey();
    const client = new GoogleGenerativeAI(apiKey);
    const selectedModel = await selectModelFromAvailable(client);

    cachedModel = { name: selectedModel, client };
    console.log(`[Gemini] Initialized with model: ${selectedModel}`);
    return cachedModel;
  } finally {
    modelSelectionInProgress = false;
  }
}

/**
 * Generate text content using selected Gemini model
 * Never throws; always returns structured result
 */
export async function generateGeminiText(
  prompt: string | any[],
  options?: { requestId?: string }
): Promise<GeminiClientResult<string>> {
  try {
    const { name: modelName, client } = await initializeGeminiClient();
    const model = client.getGenerativeModel({ model: modelName });

    const response = await model.generateContent(
      typeof prompt === "string" ? prompt : prompt
    );
    const text = response.response.text();

    return {
      success: true,
      data: text,
      modelUsed: modelName,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to generate text: ${error.message}`,
    };
  }
}

/**
 * Generate JSON content using selected Gemini model
 * Handles JSON parsing with markdown stripping
 * Never throws; always returns structured result
 */
export async function generateGeminiJson<T = any>(
  prompt: string | any[],
  schema?: any,
  options?: { requestId?: string }
): Promise<GeminiClientResult<T>> {
  try {
    const { name: modelName, client } = await initializeGeminiClient();
    const model = client.getGenerativeModel({ model: modelName });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: Array.isArray(prompt) ? prompt : [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        ...(schema ? { responseSchema: schema } : {}),
      },
    });

    const text = response.response.text();

    // Parse JSON with markdown stripping
    try {
      return {
        success: true,
        data: JSON.parse(text),
        modelUsed: modelName,
      };
    } catch (parseErr) {
      // Try stripping markdown
      const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/m, "")
        .replace(/\s*```$/m, "")
        .trim();
      return {
        success: true,
        data: JSON.parse(cleaned),
        modelUsed: modelName,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to generate JSON: ${error.message}`,
    };
  }
}

/**
 * Analyze image using selected Gemini model
 * Supports multimodal input with text + image
 * Never throws; always returns structured result
 */
export async function generateGeminiImageAnalysis<T = any>(
  prompt: string | any[],
  imagePart: any,
  schema?: any,
  options?: { requestId?: string }
): Promise<GeminiClientResult<T>> {
  try {
    const { name: modelName, client } = await initializeGeminiClient();
    const model = client.getGenerativeModel({ model: modelName });

    const parts = Array.isArray(prompt) ? [...prompt, imagePart] : [{ text: prompt }, imagePart];

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        ...(schema ? { responseSchema: schema } : {}),
      },
    });

    const text = response.response.text();

    // Parse JSON with markdown stripping
    try {
      return {
        success: true,
        data: JSON.parse(text),
        modelUsed: modelName,
      };
    } catch (parseErr) {
      const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/m, "")
        .replace(/\s*```$/m, "")
        .trim();
      return {
        success: true,
        data: JSON.parse(cleaned),
        modelUsed: modelName,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to generate image analysis: ${error.message}`,
    };
  }
}

/**
 * Clear cached model (for testing or re-initialization)
 */
export function clearGeminiCache(): void {
  cachedModel = null;
  modelSelectionInProgress = false;
}
