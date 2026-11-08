import { connection } from "next/server";
import { dayPart, todayISO } from "@/lib/dates";
import { visionEnabled } from "@/lib/llm";
import { jsonError, jsonOk, readJson } from "@/lib/respond";
import { checklistKey, emptyChecklist, findChild, store } from "@/lib/store";
import { CHECKLIST, type ChecklistItemId } from "@/lib/types";
import { addDays } from "@/lib/dates";

const IDS = new Set(CHECKLIST.map((item) => item.id));

export async function GET(request: Request) {
  await connection();
  const profileId = new URL(request.url).searchParams.get("profileId") ?? "";
  const profile = store.read((db) => findChild(db, profileId));
  if (!profile) return jsonError("לא מצאתי את הפרופיל.", 404);
  const date = todayISO();
  const day = store.read((db) => db.checklist[checklistKey(profileId, date)] ?? emptyChecklist());
  return jsonOk({
    name: profile.name,
    date,
    period: dayPart(),
    vision: visionEnabled(),
    items: CHECKLIST.map((item) => ({ ...item, done: day.items[item.id] })),
    visionNote: day.vision,
  });
}

export async function POST(request: Request) {
  await connection();
  const body = await readJson<{ profileId?: string; item?: ChecklistItemId; done?: boolean }>(request);
  const profileId = body?.profileId ?? "";
  if (!store.read((db) => findChild(db, profileId))) return jsonError("לא מצאתי את הפרופיל.");
  if (!body?.item || !IDS.has(body.item) || typeof body.done !== "boolean") return jsonError("סימון לא ברור.");
  const date = todayISO();
  const saved = store.update((db) => {
    const key = checklistKey(profileId, date);
    const current = db.checklist[key] ?? emptyChecklist();
    current.items[body.item as ChecklistItemId] = body.done as boolean;
    db.checklist[key] = current;
    const complete = CHECKLIST.every((item) => current.items[item.id]);
    const memory = db.memory[profileId];
    if (complete && memory.lastChecklistDate !== date) {
      memory.checklistStreak = memory.lastChecklistDate && addDays(memory.lastChecklistDate, 1) === date ? memory.checklistStreak + 1 : 1;
      memory.lastChecklistDate = date;
    }
    return current;
  });
  return jsonOk({
    items: CHECKLIST.map((item) => ({ ...item, done: saved.items[item.id] })),
    visionNote: saved.vision,
  });
}
