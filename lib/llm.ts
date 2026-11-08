import { parseModelJson } from "@/lib/json";

export type LlmResult = { text: string; model: string };

const GEMINI_FALLBACKS = ["gemini-3.5-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"];

export function llmStatus(): { enabled: boolean; provider: "gemini" | "openai" | null } {
  if (process.env.GEMINI_API_KEY) return { enabled: true, provider: "gemini" };
  if (process.env.OPENAI_API_KEY) return { enabled: true, provider: "openai" };
  return { enabled: false, provider: null };
}

export function visionEnabled(): boolean {
  if (process.env.LLM_VISION === "0") return false;
  return llmStatus().enabled;
}

function unique(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function statusOf(error: unknown): number | null {
  if (typeof error === "object" && error && "status" in error && typeof error.status === "number") {
    return error.status;
  }
  return null;
}

function isModelMissing(error: unknown): boolean {
  const status = statusOf(error);
  const message = error instanceof Error ? error.message : "";
  return status === 404 || /not found|not supported|unknown model|is not found/i.test(message);
}

function isThinkingRejected(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return statusOf(error) === 400 && /thinking/i.test(message);
}

async function geminiOnce(
  model: string,
  input: { system: string; user: string; json?: boolean; image?: { mimeType: string; data: string }; maxTokens?: number },
  withThinking: boolean,
): Promise<LlmResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const parts: Record<string, unknown>[] = [{ text: input.user }];
  if (input.image) parts.push({ inlineData: { mimeType: input.image.mimeType, data: input.image.data } });
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: input.maxTokens ?? 2048,
    responseMimeType: input.json ? "application/json" : "text/plain",
  };
  if (withThinking) generationConfig.thinkingConfig = { thinkingLevel: "minimal" };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ role: "user", parts }],
      generationConfig,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    const error = new Error(`gemini ${response.status}: ${detail}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought && part.text)
    .map((part) => part.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("empty gemini response");
  return { text, model };
}

async function gemini(
  model: string,
  input: { system: string; user: string; json?: boolean; image?: { mimeType: string; data: string }; maxTokens?: number },
): Promise<LlmResult> {
  try {
    return await geminiOnce(model, input, true);
  } catch (error) {
    if (isThinkingRejected(error)) return geminiOnce(model, input, false);
    throw error;
  }
}

async function openai(input: {
  system: string;
  user: string;
  json?: boolean;
  image?: { mimeType: string; data: string };
  maxTokens?: number;
}): Promise<LlmResult> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const content: Record<string, unknown>[] = [{ type: "text", text: input.user }];
  if (input.image) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${input.image.mimeType};base64,${input.image.data}` },
    });
  }
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: input.maxTokens ?? 2048,
      response_format: input.json ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.image ? content : input.user },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    const error = new Error(`openai ${response.status}: ${detail}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("empty openai response");
  return { text, model };
}

export async function generateText(input: {
  system: string;
  user: string;
  json?: boolean;
  image?: { mimeType: string; data: string };
  maxTokens?: number;
}): Promise<LlmResult | null> {
  if (process.env.GEMINI_API_KEY) {
    const models = unique([process.env.GEMINI_MODEL, ...GEMINI_FALLBACKS]);
    let lastError: unknown;
    for (const model of models) {
      try {
        return await gemini(model, input);
      } catch (error) {
        lastError = error;
        if (!isModelMissing(error)) break;
      }
    }
    console.error("gemini failed", lastError);
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return await openai(input);
    } catch (error) {
      console.error("openai failed", error);
    }
  }
  return null;
}

export async function generateJson<T>(input: {
  system: string;
  user: string;
  image?: { mimeType: string; data: string };
  maxTokens?: number;
}): Promise<{ value: T; model: string } | null> {
  const result = await generateText({ ...input, json: true });
  if (!result) return null;
  try {
    return { value: parseModelJson(result.text) as T, model: result.model };
  } catch (error) {
    console.error("json parse failed", error);
    return null;
  }
}
