import type { AllowEntry, Fact } from "@/lib/types";
import { isAllowedHost, normalizeHost } from "@/lib/allowlist";
import { boundaryIssue } from "@/lib/safety";

const WIKI_HOSTS = new Set(["he.wikipedia.org", "simple.wikipedia.org"]);

export function splitSentences(text: string): string[] {
  return text
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 40 && part.length <= 260 && !part.includes("ראו גם"));
}

export async function fetchWikiSentences(
  host: string,
  title: string,
  allowlist: AllowEntry[],
): Promise<{ title: string; sentences: string[] } | null> {
  const normalized = normalizeHost(host);
  if (!normalized || !WIKI_HOSTS.has(normalized) || !isAllowedHost(normalized, allowlist)) return null;
  const endpoint = new URL(`https://${normalized}/w/api.php`);
  endpoint.searchParams.set("action", "query");
  endpoint.searchParams.set("prop", "extracts");
  endpoint.searchParams.set("exintro", "1");
  endpoint.searchParams.set("explaintext", "1");
  endpoint.searchParams.set("redirects", "1");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("titles", title);
  try {
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "MasaHaChochma/1.0 (home learning; local educational use)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      query?: { pages?: Record<string, { title?: string; extract?: string; missing?: string }> };
    };
    const page = Object.values(data.query?.pages ?? {})[0];
    if (!page?.extract || page.missing !== undefined) return null;
    const sentences = splitSentences(page.extract).slice(0, 2);
    if (!sentences.length) return null;
    return { title: page.title || title, sentences };
  } catch {
    return null;
  }
}

export function mergeFacts(localFacts: string[], wiki: { title: string; sentences: string[] } | null): Fact[] {
  const facts: Fact[] = [];
  if (wiki) {
    for (const sentence of wiki.sentences) {
      if (facts.length >= 2) break;
      facts.push({
        text: sentence,
        sourceName: `ויקיפדיה בעברית, ערך ${wiki.title}`,
        sourceHost: "he.wikipedia.org",
      });
    }
  }
  for (const text of localFacts) {
    if (facts.length >= 3) break;
    facts.push({ text, sourceName: "ספריית מסע החכמה", sourceHost: "local" });
  }
  return facts.slice(0, 3);
}

export function answerFromFacts(question: string, facts: { text: string }[]): { covered: boolean; answer: string } {
  if (boundaryIssue(question)) {
    return { covered: false, answer: "" };
  }
  const stop = new Set(["של", "על", "את", "עם", "מה", "איך", "למה", "הוא", "היא", "אני", "זה", "זו", "יש", "אין", "לא", "כן", "גם"]);
  const words = question
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((word) => word.length >= 2 && !stop.has(word));
  let best: { text: string; score: number } | null = null;
  for (const fact of facts) {
    const score = words.filter((word) => fact.text.includes(word)).length;
    if (!best || score > best.score) best = { text: fact.text, score };
  }
  if (!best || best.score < 1) return { covered: false, answer: "" };
  return {
    covered: true,
    answer: `במקור המאושר להיום כתוב: ${best.text} מה את מבינה מזה, במשפט שלך?`,
  };
}

export function mentionedHost(text: string): string | null {
  const match = text.match(/([a-z0-9.-]+\.[a-z]{2,})/i);
  return match ? normalizeHost(match[1]) : null;
}
