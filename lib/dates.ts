const TZ = "Asia/Jerusalem";

export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function dayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function formatHebrewDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function weekDays(iso: string): string[] {
  const [y, m, d] = iso.split("-").map(Number);
  const sundayOffset = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const start = addDays(iso, -sundayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekKey(iso: string): string {
  return weekDays(iso)[0];
}

export function dayPart(now = new Date()): "morning" | "evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  return hour < 14 ? "morning" : "evening";
}

export function profileSalt(profileId: string): number {
  if (profileId === "girl-b") return 5;
  if (profileId === "parent") return 2;
  return 0;
}
