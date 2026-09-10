import { GoogleGenAI } from '@google/genai';

export interface KeyRotationConfig {
  keys: string[];
  currentIndex: number;
}

/**
 * Parses and extracts all Gemini API keys from environment variables.
 */
export function getGeminiApiKeys(): string[] {
  const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const parsed = keysString
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k && k !== 'MY_GEMINI_API_KEY');

  return Array.from(new Set(parsed)); // Deduplicate
}

let activeKeyIndex = 0;

/**
 * Timeout wrapper for Gemini model call.
 */
async function callWithTimeout<T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Executes a Gemini generation with automatic key rotation upon rate limits or quota exhaustion.
 */
export async function generateWithRotation(
  modelsToTry: string[],
  params: {
    contents: any[];
    config?: any;
  },
  timeoutMs = 15000
): Promise<{ text: string; model: string; keyIndexUsed: number }> {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    throw new Error('No valid Gemini API keys found in environment.');
  }

  const startIndex = activeKeyIndex % keys.length;
  let lastError: any = null;

  // Try each key starting from the active index
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (startIndex + attempt) % keys.length;
    const currentKey = keys[keyIndex];
    const ai = new GoogleGenAI({ apiKey: currentKey });

    for (const model of modelsToTry) {
      try {
        const response = await callWithTimeout(
          ai.models.generateContent({
            model,
            ...params,
          }),
          timeoutMs
        );

        // Success! Set activeKeyIndex to this working key for subsequent calls
        activeKeyIndex = keyIndex;
        const text = response.text || '';
        return { text, model, keyIndexUsed: keyIndex };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isQuotaOrRateLimit =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota exceeded') ||
          errMsg.includes('rate limit');

        if (isQuotaOrRateLimit) {
          console.warn(
            `[Gemini Rotation] Key index ${keyIndex} hit quota/rate-limit with model ${model}. Failing over to next key...`
          );
          break; // Break model loop, proceed to next key in pool
        } else {
          console.warn(
            `[Gemini Rotation] Model ${model} on key index ${keyIndex} encountered error: ${errMsg}. Trying alternate model/key...`
          );
        }
      }
    }
  }

  throw lastError || new Error('All Gemini API keys and models exhausted.');
}
