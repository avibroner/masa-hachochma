import { generateJson, visionEnabled } from "@/lib/llm";
import { systemPrompt, visionUserPrompt } from "@/lib/prompts";
import { passesSafety } from "@/lib/safety";

const HARSH = /בושה|מלוכלך|מגעיל|נורא|עצל|לא בסדר בכלל/;

export async function reviewTidiness(
  target: "room" | "bag",
  image: { mimeType: string; data: string },
): Promise<{ tidy: boolean; message: string } | null> {
  if (!visionEnabled()) return null;
  const result = await generateJson<{ tidy?: boolean; message?: string }>({
    system: systemPrompt(),
    user: visionUserPrompt(target),
    image,
    maxTokens: 300,
  });
  if (!result || typeof result.value.tidy !== "boolean") return null;
  let message = (result.value.message || "").trim();
  if (!message || !passesSafety(message) || HARSH.test(message)) {
    message = result.value.tidy
      ? "נראה שיש כאן סדר סביר. אפשר לסמן בלב שקט."
      : "עוד יש כמה דברים להרים למקום. כשתסיימי, אפשר לסמן.";
  }
  return { tidy: result.value.tidy, message };
}
