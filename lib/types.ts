export type SubjectId =
  | "body"
  | "math"
  | "physics"
  | "geography"
  | "thinking"
  | "zoology"
  | "logic"
  | "history"
  | "science"
  | "home"
  | "rhythm"
  | "concepts"
  | "english";

export type DiagramId =
  | "heart"
  | "lungs"
  | "pattern"
  | "light"
  | "magnet"
  | "lake"
  | "compare"
  | "bee"
  | "ifthen"
  | "lamp"
  | "water"
  | "measure"
  | "rhythm"
  | "system"
  | "english";

export type Depth = "gentler" | "standard" | "deeper";
export type Ease = "too_easy" | "just_right" | "too_hard";
export type ChallengeKind = "riddle" | "what-if" | "find-mistake";

export type SubjectMeta = {
  id: SubjectId;
  label: string;
  blurb: string;
};

export const SUBJECTS: SubjectMeta[] = [
  { id: "body", label: "גוף האדם", blurb: "איך המערכות עובדות, בעדינות ובפליאה" },
  { id: "math", label: "מתמטיקה", blurb: "דפוסים, סדר, וחידות" },
  { id: "physics", label: "פיזיקה של הבית", blurb: "אור, מגנט, תנועה מתוך החיים בבית" },
  { id: "geography", label: "ארץ ישראל", blurb: "מקומות, מים, וכיוונים" },
  { id: "thinking", label: "חשיבה", blurb: "להשוות, להבחין, ולדייק" },
  { id: "zoology", label: "בעלי חיים", blurb: "יצורים, תפקידים, ופליאה" },
  { id: "logic", label: "היגיון", blurb: "אם־אז, כללים, וסדר" },
  { id: "history", label: "סיפורי המצאה", blurb: "איך רעיון קטן שינה את הבית" },
  { id: "science", label: "מדע", blurb: "תופעות שאפשר לראות מסביב" },
  { id: "home", label: "כלכלת בית", blurb: "סדר, מידה, ואחריות" },
  { id: "rhythm", label: "קצב", blurb: "דפוס בזמן, בגוף ובמחיאות" },
  { id: "concepts", label: "מושגים", blurb: "מילה אחת שפותחת הבנה" },
  { id: "english", label: "אנגלית", blurb: "איך משפט אנגלי בנוי, בנימוס" },
];

export const SUBJECT_ORDER: SubjectId[] = SUBJECTS.map((s) => s.id);

export function subjectLabel(id: SubjectId): string {
  return SUBJECTS.find((s) => s.id === id)?.label ?? id;
}

export const KIND_LABEL: Record<ChallengeKind, string> = {
  riddle: "חידה",
  "what-if": "מה אם",
  "find-mistake": "מצאי את הטעות",
};

export type EnglishSentence = {
  id: string;
  sentence: string;
  translation: string;
  pronunciation: string;
  situation: string;
  situationAgain: string;
  words: { en: string; he: string }[];
};

export type Fact = {
  text: string;
  sourceName: string;
  sourceHost: string;
};

export type ChallengeSecret = {
  kind: ChallengeKind;
  prompt: string;
  scaffold: string | null;
  hint: string;
  keywords: string[];
  misconceptions: { pattern: string; hint: string }[];
  refine: string;
};

export type Outline = {
  date: string;
  subject: SubjectId;
  depth: Depth;
  focus: string;
  reason: string;
};

export type TopicDone = {
  date: string;
  slug: string;
  subject: SubjectId;
  title: string;
  ease: Ease | null;
  interest: string;
  minutes: number;
  stars: { thinking: number; research: number; body: number };
  hinted: boolean;
};

export type ChildMemory = {
  profileId: string;
  topicsDone: TopicDone[];
  interests: string[];
  englishMastered: string[];
  englishNeedsRepeat: string[];
  mistakes: string[];
  streak: number;
  lastLessonDate: string | null;
  checklistStreak: number;
  lastChecklistDate: string | null;
  subjectEase: Partial<Record<SubjectId, Ease>>;
  subjectCounts: Partial<Record<SubjectId, number>>;
  tomorrowOutline: Outline | null;
  parentOverride: { subject: SubjectId; date: string } | null;
  totalMinutes: number;
};

export type PublicSentence = {
  id: string;
  sentence: string;
  translation: string;
  pronunciation: string;
  words: { en: string; he: string }[];
};

export type StudentLesson = {
  profileId: string;
  profileName: string;
  date: string;
  dateLabel: string;
  fromCache: boolean;
  source: "seed" | "ai";
  model: string | null;
  subject: SubjectId;
  subjectLabel: string;
  slug: string;
  title: string;
  diagram: DiagramId;
  depth: Depth;
  note: string;
  opening: { nogaLine: string; question: string };
  teaching: { story: string; explanation: string; example: string };
  challenge: {
    kind: ChallengeKind;
    kindLabel: string;
    prompt: string;
    scaffold: string | null;
  };
  research: { prompt: string; facts: { text: string; sourceName: string }[] };
  english: {
    shared: PublicSentence;
    situation: string;
    repeatingShared: boolean;
    review: (PublicSentence & { situation: string }) | null;
  };
  body: { title: string; why: string; steps: string[]; minutes: number };
  closing: { teaser: string; praise: string };
  session: LessonSessionPublic;
};

export type LessonSessionPublic = {
  step: number;
  openingNote: string;
  challengeAnswer: string;
  challengeFeedback: string;
  challengeReady: boolean;
  challengeAttempts: number;
  conclusion: string;
  conclusionFeedback: string;
  conclusionReady: boolean;
  englishSpoken: boolean;
  englishStumbled: boolean | null;
  reviewSpoken: boolean;
  reviewStumbled: boolean | null;
  bodyDone: boolean | null;
  ease: Ease | null;
  interest: string;
  completed: boolean;
  stars: { thinking: number; research: number; body: number } | null;
  minutes: number | null;
};

export type ChecklistItemId = "bag" | "schedule" | "room" | "teeth" | "bedtime";

export type ChecklistDay = {
  items: Record<ChecklistItemId, boolean>;
  vision: { target: "room" | "bag"; tidy: boolean; message: string } | null;
};

export type Profile = { id: string; name: string; role: "child" | "parent" };

export type AllowEntry = { host: string; label: string };

export type SiteRequest = {
  id: string;
  host: string;
  note: string;
  from: string;
  createdAt: string;
  status: "pending" | "approved" | "declined";
};

export const CHECKLIST: { id: ChecklistItemId; label: string; ask: string }[] = [
  { id: "bag", label: "התיק ארוז", ask: "התיק כבר ארוז ליום הבא?" },
  { id: "schedule", label: "מערכת ושיעורים מוכנים", ask: "יש מערכת למחר?" },
  { id: "room", label: "החדר מסודר", ask: "האם כבר סידרת את החדר?" },
  { id: "teeth", label: "צחצוח שיניים", ask: "צחצחת שיניים?" },
  { id: "bedtime", label: "שעת שינה סבירה", ask: "שעת השינה היום סבירה?" },
];

export const STEP_LABELS = ["פתיחה", "הסבר", "אתגר", "חקר", "אנגלית", "גוף", "סיום"] as const;

export function freshMemory(profileId: string): ChildMemory {
  return {
    profileId,
    topicsDone: [],
    interests: [],
    englishMastered: [],
    englishNeedsRepeat: [],
    mistakes: [],
    streak: 0,
    lastLessonDate: null,
    checklistStreak: 0,
    lastChecklistDate: null,
    subjectEase: {},
    subjectCounts: {},
    tomorrowOutline: null,
    parentOverride: null,
    totalMinutes: 0,
  };
}
