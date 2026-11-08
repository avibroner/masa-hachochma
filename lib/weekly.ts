import { addDays, formatHebrewDate, todayISO, weekDays, weekKey } from "@/lib/dates";
import { previewSubjects } from "@/lib/planner";
import type { DB, StoredLesson } from "@/lib/store";
import { checklistKey, childProfiles, lessonKey } from "@/lib/store";
import { CHECKLIST, freshMemory, subjectLabel, type SubjectId } from "@/lib/types";

export type GirlWeek = {
  id: string;
  name: string;
  minutes: number;
  lessons: number;
  subjects: { id: SubjectId; label: string; count: number }[];
  bodyDone: number;
  englishSpoken: number;
  englishStumbled: number;
  checklistDoneDays: number;
  checklistToday: { id: string; label: string; done: boolean }[];
  visionNote: string | null;
  strengthened: string[];
  hints: string[];
  interests: string[];
  streak: number;
  todaySubject: string | null;
  todayDone: boolean;
  nextFocus: string | null;
  upcoming: { date: string; label: string; subject: string; depth: string }[];
};

export type WeekReport = {
  weekStart: string;
  weekLabel: string;
  days: { date: string; label: string }[];
  girls: GirlWeek[];
  narrative: string;
};

function templateNarrative(girls: GirlWeek[]): string {
  if (girls.every((girl) => girl.lessons === 0 && girl.checklistDoneDays === 0)) {
    return "עדיין אין שיעורים השבוע. ברגע שהילדות ילמדו, הסיכום יתמלא לבד. אפשר להתחיל מפרופיל של אחת מהן.";
  }
  return girls
    .map((girl) => {
      const paths = girl.subjects.map((subject) => subject.label).join(", ") || "עדיין בלי מסלול";
      const strong = girl.strengthened[0] ? ` מה שהתחזק: ${girl.strengthened.join(", ")}.` : "";
      return `${girl.name} למדה ${girl.minutes} דקות ב־${girl.lessons} שיעורים. המסלולים: ${paths}. הפסקת גוף סומנה ${girl.bodyDone} פעמים, ואנגלית דוברה ${girl.englishSpoken} פעמים. סדר היום הושלם ב־${girl.checklistDoneDays} ימים.${strong}`;
    })
    .join(" ");
}

export function buildWeek(db: DB, date = todayISO()): Omit<WeekReport, "narrative"> & { narrative: string } {
  const days = weekDays(date);
  const girls: GirlWeek[] = childProfiles(db).map((profile) => {
    const memory = db.memory[profile.id] ?? freshMemory(profile.id);
    const lessons = days
      .map((day) => db.lessons[lessonKey(profile.id, day)])
      .filter((lesson): lesson is StoredLesson => Boolean(lesson?.session.completedAt));
    const counts = new Map<SubjectId, number>();
    let bodyDone = 0;
    let englishSpoken = 0;
    let englishStumbled = 0;
    for (const lesson of lessons) {
      counts.set(lesson.subject, (counts.get(lesson.subject) ?? 0) + 1);
      if (lesson.session.bodyDone) bodyDone += 1;
      if (lesson.session.englishSpoken) englishSpoken += 1;
      if (lesson.session.englishStumbled) englishStumbled += 1;
      if (lesson.english.review && lesson.session.reviewSpoken) englishSpoken += 1;
    }
    const checklistDoneDays = days.filter((day) => {
      const entry = db.checklist[checklistKey(profile.id, day)];
      if (!entry) return false;
      return CHECKLIST.every((item) => entry.items[item.id]);
    }).length;
    const todayList = db.checklist[checklistKey(profile.id, date)] ?? {
      items: { bag: false, schedule: false, room: false, teeth: false, bedtime: false },
      vision: null,
    };
    const strengthened = lessons
      .filter((lesson) => lesson.session.ease === "just_right" || lesson.session.ease === "too_easy")
      .map((lesson) => lesson.subjectLabel);
    const todayLesson = db.lessons[lessonKey(profile.id, date)];
    const upcoming = previewSubjects(memory, addDays(date, todayLesson?.session.completedAt ? 1 : 0), 5);
    return {
      id: profile.id,
      name: profile.name,
      minutes: lessons.reduce((sum, lesson) => sum + (lesson.session.minutes ?? 0), 0),
      lessons: lessons.length,
      subjects: [...counts.entries()].map(([id, count]) => ({ id, label: subjectLabel(id), count })),
      bodyDone,
      englishSpoken,
      englishStumbled,
      checklistDoneDays,
      checklistToday: CHECKLIST.map((item) => ({ id: item.id, label: item.label, done: todayList.items[item.id] })),
      visionNote: todayList.vision?.message ?? null,
      strengthened: [...new Set(strengthened)].slice(0, 4),
      hints: memory.mistakes.slice(-3),
      interests: memory.interests.slice(-4),
      streak: memory.streak,
      todaySubject: todayLesson ? todayLesson.subjectLabel : subjectLabel(upcoming[0]?.subject ?? "concepts"),
      todayDone: Boolean(todayLesson?.session.completedAt),
      nextFocus: memory.tomorrowOutline?.focus ?? upcoming[0]?.focus ?? null,
      upcoming: upcoming.map((outline) => ({
        date: outline.date,
        label: formatHebrewDate(outline.date),
        subject: subjectLabel(outline.subject),
        depth: outline.depth === "deeper" ? "עמוק יותר" : outline.depth === "gentler" ? "רך יותר" : "רגיל",
      })),
    };
  });
  return {
    weekStart: weekKey(date),
    weekLabel: `${formatHebrewDate(days[0])} עד ${formatHebrewDate(days[6])}`,
    days: days.map((day) => ({ date: day, label: formatHebrewDate(day) })),
    girls,
    narrative: db.weeklyCache[weekKey(date)] || templateNarrative(girls),
  };
}

export function statsText(report: WeekReport): string {
  return report.girls
    .map((girl) =>
      [
        girl.name,
        `דקות ${girl.minutes}`,
        `שיעורים ${girl.lessons}`,
        `מסלולים ${girl.subjects.map((subject) => `${subject.label}×${subject.count}`).join(", ") || "אין"}`,
        `גוף ${girl.bodyDone}`,
        `אנגלית ${girl.englishSpoken}`,
        `חזרה על אנגלית ${girl.englishStumbled}`,
        `ימי סדר מלאים ${girl.checklistDoneDays}`,
        `התחזק ${girl.strengthened.join(", ") || "עדיין נאסף"}`,
        `עניין ${girl.interests.join(", ") || "אין"}`,
        `המשך ${girl.upcoming.map((item) => item.subject).join(", ")}`,
      ].join(" | "),
    )
    .join("\n");
}

export { templateNarrative };
