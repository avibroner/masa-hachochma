import crypto from "node:crypto";
import { connection } from "next/server";
import { closedHostMessage, isAllowedHost, isClosedHost, normalizeHost } from "@/lib/allowlist";
import { addDays, todayISO, weekKey } from "@/lib/dates";
import { generateJson, llmStatus } from "@/lib/llm";
import { systemPrompt, weeklyUserPrompt } from "@/lib/prompts";
import { jsonError, jsonOk, readJson } from "@/lib/respond";
import { passesSafety } from "@/lib/safety";
import { defaultDB, issueToken, store, validToken } from "@/lib/store";
import { SUBJECTS, freshMemory, type SubjectId } from "@/lib/types";
import { buildWeek, statsText } from "@/lib/weekly";

function authorized(request: Request): boolean {
  return store.read((db) => validToken(db, request.headers.get("x-parent-token")));
}

const SUBJECT_IDS = new Set(SUBJECTS.map((subject) => subject.id));

export async function GET(request: Request) {
  await connection();
  if (!authorized(request)) return jsonError("צריך קוד של אבא.", 401);
  const date = todayISO();
  let report = store.read((db) => buildWeek(db, date));
  if (llmStatus().enabled && !store.read((db) => db.weeklyCache[weekKey(date)])) {
    const ai = await generateJson<{ paragraph?: string }>({
      system: systemPrompt(),
      user: weeklyUserPrompt(statsText(report)),
      maxTokens: 500,
    });
    const paragraph = ai?.value.paragraph?.trim();
    if (paragraph && passesSafety(paragraph)) {
      store.update((db) => {
        db.weeklyCache[weekKey(date)] = paragraph;
      });
      report = store.read((db) => buildWeek(db, date));
    }
  }
  const settings = store.read((db) => ({
    profiles: db.profiles.filter((profile) => profile.role === "child").map((profile) => ({ id: profile.id, name: profile.name })),
    allowlist: db.allowlist,
    siteRequests: db.siteRequests,
    subjects: SUBJECTS.map((subject) => ({ id: subject.id, label: subject.label })),
  }));
  return jsonOk({ report, ...settings, llm: llmStatus().enabled });
}

type ParentBody = {
  action?: string;
  pin?: string;
  nextPin?: string;
  profileId?: string;
  name?: string;
  host?: string;
  label?: string;
  requestId?: string;
  decision?: "approved" | "declined";
  subject?: SubjectId;
  forDate?: "today" | "tomorrow";
};

export async function POST(request: Request) {
  await connection();
  const body = await readJson<ParentBody>(request);
  if (body?.action === "unlock") {
    const pin = body.pin ?? "";
    const token = store.update((db) => (pin === db.pin ? issueToken(db) : null));
    if (!token) return jsonError("הקוד לא מתאים.", 401);
    return jsonOk({ token });
  }
  if (!authorized(request)) return jsonError("צריך קוד של אבא.", 401);

  if (body?.action === "rename") {
    const name = body.name?.trim() ?? "";
    if (name.length < 2 || name.length > 24) return jsonError("השם צריך להיות קצר וברור.");
    if (!/^[\p{L}\p{N}\s"'\-]+$/u.test(name)) return jsonError("השם יכול לכלול אותיות ומספרים.");
    const updated = store.update((db) => {
      const profile = db.profiles.find((item) => item.id === body.profileId && item.role === "child");
      if (!profile) return false;
      profile.name = name;
      return true;
    });
    if (!updated) return jsonError("לא מצאתי פרופיל.");
    return jsonOk();
  }

  if (body?.action === "pin") {
    const next = body.nextPin ?? "";
    if (!/^\d{4,6}$/.test(next)) return jsonError("הקוד החדש הוא 4 עד 6 ספרות.");
    store.update((db) => {
      db.pin = next;
    });
    return jsonOk();
  }

  if (body?.action === "allow-add") {
    const host = normalizeHost(body.host ?? "");
    if (!host) return jsonError("צריך כתובת אתר תקינה, בלי נתיב חיפוש.");
    if (isClosedHost(host)) return jsonError(closedHostMessage());
    store.update((db) => {
      if (!isAllowedHost(host, db.allowlist)) {
        db.allowlist.push({ host, label: (body.label || host).slice(0, 40) });
      }
    });
    return jsonOk();
  }

  if (body?.action === "allow-remove") {
    const host = normalizeHost(body.host ?? "");
    if (!host) return jsonError("אתר לא ברור.");
    store.update((db) => {
      db.allowlist = db.allowlist.filter((entry) => entry.host !== host);
    });
    return jsonOk();
  }

  if (body?.action === "site-request") {
    const host = normalizeHost(body.host ?? "");
    if (!host) return jsonError("צריך שם אתר ברור.");
    if (isClosedHost(host)) return jsonError(closedHostMessage());
    store.update((db) => {
      db.siteRequests.unshift({
        id: crypto.randomUUID(),
        host,
        note: "בקשה מאבא",
        from: "parent",
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    });
    return jsonOk();
  }

  if (body?.action === "site-resolve") {
    store.update((db) => {
      const item = db.siteRequests.find((request) => request.id === body.requestId);
      if (!item || (body.decision !== "approved" && body.decision !== "declined")) return;
      item.status = body.decision;
      if (body.decision === "approved" && !isClosedHost(item.host) && !isAllowedHost(item.host, db.allowlist)) {
        db.allowlist.push({ host: item.host, label: item.host });
      }
    });
    return jsonOk();
  }

  if (body?.action === "override") {
    if (!body.subject || !SUBJECT_IDS.has(body.subject) || (body.profileId !== "girl-a" && body.profileId !== "girl-b")) {
      return jsonError("בחירת מסלול לא ברורה.");
    }
    const date = todayISO();
    store.update((db) => {
      const memory = db.memory[body.profileId as string] ?? freshMemory(body.profileId as string);
      db.memory[body.profileId as string] = memory;
      const started = Boolean(db.lessons[`${body.profileId}|${date}`]);
      const target = !started && body.forDate !== "tomorrow" ? date : addDays(date, 1);
      memory.parentOverride = { subject: body.subject as SubjectId, date: target };
      if (memory.tomorrowOutline?.date === target) memory.tomorrowOutline = null;
    });
    return jsonOk();
  }

  if (body?.action === "reset") {
    store.update((db) => {
      const fresh = defaultDB();
      db.lessons = {};
      db.checklist = {};
      db.weeklyCache = {};
      db.householdEnglish = {};
      db.memory = fresh.memory;
      for (const profile of db.profiles.filter((item) => item.role === "child")) {
        db.memory[profile.id] = freshMemory(profile.id);
      }
    });
    return jsonOk();
  }

  return jsonError("פעולה לא מוכרת.");
}
