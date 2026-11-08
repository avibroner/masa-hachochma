import { seedBySlug, seedsFor, type SeedLesson } from "@/content/catalog";
import { addDays, dayIndex, profileSalt } from "@/lib/dates";
import type { ChallengeSecret, ChildMemory, Depth, Outline, SubjectId } from "@/lib/types";
import { SUBJECT_ORDER, subjectLabel } from "@/lib/types";

const FOCUS: Record<SubjectId, Record<Depth, string>> = {
  body: {
    gentler: "להבין תפקיד אחד בגוף, לאט ובלי עומס",
    standard: "לתפוס איך מערכת בגוף עובדת",
    deeper: "לחבר בין שני חלקים בגוף ולשאול מה נשבר אם אחד נחלש",
  },
  math: {
    gentler: "למצוא כלל פשוט בסדרה קצרה",
    standard: "לנסח כלל ולנבא את הצעד הבא",
    deeper: "להמציא כלל שאינו רק חיבור קבוע",
  },
  physics: {
    gentler: "לראות תופעה אחת בבית ולתת לה שם",
    standard: "להסביר תופעה ביתית בלי מכשיר מיוחד",
    deeper: "לנבא מה ישתנה אם מזיזים דבר אחד",
  },
  geography: {
    gentler: "מקום אחד בארץ: מה הוא, ואיפה בערך",
    standard: "לקשור מקום, מים, וכיוון",
    deeper: "לשאול למה המקום חשוב גם למי שגרה רחוק",
  },
  thinking: {
    gentler: "לומר דבר אחד דומה ודבר אחד שונה",
    standard: "להפריד בין דמיון לזהות",
    deeper: "להשוות דברים שלא נראים קרובים",
  },
  zoology: {
    gentler: "תפקיד אחד של בעל חיים",
    standard: "להבין איך בעל חיים חי עם אחרים או לבד",
    deeper: "לשאול מה חסר אם תפקיד אחד נעלם",
  },
  logic: {
    gentler: "להשלים כלל אם־אז אחד",
    standard: "לכתוב תנאי ותוצאה, וגם את המקרה ההפוך",
    deeper: "לשלב שני תנאים בלי לערבב אותם",
  },
  history: {
    gentler: "סיפור קצר על רעיון ישן, בלי תאריכים מומצאים",
    standard: "להבין איך המצאה ביתית עבדה",
    deeper: "לשאול איזו זהירות באה עם ההמצאה",
  },
  science: {
    gentler: "לעקוב אחרי שינוי אחד שאפשר לראות",
    standard: "לתאר מחזור או תהליך בשלבים",
    deeper: "להסביר למה התהליך מואט או מואץ",
  },
  home: {
    gentler: "סדר אחד שעוזר בבית",
    standard: "להבחין בין סוגי מידה ובין שלבי הכנה",
    deeper: "לבנות סדר עבודה שלם למטלה ביתית",
  },
  rhythm: {
    gentler: "לחזור על יחידת קצב קצרה",
    standard: "לזהות את הכלל שחוזר בזמן",
    deeper: "להמציא קצב שאפשר למסור לאחרת",
  },
  concepts: {
    gentler: "מילה אחת, דוגמה אחת",
    standard: "להגדיר מושג דרך תפקיד ומטרה",
    deeper: "לבדוק מה נשבר כשחלק חסר",
  },
  english: {
    gentler: "לזהות את סדר המילים בבקשה קצרה",
    standard: "להבין למה הסדר באנגלית נושא משמעות",
    deeper: "לבנות בקשה חדשה באותו שלד",
  },
};

export function depthFor(memory: ChildMemory, subject: SubjectId): Depth {
  const ease = memory.subjectEase[subject];
  if (ease === "too_easy") return "deeper";
  if (ease === "too_hard") return "gentler";
  return "standard";
}

