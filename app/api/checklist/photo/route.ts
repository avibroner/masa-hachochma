import { connection } from "next/server";
import { todayISO } from "@/lib/dates";
import { visionEnabled } from "@/lib/llm";
import { jsonError, jsonOk } from "@/lib/respond";
import { checklistKey, emptyChecklist, findChild, store } from "@/lib/store";
import { reviewTidiness } from "@/lib/vision";

export async function POST(request: Request) {
  await connection();
  if (!visionEnabled()) return jsonError("בלי מפתח API מדלגים על בדיקת תמונה ונשארים עם הסימון.", 400);
  const form = await request.formData();
  const profileId = String(form.get("profileId") ?? "");
  const target = form.get("target") === "bag" ? "bag" : form.get("target") === "room" ? "room" : null;
  const file = form.get("image");
  if (!store.read((db) => findChild(db, profileId)) || !target || !(file instanceof File)) {
    return jsonError("צריך תמונה של חדר או של תיק.");
  }
  if (file.size > 1_500_000) return jsonError("התמונה גדולה מדי. אפשר לבחור תמונה קטנה יותר.");
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    return jsonError("אפשר לשלוח תמונת JPG, PNG או WEBP.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await reviewTidiness(target, { mimeType: file.type, data: bytes.toString("base64") });
  if (!result) return jsonError("לא הצלחתי לראות את התמונה. אפשר פשוט לסמן ברשימה.");
  const date = todayISO();
  store.update((db) => {
    const key = checklistKey(profileId, date);
    const current = db.checklist[key] ?? emptyChecklist();
    current.vision = { target, tidy: result.tidy, message: result.message };
    db.checklist[key] = current;
  });
  return jsonOk({ vision: { target, tidy: result.tidy, message: result.message } });
}
