import { connection } from "next/server";
import { dayPart, formatHebrewDate, todayISO, weekDays } from "@/lib/dates";
import { peekHome } from "@/lib/lesson-service";
import { llmStatus, visionEnabled } from "@/lib/llm";
import { jsonError, jsonOk } from "@/lib/respond";
import { checklistKey, store } from "@/lib/store";
import { CHECKLIST, subjectLabel } from "@/lib/types";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await context.params;
  const date = todayISO();
  const home = peekHome(id, date);
  if (!home) return jsonError("לא מצאתי את הפרופיל.", 404);
  const checklist = store.read((db) => db.checklist[checklistKey(id, date)]);
  const items = CHECKLIST.map((item) => ({
    ...item,
    done: checklist?.items[item.id] ?? false,
  }));
  const week = weekDays(date).map((day) => {
    const lesson = store.read((db) => db.lessons[`${id}|${day}`]);
    return {
      date: day,
      label: formatHebrewDate(day),
      state: day === date ? "today" : day < date ? "past" : "ahead",
      subject: lesson ? lesson.subjectLabel : day === date ? subjectLabel(home.outline.subject) : null,
      done: Boolean(lesson?.session.completedAt),
    };
  });
  return jsonOk({
    profile: { id: home.profile.id, name: home.profile.name },
    streak: home.memory.streak,
    totalMinutes: home.memory.totalMinutes,
    llm: llmStatus().enabled,
    vision: visionEnabled(),
    period: dayPart(),
    plannedSubject: subjectLabel(home.outline.subject),
    plannedFocus: home.outline.focus,
    depth: home.outline.depth,
    lesson: home.lesson,
    teaser: home.teaser,
    checklist: { done: items.filter((item) => item.done).length, total: items.length, items, vision: checklist?.vision ?? null },
    week,
  });
}
