import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

// Calls OpenAI directly — the PM skill prompts below are our Hermes skill implementations
export const hermes = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "missing-key",
});

export const MODEL = "gpt-4o-mini";

export async function callHermes(system: string, prompt: string, maxTokens = 4000): Promise<string> {
  const { text } = await generateText({
    model: hermes(MODEL),
    system,
    prompt,
    maxOutputTokens: maxTokens,
  });
  return text.trim();
}

export function parseJSON<T>(text: string): T {
  // Fast path: already clean JSON
  try { return JSON.parse(text.trim()) as T; } catch { /* fall through */ }

  // Strip markdown fences anywhere in the text
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(stripped) as T; } catch { /* fall through */ }

  // Extract first JSON object or array from anywhere in the text
  const match = stripped.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) return JSON.parse(match[1]) as T;

  throw new Error(`No valid JSON in response: ${text.slice(0, 200)}`);
}
