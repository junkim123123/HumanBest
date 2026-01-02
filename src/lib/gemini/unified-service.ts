/**
 * Unified Gemini service - single entry point for all LLM calls
 * - Centralizes model selection and fallback logic
 * - Provides safe JSON parsing with markdown stripping
 * - Ensures failures return structured results never throwing
 * - Uses env GEMINI_API_KEY and optional GEMINI_MODEL
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-1.5-flash"];

interface GeminiServiceOptions {
  requestId?: string;
  maxRetries?: number;
}

interface SafeJsonParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  raw?: string;
}

/**
 * Initialize Gemini client with API key validation
 */
function initGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("[Gemini] Missing GEMINI_API_KEY or GOOGLE_API_KEY");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Get a working model with automatic fallback
 */
async function getWorkingModel(
  genAI: GoogleGenerativeAI,
  preferred: string,
  requestId?: string
): Promise<{ model: any; modelName: string } | null> {
  const modelsToTry = [preferred, ...FALLBACK_MODELS].filter(
    (m, i, a) => a.indexOf(m) === i
  );

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`[Gemini${requestId ? ` ${requestId}` : ""}] Using model: ${modelName}`);
      return { model, modelName };
    } catch (err: any) {
      const message = err?.message || "Unknown error";
      const is404 = message.includes("not found") || err?.status === 404;
      if (is404 && modelName !== FALLBACK_MODELS[FALLBACK_MODELS.length - 1]) {
        console.warn(
          `[Gemini${requestId ? ` ${requestId}` : ""}] Model ${modelName} unavailable (404), trying fallback`
        );
        continue;
      }
      console.error(
        `[Gemini${requestId ? ` ${requestId}` : ""}] Model ${modelName} error:`,
        message
      );
      continue;
    }
  }

  console.error(
    `[Gemini${requestId ? ` ${requestId}` : ""}] All models failed to initialize`
  );
  return null;
}

/**
 * Safe JSON parsing with markdown stripping and fallback
 */
export function safeJsonParse<T = any>(
  text: string,
  requestId?: string
): SafeJsonParseResult<T> {
  try {
    return {
      success: true,
      data: JSON.parse(text),
      raw: text,
    };
  } catch (err) {
    // Try stripping markdown code fences
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```$/m, "")
      .trim();

    if (cleaned && cleaned !== text) {
      try {
        return {
          success: true,
          data: JSON.parse(cleaned),
          raw: cleaned,
        };
      } catch (cleanErr) {
        return {
          success: false,
          error: `JSON parse failed after markdown stripping: ${cleanErr}`,
          raw: cleaned,
        };
      }
    }

    return {
      success: false,
      error: `JSON parse failed: ${err}`,
      raw: text,
    };
  }
}

/**
 * Generate text with model fallback and error handling
 */
export async function generateText(
  prompt: string | any[],
  options: GeminiServiceOptions = {}
): Promise<{ success: boolean; text?: string; error?: string; modelUsed?: string }> {
  const { requestId } = options;

  try {
    const genAI = initGeminiClient();
    if (!genAI) {
      return {
        success: false,
        error: "Gemini API not initialized (missing API key)",
      };
    }

    const modelResult = await getWorkingModel(genAI, PRIMARY_MODEL, requestId);
    if (!modelResult) {
      return {
        success: false,
        error: "No working Gemini model available",
      };
    }

    const { model, modelName } = modelResult;

    try {
      const response = await model.generateContent(
        typeof prompt === "string" ? prompt : prompt
      );
      const text = response.response.text();
      return {
        success: true,
        text,
        modelUsed: modelName,
      };
    } catch (callErr: any) {
      return {
        success: false,
        error: `Generate call failed: ${callErr?.message || callErr}`,
        modelUsed: modelName,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error in generateText: ${err?.message || err}`,
    };
  }
}

/**
 * Generate JSON with schema and safe parsing
 */
export async function generateJson<T = any>(
  prompt: string | any[],
  schema?: any,
  options: GeminiServiceOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; modelUsed?: string; raw?: string }> {
  const { requestId } = options;

  try {
    const genAI = initGeminiClient();
    if (!genAI) {
      return {
        success: false,
        error: "Gemini API not initialized (missing API key)",
      };
    }

    const modelResult = await getWorkingModel(genAI, PRIMARY_MODEL, requestId);
    if (!modelResult) {
      return {
        success: false,
        error: "No working Gemini model available",
      };
    }

    const { model, modelName } = modelResult;

    try {
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
      const parsed = safeJsonParse<T>(text, requestId);

      return {
        success: parsed.success,
        data: parsed.data,
        error: parsed.error,
        modelUsed: modelName,
        raw: parsed.raw,
      };
    } catch (callErr: any) {
      return {
        success: false,
        error: `Generate JSON call failed: ${callErr?.message || callErr}`,
        modelUsed: modelName,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error in generateJson: ${err?.message || err}`,
    };
  }
}

/**
 * Analyze image with fallback
 */
export async function generateImageAnalysis<T = any>(
  prompt: string | any[],
  imagePart: any,
  schema?: any,
  options: GeminiServiceOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; modelUsed?: string; raw?: string }> {
  const { requestId } = options;

  try {
    const genAI = initGeminiClient();
    if (!genAI) {
      return {
        success: false,
        error: "Gemini API not initialized (missing API key)",
      };
    }

    const modelResult = await getWorkingModel(genAI, PRIMARY_MODEL, requestId);
    if (!modelResult) {
      return {
        success: false,
        error: "No working Gemini model available",
      };
    }

    const { model, modelName } = modelResult;

    try {
      const parts = Array.isArray(prompt)
        ? [...prompt, imagePart]
        : [{ text: prompt }, imagePart];

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
      const parsed = safeJsonParse<T>(text, requestId);

      return {
        success: parsed.success,
        data: parsed.data,
        error: parsed.error,
        modelUsed: modelName,
        raw: parsed.raw,
      };
    } catch (callErr: any) {
      return {
        success: false,
        error: `Image analysis call failed: ${callErr?.message || callErr}`,
        modelUsed: modelName,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Unexpected error in generateImageAnalysis: ${err?.message || err}`,
    };
  }
}
