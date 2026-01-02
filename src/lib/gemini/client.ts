import { GoogleGenerativeAI, Content } from "@google/generative-ai";

/**
 * Resilient Gemini Client
 * Wraps model.generateContent with retry logic, exponential backoff, and model fallback
 */

export type ErrorClassification = "transient" | "permanent" | "timeout";

export interface GeminiError extends Error {
  classification: ErrorClassification;
  statusCode?: number;
  retryAfter?: number;
  originalError: unknown;
}

interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  timeoutMs: 30000,
};

const TRANSIENT_ERROR_CODES = [429, 503, 504];
const TRANSIENT_ERROR_MESSAGES = ["timeout", "DEADLINE_EXCEEDED", "UNAVAILABLE", "RESOURCE_EXHAUSTED"];

function classifyError(error: any): ErrorClassification {
  if (!error) return "permanent";

  const status = error?.status || error?.statusCode;
  const message = error?.message || "";

  if (TRANSIENT_ERROR_CODES.includes(status)) return "transient";
  if (TRANSIENT_ERROR_MESSAGES.some((msg) => message.includes(msg))) return "transient";
  if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND") || message.includes("timeout"))
    return "timeout";

  return "permanent";
}

function getRetryAfter(error: any): number | null {
  const retryAfter = error?.headers?.["retry-after"];
  if (retryAfter) {
    const parsed = parseInt(retryAfter, 10);
    return isNaN(parsed) ? null : parsed * 1000;
  }
  return null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function exponentialBackoff(attempt: number, config: RetryConfig, retryAfter?: number | null): number {
  if (retryAfter) return Math.min(retryAfter, config.maxDelayMs);

  const jitter = Math.random() * 0.1;
  const delay = config.initialDelayMs * Math.pow(2, attempt) * (1 + jitter);
  return Math.min(delay, config.maxDelayMs);
}

export async function callGeminiWithRetry<T>(
  modelProvider: GoogleGenerativeAI,
  modelName: string,
  prompt: string | any[] | any, // Accept string, Content[], or Part[]
  options?: {
    retryConfig?: Partial<RetryConfig>;
    requestId?: string;
    stepName?: string;
    fallbackModels?: string[];
  }
): Promise<{ success: boolean; data?: T; error?: GeminiError }> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options?.retryConfig };
  const requestId = options?.requestId || "unknown";
  const stepName = options?.stepName || "unknown";
  const models = [modelName, ...(options?.fallbackModels || [])];

  let lastError: GeminiError | null = null;

  // Try each model in sequence
  for (const currentModel of models) {
    console.log(`[Gemini ${requestId}] Trying model ${currentModel} for step ${stepName}`);

    // Try each model with retries
    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        const model = modelProvider.getGenerativeModel({ model: currentModel });
        const result = await model.generateContent(prompt as any);

        console.log(`[Gemini ${requestId}] Step ${stepName} succeeded on model ${currentModel} (attempt ${attempt + 1})`);
        return { success: true, data: result as T };
      } catch (error: any) {
        const classification = classifyError(error);
        const statusCode = error?.status || error?.statusCode;
        const retryAfter = getRetryAfter(error);

        console.warn(
          `[Gemini ${requestId}] Step ${stepName} model ${currentModel} attempt ${attempt + 1} failed: ${error?.message} (status: ${statusCode}, classification: ${classification})`
        );

        lastError = new Error(`Gemini error: ${error?.message}`) as GeminiError;
        lastError.classification = classification;
        lastError.statusCode = statusCode;
        lastError.retryAfter = retryAfter || undefined;
        lastError.originalError = error;

        // If permanent error, try next model
        if (classification === "permanent") {
          console.warn(`[Gemini ${requestId}] Permanent error on ${currentModel}, trying next model`);
          break;
        }

        // If transient error and not last attempt, retry with backoff
        if (attempt < config.maxAttempts - 1) {
          const delayMs = exponentialBackoff(attempt, config, retryAfter);
          console.log(`[Gemini ${requestId}] Retrying in ${delayMs}ms...`);
          await sleep(delayMs);
          continue;
        }

        // Last attempt failed, try next model
        break;
      }
    }
  }

  // All models and attempts failed
  if (!lastError) {
    lastError = new Error("All Gemini models failed") as GeminiError;
    lastError.classification = "permanent";
    lastError.originalError = null;
  }

  console.error(`[Gemini ${requestId}] All attempts failed for step ${stepName}: ${lastError.message}`);
  return { success: false, error: lastError };
}

/**
 * Parse JSON from model response with fallback
 */
export function safeJsonParse<T = any>(
  text: string,
  requestId?: string
): { success: boolean; data?: T; error?: string } {
  try {
    return { success: true, data: JSON.parse(text) };
  } catch {
    // Try stripping markdown code fences
    const cleaned = text.trim().replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();

    if (cleaned && cleaned !== text) {
      try {
        return { success: true, data: JSON.parse(cleaned) };
      } catch (innerErr) {
        console.warn(`[Gemini ${requestId || "unknown"}] Failed to parse JSON even after markdown stripping`);
      }
    }

    return {
      success: false,
      error: `Invalid JSON: ${text.slice(0, 100)}...`,
    };
  }
}

/**
 * Backwards compatibility: Legacy client interface
 * @deprecated Use callGeminiWithRetry directly
 */
export function getGeminiModelClient(): any {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("[Gemini] Missing GEMINI_API_KEY");
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return {
    generateText: async (parts: any[]) => {
      const result = await callGeminiWithRetry(genAI, modelName, parts, {
        stepName: "generateText",
      });
      if (!result.success) throw result.error;
      return (result.data as any)?.response?.text() || "";
    },
    generateJson: async <T = any>(schema: any, parts: any[]): Promise<T> => {
      const result = await callGeminiWithRetry(genAI, modelName, parts, {
        stepName: "generateJson",
      });
      if (!result.success) throw result.error;
      const text = (result.data as any)?.response?.text() || "";
      const parsed = safeJsonParse<T>(text);
      if (!parsed.success) throw new Error(parsed.error);
      return parsed.data!;
    },
    modelUsed: modelName,
  };
}
