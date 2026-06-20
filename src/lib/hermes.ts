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
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
