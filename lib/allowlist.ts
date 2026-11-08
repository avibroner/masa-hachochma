import type { AllowEntry } from "./types";

const CLOSED = [
  "google.com",
  "youtube.com",
  "youtu.be",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "snapchat.com",
  "netflix.com",
  "telegram.org",
  "whatsapp.com",
];

export function normalizeHost(input: string): string | null {
  let raw = input.trim().toLowerCase();
  if (!raw) return null;
  raw = raw.replace(/^https?:\/\//, "");
  raw = raw.split("/")[0]?.split("?")[0]?.split("#")[0] ?? "";
  raw = raw.replace(/\.$/, "");
  if (raw.startsWith("www.")) raw = raw.slice(4);
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(raw)) return null;
  return raw;
}

export function isClosedHost(host: string): boolean {
  return CLOSED.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

export function isAllowedHost(host: string, allowlist: Pick<AllowEntry, "host">[]): boolean {
  const normalized = normalizeHost(host) ?? host;
  if (isClosedHost(normalized)) return false;
  return allowlist.some((entry) => {
    const allowed = normalizeHost(entry.host) ?? entry.host;
    return normalized === allowed || normalized.endsWith(`.${allowed}`);
  });
}

export function closedHostMessage(): string {
  return "האתר הזה נשאר סגור. מסע החכמה לא שולח את הילדות לחיפוש פתוח, ליוטיוב או לרשתות.";
}
