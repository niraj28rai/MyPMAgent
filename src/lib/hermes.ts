import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export const hermes = createOpenAI({
  baseURL: `${process.env.HERMES_BASE_URL ?? "http://localhost:8642"}/v1`,
  apiKey: "hermes-local",
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
