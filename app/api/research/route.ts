import { connection } from "next/server";
import crypto from "node:crypto";
import { normalizeHost, isAllowedHost, isClosedHost, closedHostMessage } from "@/lib/allowlist";
import { todayISO } from "@/lib/dates";
import { askResearch } from "@/lib/lesson-service";
import { jsonError, jsonOk, readJson } from "@/lib/respond";
import { findChild, store } from "@/lib/store";

export async function POST(request: Request) {
  await connection();
  const body = await readJson<{ profileId?: string; question?: string; host?: string; note?: string; queue?: boolean }>(request);
  const profileId = body?.profileId ?? "";
  if (!store.read((db) => findChild(db, profileId))) return jsonError("לא מצאתי את הפרופיל.");

  if (body?.queue) {
    const host = normalizeHost(body.host ?? "");
    if (!host) return jsonError("צריך שם אתר ברור, כמו example.org.");
    if (isClosedHost(host)) return jsonError(closedHostMessage());
    const allowed = store.read((db) => isAllowedHost(host, db.allowlist));
    if (allowed) return jsonError("האתר הזה כבר ברשימה המאושרת.");
    store.update((db) => {
      db.siteRequests.unshift({
        id: crypto.randomUUID(),
        host,
        note: (body.note || "בקשה מהשיעור").slice(0, 180),
        from: profileId,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      db.siteRequests = db.siteRequests.slice(0, 40);
    });
    return jsonOk({ message: "הבקשה נשמרה לאבא. עד אז נשארות עם המקורות שכבר מאושרים." });
  }

  const result = await askResearch(profileId, todayISO(), body?.question ?? "");
  return jsonOk({ message: result.message, queueHost: result.queueHost });
}