export function planOutline(input: {
  date: string;
  memory: ChildMemory;
  salt?: number;
  override?: SubjectId | null;
}): Outline {
  const salt = input.salt ?? profileSalt(input.memory.profileId);
  if (input.override) {
    const depth = depthFor(input.memory, input.override);
    return {
      date: input.date,
      subject: input.override,
      depth,
      focus: FOCUS[input.override][depth],
      reason: "אבא בחר את הכיוון",
    };
  }

  const recent = new Set(input.memory.topicsDone.slice(-6).map((topic) => topic.subject));
  const yesterday = input.memory.topicsDone.at(-1)?.subject;
  const start = (dayIndex(input.date) + salt) % SUBJECT_ORDER.length;

  let fallback: SubjectId = SUBJECT_ORDER[start];
  for (let i = 0; i < SUBJECT_ORDER.length; i += 1) {
    const subject = SUBJECT_ORDER[(start + i) % SUBJECT_ORDER.length];
    fallback = subject;
    if (subject === yesterday) continue;
    if (input.memory.subjectEase[subject] === "too_hard" && i < 4) continue;
    if (recent.has(subject) && i < SUBJECT_ORDER.length - 1) continue;
    const depth = depthFor(input.memory, subject);
    return {
      date: input.date,
      subject,
      depth,
      focus: FOCUS[subject][depth],
      reason:
        depth === "deeper"
          ? "הנושא הקודם היה קל, אז היום מעמיקים במסלול אחר"
          : depth === "gentler"
            ? "שומרים על עניין בלי לחזור מיד על מה שהיה כבד"
            : "מסלול מתחלף כדי שהשבוע לא יישאר באותו צבע",
    };
  }

  const depth = depthFor(input.memory, fallback);
  return {
    date: input.date,
    subject: fallback,
    depth,
    focus: FOCUS[fallback][depth],
    reason: "חזרה זהירה אחרי שהשבוע כבר נגע בהרבה מסלולים",
  };
}

export function resolveOutline(memory: ChildMemory, date: string): Outline {
  if (memory.parentOverride?.date === date) {
    return planOutline({ date, memory, override: memory.parentOverride.subject });
  }
  if (memory.tomorrowOutline?.date === date) return memory.tomorrowOutline;
  return planOutline({ date, memory });
}

export function pickSeed(subject: SubjectId, doneSlugs: string[]): SeedLesson {
  const options = seedsFor(subject);
  const fresh = options.find((lesson) => !doneSlugs.includes(lesson.slug));
  if (fresh) return fresh;
  if (!options.length) {
    const fallback = seedBySlug("heart");
    if (!fallback) throw new Error("catalog empty");
    return fallback;
  }
  return options[doneSlugs.length % options.length];
}

export function presentChallenge(seed: SeedLesson, depth: Depth): ChallengeSecret {
  const keywords = depth === "deeper" ? [...seed.challenge.keywords, ...seed.challenge.deeperKeywords] : seed.challenge.keywords;
  return {
    kind: seed.challenge.kind,
    prompt: depth === "deeper" ? seed.challenge.deeper : seed.challenge.prompt,
    scaffold: depth === "gentler" ? seed.challenge.gentler : null,
    hint: seed.challenge.hint,
    keywords,
    misconceptions: seed.challenge.misconceptions,
    refine: seed.challenge.refine,
  };
}

