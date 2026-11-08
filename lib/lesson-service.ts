import type { SeedLesson } from "@/content/catalog";
import { addDays, formatHebrewDate, todayISO } from "@/lib/dates";
import { englishPlan, householdSentenceId, nextEnglishLists, toPublic } from "@/lib/english";
import { generateJson, llmStatus } from "@/lib/llm";
import {
  checkConclusion,
  computeStars,
  pickSeed,
  planOutline,
  presentChallenge,
  resolveOutline,
  reviewChallenge,
} from "@/lib/planner";
import { lessonUserPrompt, researchUserPrompt, systemPrompt } from "@/lib/prompts";
import { answerFromFacts, fetchWikiSentences, mergeFacts } from "@/lib/research";
import { boundaryIssue, passesSafety, redirectLine } from "@/lib/safety";
import {
  findChild,
  freshSession,
  lessonKey,
  store,
  type StoredLesson,
} from "@/lib/store";
import type { ChallengeKind, ChildMemory, Depth, Ease, Outline, StudentLesson, SubjectId } from "@/lib/types";
import { KIND_LABEL, subjectLabel } from "@/lib/types";

const inflight = new Map<string, Promise<StudentLesson>>();

function memoryBrief(memory: ChildMemory, name: string): string {
  const recent = memory.topicsDone
    .slice(-6)
    .map((topic) => `${topic.date} ${topic.title} (${topic.ease ?? "בלי דירוג"})`)
    .join("; ");
  const hard = Object.entries(memory.subjectEase)
    .filter(([, ease]) => ease === "too_hard")
    .map(([subject]) => subjectLabel(subject as SubjectId));
  const easy = Object.entries(memory.subjectEase)
    .filter(([, ease]) => ease === "too_easy")
    .map(([subject]) => subjectLabel(subject as SubjectId));
  return `פרופיל: ${name}. שיעורים אחרונים: ${recent || "עדיין אין"}. עניין: ${memory.interests.slice(-6).join(", ") || "עדיין לא צוין"}. קל מדי: ${easy.join(", ") || "אין"}. קשה מדי: ${hard.join(", ") || "אין"}. רצף ימים: ${memory.streak}.`;
}

function noteFor(source: "seed" | "ai", fromCache: boolean): string {
  if (fromCache) return "השיעור הזה כבר שמור מהיום, ולא נוצר מחדש.";
  if (source === "ai") return "נוגה התאימה את השיעור לפי מה שכבר למדת.";
  return "השיעור מתוך ספריית הבית, מוכן גם בלי מפתח.";
}

export function projectLesson(lesson: StoredLesson, profileName: string, fromCache: boolean): StudentLesson {
  return {
    profileId: lesson.profileId,
    profileName,
    date: lesson.date,
    dateLabel: formatHebrewDate(lesson.date),
    fromCache,
    source: lesson.source,
    model: lesson.model,
    subject: lesson.subject,
    subjectLabel: lesson.subjectLabel,
    slug: lesson.slug,
    title: lesson.title,
    diagram: lesson.diagram,
    depth: lesson.depth,
    note: noteFor(lesson.source, fromCache),
    opening: lesson.opening,
    teaching: lesson.teaching,
    challenge: {
      kind: lesson.challenge.kind,
      kindLabel: KIND_LABEL[lesson.challenge.kind],
      prompt: lesson.challenge.prompt,
      scaffold: lesson.challenge.scaffold,
    },
    research: {
      prompt: lesson.research.prompt,
      facts: lesson.research.facts.map((fact) => ({ text: fact.text, sourceName: fact.sourceName })),
    },
    english: lesson.english,
    body: lesson.body,
    closing: lesson.closing,
    session: {
      step: lesson.session.step,
      openingNote: lesson.session.openingNote,
      challengeAnswer: lesson.session.challengeAnswer,
      challengeFeedback: lesson.session.challengeFeedback,
      challengeReady: lesson.session.challengeReady,
      challengeAttempts: lesson.session.challengeAttempts,
      conclusion: lesson.session.conclusion,
      conclusionFeedback: lesson.session.conclusionFeedback,
      conclusionReady: lesson.session.conclusionReady,
      englishSpoken: lesson.session.englishSpoken,
      englishStumbled: lesson.session.englishStumbled,
      reviewSpoken: lesson.session.reviewSpoken,
      reviewStumbled: lesson.session.reviewStumbled,
      bodyDone: lesson.session.bodyDone,
      ease: lesson.session.ease,
      interest: lesson.session.interest,
      completed: Boolean(lesson.session.completedAt),
      stars: lesson.session.stars,
      minutes: lesson.session.minutes,
    },
  };
}

