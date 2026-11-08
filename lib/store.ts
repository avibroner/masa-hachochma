import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {
  AllowEntry,
  ChecklistDay,
  ChecklistItemId,
  ChildMemory,
  Profile,
  SiteRequest,
  StudentLesson,
} from "@/lib/types";
import { freshMemory } from "@/lib/types";
import type { ChallengeSecret, Depth, DiagramId, Ease, Outline, SubjectId } from "@/lib/types";

export type LessonSession = {
  step: number;
  startedAt: string;
  openingNote: string;
  challengeAnswer: string;
  challengeFeedback: string;
  challengeReady: boolean;
  challengeAttempts: number;
  conclusion: string;
  conclusionFeedback: string;
  conclusionReady: boolean;
  englishSpoken: boolean;
  englishHow: "recognition" | "checkbox" | null;
  englishStumbled: boolean | null;
  reviewSpoken: boolean;
  reviewHow: "recognition" | "checkbox" | null;
  reviewStumbled: boolean | null;
  bodyDone: boolean | null;
  ease: Ease | null;
  interest: string;
  completedAt: string | null;
  stars: { thinking: number; research: number; body: number } | null;
  minutes: number | null;
};

export type StoredLesson = {
  key: string;
  profileId: string;
  date: string;
  source: "seed" | "ai";
  model: string | null;
  subject: SubjectId;
  subjectLabel: string;
  slug: string;
  title: string;
  diagram: DiagramId;
  depth: Depth;
  outline: Outline;
  opening: { nogaLine: string; question: string };
  teaching: { story: string; explanation: string; example: string };
  challenge: ChallengeSecret;
  research: { prompt: string; facts: { text: string; sourceName: string; sourceHost: string }[] };
  english: StudentLesson["english"];
  body: { title: string; why: string; steps: string[]; minutes: number };
  closing: { teaser: string; praise: string };
  session: LessonSession;
  createdAt: string;
};

export type DB = {
  version: 1;
  profiles: Profile[];
  pin: string;
  allowlist: AllowEntry[];
  siteRequests: SiteRequest[];
  householdEnglish: Record<string, string>;
  lessons: Record<string, StoredLesson>;
  memory: Record<string, ChildMemory>;
  checklist: Record<string, ChecklistDay>;
  weeklyCache: Record<string, string>;
  tokens: { token: string; exp: number }[];
};

export function emptyChecklist(): ChecklistDay {
  return {
    items: { bag: false, schedule: false, room: false, teeth: false, bedtime: false },
    vision: null,
  };
}

export function defaultDB(): DB {
  return {
    version: 1,
    profiles: [
      { id: "girl-a", name: "ילדה א", role: "child" },
      { id: "girl-b", name: "ילדה ב", role: "child" },
      { id: "parent", name: "אבא", role: "parent" },
    ],
    pin: "1234",
    allowlist: [
      { host: "he.wikipedia.org", label: "ויקיפדיה בעברית" },
      { host: "simple.wikipedia.org", label: "ויקיפדיה פשוטה באנגלית" },
    ],
    siteRequests: [],
    householdEnglish: {},
    lessons: {},
    memory: {
      "girl-a": freshMemory("girl-a"),
      "girl-b": freshMemory("girl-b"),
    },
    checklist: {},
    weeklyCache: {},
    tokens: [],
  };
}

function migrate(raw: DB): DB {
  const base = defaultDB();
  const db = { ...base, ...raw, version: 1 as const };
  for (const profile of db.profiles.filter((item) => item.role === "child")) {
    db.memory[profile.id] = { ...freshMemory(profile.id), ...(db.memory[profile.id] ?? {}) };
  }
  db.allowlist = raw.allowlist?.length ? raw.allowlist : base.allowlist;
  db.pin = raw.pin || "1234";
  return db;
}

export type Store = {
  read: <T>(fn: (db: DB) => T) => T;
  update: <T>(fn: (db: DB) => T) => T;
};

export function createStore(filePath: string): Store {
  let memory: DB | null = null;

  function load(): DB {
    if (memory) return memory;
    try {
      memory = migrate(JSON.parse(fs.readFileSync(filePath, "utf8")) as DB);
    } catch {
      memory = defaultDB();
      save(memory);
    }
    return memory;
  }

  function save(db: DB) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
    fs.renameSync(tmp, filePath);
  }

  return {
    read(fn) {
      return fn(structuredClone(load()));
    },
    update(fn) {
      const db = load();
      const result = fn(db);
      save(db);
      return result;
    },
  };
}

export const store = createStore(path.join(process.cwd(), "data", "masa.json"));

export function lessonKey(profileId: string, date: string): string {
  return `${profileId}|${date}`;
}

export function checklistKey(profileId: string, date: string): string {
  return `${profileId}|${date}`;
}

export function childProfiles(db: DB): Profile[] {
  return db.profiles.filter((profile) => profile.role === "child");
}

export function findChild(db: DB, id: string): Profile | undefined {
  return db.profiles.find((profile) => profile.id === id && profile.role === "child");
}

export function issueToken(db: DB): string {
  const token = crypto.randomBytes(24).toString("hex");
  const now = Date.now();
  db.tokens = db.tokens.filter((item) => item.exp > now);
  db.tokens.push({ token, exp: now + 1000 * 60 * 60 * 12 });
  return token;
}

export function validToken(db: DB, token: string | null): boolean {
  if (!token) return false;
  const now = Date.now();
  return db.tokens.some((item) => item.token === token && item.exp > now);
}

export function freshSession(now = new Date().toISOString()): LessonSession {
  return {
    step: 0,
    startedAt: now,
    openingNote: "",
    challengeAnswer: "",
    challengeFeedback: "",
    challengeReady: false,
    challengeAttempts: 0,
    conclusion: "",
    conclusionFeedback: "",
    conclusionReady: false,
    englishSpoken: false,
    englishHow: null,
    englishStumbled: null,
    reviewSpoken: false,
    reviewHow: null,
    reviewStumbled: null,
    bodyDone: null,
    ease: null,
    interest: "",
    completedAt: null,
    stars: null,
    minutes: null,
  };
}

export function toggleChecklist(day: ChecklistDay, item: ChecklistItemId, value: boolean): ChecklistDay {
  return { ...day, items: { ...day.items, [item]: value } };
}
