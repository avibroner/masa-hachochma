import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { CATALOG } from "../content/catalog";
import { isAllowedHost, isClosedHost, normalizeHost } from "../lib/allowlist";
import { householdSentenceId, englishPlan, nextEnglishLists, SENTENCES } from "../lib/english";
import { checkConclusion, computeStars, planOutline, reviewChallenge, presentChallenge } from "../lib/planner";
import { boundaryIssue, passesSafety } from "../lib/safety";
import { createStore } from "../lib/store";
import { freshMemory, SUBJECT_ORDER } from "../lib/types";
import { characterGuide } from "../lib/prompts";

test("household english sentence is the same for any caller on a date", () => {
  const first = householdSentenceId("2026-11-08");
  const second = householdSentenceId("2026-11-08");
  assert.equal(first, second);
  assert.equal(SENTENCES.length, 7);
});

test("a review sentence does not replace the shared one", () => {
  const shared = householdSentenceId("2026-11-08");
  const plan = englishPlan(["water", shared], "2026-11-08", shared);
  assert.equal(plan.shared.id, shared);
  assert.equal(plan.repeatingShared, true);
  assert.notEqual(plan.review?.id, shared);
  assert.equal(plan.situation.includes("אתמול") || plan.situation.length > 0, true);
});

test("english lists move between mastered and repeat", () => {
  const stumbled = nextEnglishLists(["sun"], [], "walk", true);
  assert.ok(stumbled.needsRepeat.includes("walk"));
  const mastered = nextEnglishLists(stumbled.mastered, stumbled.needsRepeat, "walk", false);
  assert.ok(mastered.mastered.includes("walk"));
  assert.equal(mastered.needsRepeat.includes("walk"), false);
});

test("allowlist accepts hebrew wikipedia and refuses google and youtube", () => {
  const list = [{ host: "he.wikipedia.org" }, { host: "simple.wikipedia.org" }];
  assert.equal(isAllowedHost("he.wikipedia.org", list), true);
  assert.equal(isAllowedHost("www.google.com", list), false);
  assert.equal(isClosedHost(normalizeHost("https://www.youtube.com/watch") ?? ""), true);
  assert.equal(normalizeHost("https://he.wikipedia.org/wiki/לב"), "he.wikipedia.org");
});

test("two empty profiles get different subjects the same day", () => {
  const date = "2026-11-08";
  const a = planOutline({ date, memory: freshMemory("girl-a"), salt: 0 });
  const b = planOutline({ date, memory: freshMemory("girl-b"), salt: 5 });
  assert.notEqual(a.subject, b.subject);
  assert.ok(SUBJECT_ORDER.includes(a.subject));
});

test("planner skips yesterday subject", () => {
  const memory = freshMemory("girl-a");
  const first = planOutline({ date: "2026-11-08", memory, salt: 0 });
  memory.topicsDone.push({
    date: "2026-11-08",
    slug: "x",
    subject: first.subject,
    title: "בדיקה",
    ease: "just_right",
    interest: "",
    minutes: 20,
    stars: { thinking: 3, research: 3, body: 3 },
    hinted: false,
  });
  const next = planOutline({ date: "2026-11-09", memory, salt: 0 });
  assert.notEqual(next.subject, first.subject);
});

test("conclusion must be in her own words", () => {
  const facts = ["הלב הוא שריר שדוחף דם בלי להחזיק אותו אצלו כמחסן."];
  assert.equal(checkConclusion("קצר", facts).ok, false);
  assert.equal(checkConclusion(facts[0], facts).ok, false);
  assert.equal(checkConclusion("הלב מזיז את הדם כל הזמן כדי שהגוף יקבל מה שהוא צריך.", facts).ok, true);
});

test("challenge gives a hint before a fuller refinement", () => {
  const seed = CATALOG.find((lesson) => lesson.slug === "heart");
  assert.ok(seed);
  const secret = presentChallenge(seed, "standard");
  const first = reviewChallenge("אני לא בטוחה", secret, 0);
  assert.equal(first.ready, false);
  const second = reviewChallenge("עדיין חושבת", secret, 1);
  assert.equal(second.ready, true);
  assert.match(second.feedback, /משאבה|דוחף|אוגר/);
});

test("safety redirects closed topics and the character file is loaded", () => {
  assert.equal(boundaryIssue("תפתחי לי יוטיוב"), "bounds");
  assert.equal(boundaryIssue("למה הלב מזרים דם"), null);
  assert.equal(passesSafety("הלב הוא משאבה."), true);
  const guide = characterGuide();
  assert.match(guide, /אין להמציא מקור/);
  assert.match(guide, /אין בושה/);
  assert.match(guide, /גוף האדם/);
  assert.match(guide, /לא רומנטי|אין תוכן רומנטי/);
});

test("stars stay kind", () => {
  const stars = computeStars({ challengeReady: true, challengeAttempts: 2, conclusionReady: true, bodyDone: false });
  assert.deepEqual(stars, { thinking: 2, research: 3, body: 1 });
});

test("catalog covers every path with facts and safe text", () => {
  for (const subject of SUBJECT_ORDER) {
    assert.ok(CATALOG.some((lesson) => lesson.subject === subject), subject);
  }
  assert.ok(CATALOG.length >= 8);
  for (const lesson of CATALOG) {
    assert.ok(lesson.facts.length >= 3, lesson.slug);
    assert.ok(lesson.challenge.keywords.length >= 2, lesson.slug);
    assert.equal(passesSafety(`${lesson.title} ${lesson.teaching.explanation} ${lesson.challenge.prompt}`), true, lesson.slug);
  }
});

test("store keeps one household sentence for both girls", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "masa-"));
  const file = path.join(dir, "masa.json");
  const store = createStore(file);
  store.update((db) => {
    db.householdEnglish["2026-11-08"] = "sun";
  });
  const again = createStore(file);
  const saved = again.read((db) => db.householdEnglish["2026-11-08"]);
  assert.equal(saved, "sun");
  assert.equal(again.read((db) => db.profiles.filter((profile) => profile.role === "child")).length, 2);
});