function asKind(value: unknown): ChallengeKind {
  if (value === "riddle" || value === "what-if" || value === "find-mistake") return value;
  return "what-if";
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asSteps(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const steps = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 5);
  return steps.length >= 2 ? steps : fallback;
}

type AiLesson = {
  title?: string;
  opening?: { nogaLine?: string; question?: string };
  teaching?: { story?: string; explanation?: string; example?: string };
  challenge?: {
    kind?: string;
    prompt?: string;
    hint?: string;
    keywords?: string[];
    misconceptions?: { pattern?: string; hint?: string }[];
    refine?: string;
    deeper?: string;
    gentler?: string;
  };
  researchPrompt?: string;
  body?: { title?: string; why?: string; steps?: string[]; minutes?: number };
  closing?: { teaser?: string; praise?: string };
};

function aiIsSafe(ai: AiLesson): boolean {
  const blob = JSON.stringify(ai);
  return passesSafety(blob) && !/https?:\/\//i.test(blob);
}

async function tryAi(input: {
  name: string;
  memory: ChildMemory;
  seed: SeedLesson;
  depth: Depth;
  focus: string;
  facts: { text: string }[];
}): Promise<{ ai: AiLesson; model: string } | null> {
  if (!llmStatus().enabled) return null;
  const result = await generateJson<AiLesson>({
    system: systemPrompt(),
    user: lessonUserPrompt({
      childName: input.name,
      memoryBrief: memoryBrief(input.memory, input.name),
      subjectLabel: subjectLabel(input.seed.subject),
      depth: input.depth,
      focus: input.focus,
      seedTitle: input.seed.title,
      facts: input.facts.map((fact) => fact.text),
    }),
    maxTokens: 2500,
  });
  if (!result || !aiIsSafe(result.value)) return null;
  const ai = result.value;
  if (!ai.opening?.question || !ai.teaching?.explanation || !ai.challenge?.prompt || !ai.closing?.teaser) return null;
  const keywords = (ai.challenge.keywords ?? []).filter((word) => typeof word === "string" && word.trim());
  if (keywords.length < 2) return null;
  return { ai, model: result.model };
}