export function normalizeAnswer(text: string): string {
  return text.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

export function reviewChallenge(
  answer: string,
  secret: ChallengeSecret,
  attemptsSoFar: number,
): { feedback: string; ready: boolean; flagged?: boolean } {
  const clean = answer.trim();
  if (clean.length < 2) {
    return { feedback: "אפשר לכתוב גם משפט קצר. מה את חושבת?", ready: false };
  }
  const norm = normalizeAnswer(clean);
  if (attemptsSoFar >= 2) {
    return { feedback: `נמשיך יחד. ${secret.refine}`, ready: true };
  }
  for (const item of secret.misconceptions) {
    if (norm.includes(normalizeAnswer(item.pattern))) {
      return { feedback: item.hint, ready: false };
    }
  }
  const hit = secret.keywords.some((word) => norm.includes(normalizeAnswer(word)));
  if (hit) {
    return { feedback: `יש כאן כיוון נכון. ${secret.refine}`, ready: true };
  }
  if (attemptsSoFar >= 1) {
    return { feedback: `נמשיך יחד, בלי למהר. ${secret.refine}`, ready: true };
  }
  return { feedback: secret.hint, ready: false };
}

export function checkConclusion(text: string, facts: string[]): { ok: boolean; message: string } {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length < 12) {
    return { ok: false, message: "משפט אחד קצר במילים שלך יספיק. מה הבנת מן העובדות?" };
  }
  const norm = normalizeAnswer(cleaned);
  for (const fact of facts) {
    const factNorm = normalizeAnswer(fact);
    if (!factNorm) continue;
    if (norm === factNorm) {
      return { ok: false, message: "זה אותו משפט כמו במקור. נסי לנסח בעצמך, במשפט אחד." };
    }
    const slice = factNorm.slice(0, Math.min(42, factNorm.length));
    if (slice.length > 24 && norm.includes(slice)) {
      return { ok: false, message: "זה קרוב מאוד לניסוח של המקור. מה המשפט שלך, לא ההעתקה?" };
    }
  }
  return { ok: true, message: "כתבת במילים שלך. זה בדיוק חקר." };
}

export function computeStars(input: {
  challengeReady: boolean;
  challengeAttempts: number;
  conclusionReady: boolean;
  bodyDone: boolean | null;
}): { thinking: number; research: number; body: number } {
  const thinking = !input.challengeReady ? 1 : input.challengeAttempts <= 1 ? 3 : 2;
  const research = input.conclusionReady ? 3 : 1;
  const body = input.bodyDone === true ? 3 : 1;
  return { thinking, research, body };
}

export function previewSubjects(memory: ChildMemory, startDate: string, days: number): Outline[] {
  const ghost: ChildMemory = {
    ...memory,
    topicsDone: [...memory.topicsDone],
    subjectEase: { ...memory.subjectEase },
    parentOverride: null,
    tomorrowOutline: memory.tomorrowOutline ? { ...memory.tomorrowOutline } : null,
  };
  const out: Outline[] = [];
  let cursor = startDate;
  for (let i = 0; i < days; i += 1) {
    const outline = resolveOutline(ghost, cursor);
    out.push(outline);
    ghost.topicsDone.push({
      date: cursor,
      slug: outline.subject,
      subject: outline.subject,
      title: subjectLabel(outline.subject),
      ease: "just_right",
      interest: "",
      minutes: 0,
      stars: { thinking: 0, research: 0, body: 0 },
      hinted: false,
    });
    ghost.tomorrowOutline = null;
    ghost.parentOverride = null;
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function openingThanks(note: string): string {
  const text = note.trim();
  if (!text) return "אפשר גם רק לחשוב בלחש. כשנהיה מוכנות, נמשיך.";
  if (text.length < 12) return "תודה שחלקת. נשמור את הכיוון ונמשיך ממנו.";
  return "כתבת מחשבה של ממש. ניקח אותה איתנו אל ההסבר.";
}

export function starLine(kind: "thinking" | "research" | "body", count: number): string {
  if (kind === "thinking") {
    if (count >= 3) return "החשיבה הייתה מדויקת כבר בניסיון הראשון.";
    if (count === 2) return "השתמשת ברמז ודייקת. כך לומדים.";
    return "נגענו באתגר. מחר הוא יהיה מוכר יותר.";
  }
  if (kind === "research") {
    if (count >= 3) return "המסקנה נכתבה במילים שלך.";
    return "החקר מחכה למשפט אחד משלך בפעם הבאה.";
  }
  if (count >= 3) return "הגוף קיבל את ההפסקה שמגיעה לו.";
  return "ההפסקה שמורה להמשך היום, בלי חובה להרגיש איחור.";
}