async function composeLesson(profileId: string, date: string): Promise<StoredLesson> {
  const snap = store.read((db) => {
    const profile = findChild(db, profileId);
    const memory = db.memory[profileId];
    return {
      profile,
      memory,
      allowlist: db.allowlist,
      sharedId: db.householdEnglish[date] ?? householdSentenceId(date),
    };
  });
  if (!snap.profile || !snap.memory) throw new Error("profile");

  store.update((db) => {
    if (!db.householdEnglish[date]) db.householdEnglish[date] = snap.sharedId;
  });

  const outline = resolveOutline(snap.memory, date);
  const seed = pickSeed(outline.subject, snap.memory.topicsDone.map((topic) => topic.slug));
  const wiki = seed.wikiTitle ? await fetchWikiSentences("he.wikipedia.org", seed.wikiTitle, snap.allowlist) : null;
  const facts = mergeFacts(seed.facts, wiki);
  const secret = presentChallenge(seed, outline.depth);
  const plan = englishPlan(snap.memory.englishNeedsRepeat, date, snap.sharedId);
  const ai = await tryAi({
    name: snap.profile.name,
    memory: snap.memory,
    seed,
    depth: outline.depth,
    focus: outline.focus,
    facts,
  });

  const challenge = ai
    ? {
        kind: asKind(ai.ai.challenge?.kind),
        prompt: asString(ai.ai.challenge?.prompt, secret.prompt),
        scaffold: outline.depth === "gentler" ? asString(ai.ai.challenge?.gentler, secret.scaffold ?? "") || null : secret.scaffold,
        hint: asString(ai.ai.challenge?.hint, secret.hint),
        keywords: (ai.ai.challenge?.keywords ?? secret.keywords).filter((word): word is string => typeof word === "string"),
        misconceptions: (ai.ai.challenge?.misconceptions ?? [])
          .filter((item) => item.pattern && item.hint)
          .map((item) => ({ pattern: item.pattern as string, hint: item.hint as string }))
          .slice(0, 3),
        refine: asString(ai.ai.challenge?.refine, secret.refine),
      }
    : secret;
  if (!challenge.misconceptions.length) challenge.misconceptions = secret.misconceptions;

  const lesson: StoredLesson = {
    key: lessonKey(profileId, date),
    profileId,
    date,
    source: ai ? "ai" : "seed",
    model: ai?.model ?? null,
    subject: seed.subject,
    subjectLabel: subjectLabel(seed.subject),
    slug: seed.slug,
    title: asString(ai?.ai.title, seed.title),
    diagram: seed.diagram,
    depth: outline.depth,
    outline,
    opening: {
      nogaLine: asString(ai?.ai.opening?.nogaLine, seed.opening.nogaLine),
      question: asString(ai?.ai.opening?.question, seed.opening.question),
    },
    teaching: {
      story: asString(ai?.ai.teaching?.story, seed.teaching.story),
      explanation: asString(ai?.ai.teaching?.explanation, seed.teaching.explanation),
      example: asString(ai?.ai.teaching?.example, seed.teaching.example),
    },
    challenge,
    research: {
      prompt: asString(ai?.ai.researchPrompt, seed.researchPrompt),
      facts,
    },
    english: {
      shared: toPublic(plan.shared),
      situation: plan.situation,
      repeatingShared: plan.repeatingShared,
      review: plan.review ? { ...toPublic(plan.review), situation: plan.review.situation } : null,
    },
    body: {
      title: asString(ai?.ai.body?.title, seed.body.title),
      why: asString(ai?.ai.body?.why, seed.body.why),
      steps: asSteps(ai?.ai.body?.steps, seed.body.steps),
      minutes: typeof ai?.ai.body?.minutes === "number" ? Math.min(8, Math.max(2, ai.ai.body.minutes)) : seed.body.minutes,
    },
    closing: {
      teaser: asString(ai?.ai.closing?.teaser, seed.closing.teaser),
      praise: asString(ai?.ai.closing?.praise, seed.closing.praise),
    },
    session: freshSession(),
    createdAt: new Date().toISOString(),
  };

  if (!passesSafety(`${lesson.title}\n${lesson.teaching.story}\n${lesson.teaching.explanation}\n${lesson.challenge.prompt}`)) {
    lesson.source = "seed";
    lesson.model = null;
    lesson.title = seed.title;
    lesson.opening = seed.opening;
    lesson.teaching = seed.teaching;
    lesson.challenge = secret;
    lesson.research.prompt = seed.researchPrompt;
    lesson.body = seed.body;
    lesson.closing = seed.closing;
  }

  store.update((db) => {
    const memory = db.memory[profileId];
    if (memory.parentOverride?.date === date) memory.parentOverride = null;
    db.lessons[lesson.key] = lesson;
  });
  return lesson;
}

export async function startLesson(profileId: string, date = todayISO()): Promise<StudentLesson> {
  const key = lessonKey(profileId, date);
  const existing = store.read((db) => {
    const profile = findChild(db, profileId);
    const lesson = db.lessons[key];
    return profile && lesson ? projectLesson(lesson, profile.name, true) : null;
  });
  if (existing) return existing;
  const pending = inflight.get(key);
  if (pending) return pending;
  const promise = composeLesson(profileId, date)
    .then((lesson) => {
      const name = store.read((db) => findChild(db, profileId)?.name ?? "");
      return projectLesson(lesson, name, false);
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

function withLesson<T>(profileId: string, date: string, fn: (lesson: StoredLesson, name: string) => T): T {
  return store.update((db) => {
    const profile = findChild(db, profileId);
    const lesson = db.lessons[lessonKey(profileId, date)];
    if (!profile || !lesson) throw new Error("missing");
    return fn(lesson, profile.name);
  });
}

export function reachStep(profileId: string, date: string, step: number): StudentLesson {
  return withLesson(profileId, date, (lesson, name) => {
    const englishReady =
      lesson.session.englishSpoken &&
      lesson.session.englishStumbled !== null &&
      (!lesson.english.review || (lesson.session.reviewSpoken && lesson.session.reviewStumbled !== null));
    const allowed =
      (step === 1) ||
      (step === 2 && lesson.session.step >= 1) ||
      (step === 3 && lesson.session.challengeReady) ||
      (step === 4 && lesson.session.conclusionReady) ||
      (step === 5 && englishReady) ||
      (step === 6 && lesson.session.bodyDone !== null);
    if (allowed) lesson.session.step = Math.max(lesson.session.step, step);
    return projectLesson(lesson, name, true);
  });
}

export function saveOpening(profileId: string, date: string, note: string): StudentLesson {
  return withLesson(profileId, date, (lesson, name) => {
    if (boundaryIssue(note)) {
      lesson.session.openingNote = "";
      lesson.session.challengeFeedback = redirectLine();
    } else {
      lesson.session.openingNote = note.slice(0, 400);
    }
    lesson.session.step = Math.max(lesson.session.step, 1);
    return projectLesson(lesson, name, true);
  });
}

export function submitChallenge(profileId: string, date: string, answer: string): StudentLesson {
  return withLesson(profileId, date, (lesson, name) => {
    if (boundaryIssue(answer)) {
      lesson.session.challengeAnswer = "";
      lesson.session.challengeFeedback = redirectLine();
      lesson.session.challengeReady = false;
      return projectLesson(lesson, name, true);
    }
    const result = reviewChallenge(answer, lesson.challenge, lesson.session.challengeAttempts);
    lesson.session.challengeAttempts += 1;
    lesson.session.challengeAnswer = answer.slice(0, 500);
    lesson.session.challengeFeedback = result.feedback;
    lesson.session.challengeReady = result.ready;
    if (result.ready) lesson.session.step = Math.max(lesson.session.step, 3);
    return projectLesson(lesson, name, true);
  });
}

export function submitConclusion(profileId: string, date: string, text: string): StudentLesson {
  return withLesson(profileId, date, (lesson, name) => {
    if (boundaryIssue(text)) {
      lesson.session.conclusionFeedback = redirectLine();
      lesson.session.conclusionReady = false;
      return projectLesson(lesson, name, true);
    }
    const result = checkConclusion(text, lesson.research.facts.map((fact) => fact.text));
    lesson.session.conclusion = text.slice(0, 400);
    lesson.session.conclusionFeedback = result.message;
    lesson.session.conclusionReady = result.ok;
    if (result.ok) lesson.session.step = Math.max(lesson.session.step, 4);
    return projectLesson(lesson, name, true);
  });
}

export function saveEnglish(
  profileId: string,
  date: string,
  input: { spoken: boolean; stumbled: boolean; how: "recognition" | "checkbox"; reviewSpoken?: boolean; reviewStumbled?: boolean; reviewHow?: "recognition" | "checkbox" },
): StudentLesson {
  return withLesson(profileId, date, (lesson, name) => {
    lesson.session.englishSpoken = input.spoken;
    lesson.session.englishStumbled = input.stumbled;
    lesson.session.englishHow = input.how;
    if (lesson.english.review) {
      lesson.session.reviewSpoken = Boolean(input.reviewSpoken);
      lesson.session.reviewStumbled = input.reviewStumbled ?? null;
      lesson.session.reviewHow = input.reviewHow ?? null;
    }
    const reviewOk = !lesson.english.review || lesson.session.reviewSpoken;
    if (input.spoken && reviewOk && input.stumbled !== undefined) {
      lesson.session.step = Math.max(lesson.session.step, 5);
    }
    return projectLesson(lesson, name, true);
  });
}

export function saveBody(profileId: string, date: string, done: boolean): StudentLesson {
  return withLesson(profileId, date, (lesson, name) => {
    lesson.session.bodyDone = done;
    lesson.session.step = Math.max(lesson.session.step, 6);
    return projectLesson(lesson, name, true);
  });
}

export async function completeLesson(
  profileId: string,
  date: string,
  input: { ease: Ease | null; interest: string },
): Promise<StudentLesson> {
  const prepared = store.update((db) => {
    const lesson = db.lessons[lessonKey(profileId, date)];
    const memory = db.memory[profileId];
    const profile = findChild(db, profileId);
    if (!lesson || !memory || !profile) throw new Error("missing");
    if (lesson.session.completedAt) return { lesson, name: profile.name, already: true, memory };

    const interest = boundaryIssue(input.interest) ? "" : input.interest.trim().slice(0, 160);
    const ease = input.ease ?? "just_right";
    const stars = computeStars(lesson.session);
    const elapsed = Math.round((Date.now() - Date.parse(lesson.session.startedAt)) / 60000);
    const minutes = Math.min(80, Math.max(1, Number.isFinite(elapsed) ? elapsed : 1));
    lesson.session.ease = ease;
    lesson.session.interest = interest;
    lesson.session.stars = stars;
    lesson.session.minutes = minutes;
    lesson.session.completedAt = new Date().toISOString();

    if (memory.lastLessonDate !== date) {
      memory.streak = memory.lastLessonDate && addDays(memory.lastLessonDate, 1) === date ? memory.streak + 1 : 1;
      memory.lastLessonDate = date;
    }
    memory.totalMinutes += minutes;
    memory.subjectEase[lesson.subject] = ease;
    memory.subjectCounts[lesson.subject] = (memory.subjectCounts[lesson.subject] ?? 0) + 1;
    memory.topicsDone.push({
      date,
      slug: lesson.slug,
      subject: lesson.subject,
      title: lesson.title,
      ease,
      interest,
      minutes,
      stars,
      hinted: lesson.session.challengeAttempts > 1,
    });
    memory.topicsDone = memory.topicsDone.slice(-80);
    if (interest) {
      memory.interests = [...memory.interests.filter((item) => item !== interest), interest].slice(-24);
    }
    if (lesson.session.challengeAttempts > 1) {
      memory.mistakes = [...memory.mistakes, `${lesson.title}: נדרש רמז באתגר`].slice(-20);
    }
    let english = nextEnglishLists(memory.englishMastered, memory.englishNeedsRepeat, lesson.english.shared.id, Boolean(lesson.session.englishStumbled));
    if (lesson.english.review && lesson.session.reviewSpoken) {
      english = nextEnglishLists(english.mastered, english.needsRepeat, lesson.english.review.id, Boolean(lesson.session.reviewStumbled));
    }
    memory.englishMastered = english.mastered;
    memory.englishNeedsRepeat = english.needsRepeat;

    const tomorrow = addDays(date, 1);
    memory.tomorrowOutline = planOutline({
      date: tomorrow,
      memory: { ...memory, parentOverride: null, tomorrowOutline: null },
      override: memory.parentOverride?.date === tomorrow ? memory.parentOverride.subject : null,
    });
    return { lesson, name: profile.name, already: false, memory, tomorrow };
  });

  if (!prepared.already && llmStatus().enabled) {
    const polished = await generateJson<{ focus?: string }>({
      system: systemPrompt(),
      user: `כתבי מוקד קצר לשיעור מחר במסלול ${subjectLabel(prepared.memory.tomorrowOutline?.subject ?? "concepts")} בעומק ${prepared.memory.tomorrowOutline?.depth ?? "standard"}.
זיכרון: ${memoryBrief(prepared.memory, prepared.name)}
החזירי JSON: {"focus":"משפט אחד בעברית"}`,
      maxTokens: 300,
    });
    const focus = polished?.value.focus;
    if (focus && passesSafety(focus)) {
      store.update((db) => {
        const outline = db.memory[profileId]?.tomorrowOutline;
        if (outline) outline.focus = focus.slice(0, 180);
      });
    }
  }

  return store.read((db) => {
    const lesson = db.lessons[lessonKey(profileId, date)];
    const name = findChild(db, profileId)?.name ?? "";
    if (!lesson) throw new Error("missing");
    return projectLesson(lesson, name, true);
  });
}

export async function askResearch(profileId: string, date: string, question: string): Promise<{ message: string; queueHost: string | null }> {
  const lesson = store.read((db) => db.lessons[lessonKey(profileId, date)]);
  if (!lesson) return { message: "עוד אין שיעור פתוח.", queueHost: null };
  if (boundaryIssue(question)) return { message: redirectLine(), queueHost: null };
  const hostMatch = question.match(/([a-z0-9.-]+\.[a-z]{2,})/i);
  if (hostMatch) {
    return {
      message: "את המקור הזה אי אפשר לפתוח מכאן. אפשר לבקש מאבא להוסיף אתר לרשימה, והשיעור נשאר עם מה שכבר אושר.",
      queueHost: hostMatch[1].toLowerCase(),
    };
  }
  if (llmStatus().enabled) {
    const ai = await generateJson<{ covered?: boolean; answer?: string }>({
      system: systemPrompt(),
      user: researchUserPrompt(question, lesson.research.facts.map((fact) => fact.text)),
      maxTokens: 400,
    });
    if (ai?.value.covered && ai.value.answer && passesSafety(ai.value.answer)) {
      return { message: ai.value.answer, queueHost: null };
    }
  }
  const local = answerFromFacts(question, lesson.research.facts);
  if (local.covered) return { message: local.answer, queueHost: null };
  return {
    message: "במקורות המאושרים להיום אין תשובה לשאלה הזו. אפשר לכתוב מסקנה ממה שכן כתוב, או לבקש מאבא מקור נוסף.",
    queueHost: null,
  };
}

export function peekHome(profileId: string, date = todayISO()) {
  return store.update((db) => {
    const profile = findChild(db, profileId);
    const memory = db.memory[profileId];
    if (!profile || !memory) return null;
    const key = lessonKey(profileId, date);
    if (!db.lessons[key] && !memory.tomorrowOutline && !memory.parentOverride) {
      memory.tomorrowOutline = planOutline({ date, memory });
    }
    const lesson = db.lessons[key];
    const outline: Outline = lesson?.outline ?? resolveOutline(memory, date);
    if (!lesson && memory.tomorrowOutline?.date !== date && !memory.parentOverride) {
      memory.tomorrowOutline = outline;
    }
    const yesterday = db.lessons[lessonKey(profileId, addDays(date, -1))];
    return {
      profile,
      memory,
      outline,
      lesson: lesson ? projectLesson(lesson, profile.name, true) : null,
      teaser: lesson?.session.completedAt ? lesson.closing.teaser : yesterday?.closing.teaser ?? null,
      llm: llmStatus().enabled,
    };
  });
}

export function sentenceForDate(date: string): string {
  return store.read((db) => db.householdEnglish[date] ?? householdSentenceId(date));
}
