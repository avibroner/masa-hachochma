"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LessonDiagram } from "@/components/diagrams";
import { EnglishPractice } from "@/components/english-practice";
import { Noga } from "@/components/noga";
import { Shell } from "@/components/shell";
import { Stars } from "@/components/stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postJson } from "@/lib/client-api";
import type { Ease, StudentLesson } from "@/lib/types";
import { STEP_LABELS } from "@/lib/types";

function thanks(note: string): string {
  const text = note.trim();
  if (!text) return "אפשר גם רק לחשוב בלחש. כשנהיה מוכנות, נמשיך.";
  if (text.length < 12) return "תודה שחלקת. נשמור את הכיוון ונמשיך ממנו.";
  return "כתבת מחשבה של ממש. ניקח אותה איתנו אל ההסבר.";
}

function starNote(kind: "thinking" | "research" | "body", count: number): string {
  if (kind === "thinking") {
    if (count >= 3) return "החשיבה הייתה מדויקת כבר בניסיון הראשון.";
    if (count === 2) return "השתמשת ברמז ודייקת. כך לומדים.";
    return "נגענו באתגר. מחר הוא יהיה מוכר יותר.";
  }
  if (kind === "research") return count >= 3 ? "המסקנה נכתבה במילים שלך." : "החקר מחכה למשפט אחד משלך בפעם הבאה.";
  return count >= 3 ? "הגוף קיבל את ההפסקה שמגיעה לו." : "ההפסקה שמורה להמשך היום, בלי חובה להרגיש איחור.";
}

export function LessonExperience({ profileId }: { profileId: string }) {
  const [lesson, setLesson] = useState<StudentLesson | null>(null);
  const [view, setView] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState("");
  const [openingAck, setOpeningAck] = useState("");
  const [answer, setAnswer] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [question, setQuestion] = useState("");
  const [researchReply, setResearchReply] = useState("");
  const [hostRequest, setHostRequest] = useState("");
  const [interest, setInterest] = useState("");
  const [ease, setEase] = useState<Ease | null>(null);
  const [englishBits, setEnglishBits] = useState<{
    shared: { how: "recognition" | "checkbox"; stumbled: boolean } | null;
    review: { how: "recognition" | "checkbox"; stumbled: boolean } | null;
  }>({ shared: null, review: null });

  useEffect(() => {
    let cancelled = false;
    postJson<{ lesson: StudentLesson }>("/api/lesson", { action: "start", profileId })
      .then((data) => {
        if (cancelled) return;
        setLesson(data.lesson);
        setView(data.lesson.session.completed ? 6 : data.lesson.session.step);
        setOpening(data.lesson.session.openingNote);
        setAnswer(data.lesson.session.challengeAnswer);
        setConclusion(data.lesson.session.conclusion);
        setInterest(data.lesson.session.interest);
        setEase(data.lesson.session.ease);
        setEnglishBits({
          shared: data.lesson.session.englishSpoken
            ? { how: "checkbox", stumbled: Boolean(data.lesson.session.englishStumbled) }
            : null,
          review: data.lesson.session.reviewSpoken
            ? { how: "checkbox", stumbled: Boolean(data.lesson.session.reviewStumbled) }
            : null,
        });
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "השיעור לא נפתח.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const data = await postJson<{ lesson: StudentLesson }>("/api/lesson", { profileId, ...body });
      setLesson(data.lesson);
      return data.lesson;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "משהו לא הסתדר.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const pose = view === 6 ? "praise" : view === 1 || view === 2 ? "teach" : "stand";

  return (
    <Shell eyebrow={lesson ? lesson.dateLabel : "השיעור"}>
      {loading ? <p className="text-lg">נוגה פותחת את המחברת...</p> : null}
      {error ? <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-destructive">{error}</p> : null}
      {lesson ? (
        <div className="grid items-start gap-6 md:grid-cols-[220px_1fr]">
          <aside className="md:sticky md:top-4">
            <Noga pose={pose} className="mx-auto h-64 w-auto md:h-80" />
            <p className="mt-2 text-center font-display text-xl">נוגה</p>
          </aside>
          <div className="space-y-5">
            <div>
              <p className="text-sm text-primary">{lesson.subjectLabel}</p>
              <h1 className="font-display text-4xl leading-tight">{lesson.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{lesson.note}</p>
            </div>
            <ol className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {STEP_LABELS.map((label, index) => (
                <li key={label}>
                  <button
                    type="button"
                    className={`w-full rounded-xl px-2 py-2 text-sm ${index === view ? "bg-primary text-primary-foreground" : index <= lesson.session.step ? "bg-muted" : "bg-card text-muted-foreground ring-1 ring-border"}`}
                    onClick={() => {
                      if (index <= lesson.session.step) setView(index);
                    }}
                    disabled={index > lesson.session.step}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ol>

            {view === 0 ? (
              <section className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-7">
                <p className="text-lg leading-8">{lesson.opening.nogaLine}</p>
                <h2 className="font-display text-3xl leading-snug">{lesson.opening.question}</h2>
                <Textarea value={opening} onChange={(event) => setOpening(event.target.value)} placeholder="מה עולה לך בראש? גם משפט קצר מספיק." className="min-h-28 md:text-lg" />
                {openingAck ? <p>{openingAck}</p> : null}
                <Button
                  size="xl"
                  disabled={busy}
                  onClick={async () => {
                    const next = await act({ action: "opening", note: opening });
                    if (!next) return;
                    setOpeningAck(thanks(opening));
                    setView(1);
                  }}
                >
                  נמשיך אל ההסבר
                </Button>
              </section>
            ) : null}

            {view === 1 ? (
              <section className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-7">
                <p className="text-lg leading-8">{lesson.teaching.story}</p>
                <p className="text-lg leading-8">{lesson.teaching.explanation}</p>
                <p className="text-lg leading-8">{lesson.teaching.example}</p>
                <LessonDiagram id={lesson.diagram} />
                <Button size="xl" disabled={busy} onClick={async () => {
                  const next = await act({ action: "reach", step: 2 });
                  if (next) setView(2);
                }}>
                  אל אתגר החשיבה
                </Button>
              </section>
            ) : null}

            {view === 2 ? (
              <section className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-7">
                <p className="text-sm text-primary">{lesson.challenge.kindLabel}</p>
                {lesson.challenge.scaffold ? <p className="rounded-2xl bg-muted px-4 py-3">{lesson.challenge.scaffold}</p> : null}
                <h2 className="font-display text-3xl leading-snug">{lesson.challenge.prompt}</h2>
                <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="מה את חושבת?" className="min-h-28 md:text-lg" />
                {lesson.session.challengeFeedback ? <p className="leading-8">{lesson.session.challengeFeedback}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button size="xl" disabled={busy} onClick={() => act({ action: "challenge", answer })}>זו המחשבה שלי</Button>
                  {lesson.session.challengeReady ? (
                    <Button size="xl" variant="secondary" disabled={busy} onClick={async () => {
                      const next = await act({ action: "reach", step: 3 });
                      if (next) setView(3);
                    }}>אל החקר</Button>
                  ) : null}
                </div>
              </section>
            ) : null}

            {view === 3 ? (
              <section className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-7">
                <p>אלה המקורות המאושרים להיום. אין כאן חיפוש פתוח.</p>
                <ul className="space-y-3">
                  {lesson.research.facts.map((fact) => (
                    <li key={fact.text} className="rounded-2xl bg-muted px-4 py-3">
                      <p className="leading-8">{fact.text}</p>
                      <p className="mt-1 text-sm text-muted-foreground">מקור: {fact.sourceName}</p>
                    </li>
                  ))}
                </ul>
                <h2 className="font-display text-2xl">{lesson.research.prompt}</h2>
                <Textarea value={conclusion} onChange={(event) => setConclusion(event.target.value)} placeholder="משפט אחד במילים שלך" className="min-h-24 md:text-lg" />
                {lesson.session.conclusionFeedback ? <p>{lesson.session.conclusionFeedback}</p> : null}
                <Button size="xl" disabled={busy} onClick={() => act({ action: "conclusion", text: conclusion })}>זו המסקנה שלי</Button>
                <div className="space-y-2 border-t border-border pt-4">
                  <p>אפשר לשאול את נוגה רק מתוך העובדות האלה.</p>
                  <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="שאלה קצרה על הנושא" className="min-h-20 md:text-lg" />
                  <Button
                    size="lg"
                    variant="secondary"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const data = await postJson<{ message: string; queueHost: string | null }>("/api/research", { profileId, question });
                        setResearchReply(data.message);
                        if (data.queueHost) setHostRequest(data.queueHost);
                      } catch (reason) {
                        setError(reason instanceof Error ? reason.message : "השאלה לא נשלחה.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    שאלי את נוגה
                  </Button>
                  {researchReply ? <p className="leading-8">{researchReply}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={hostRequest}
                      onChange={(event) => setHostRequest(event.target.value)}
                      placeholder="אתר לבקש מאבא, אם חסר מקור"
                      className="h-11 min-w-56 flex-1 rounded-xl border border-input bg-card px-3"
                    />
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const data = await postJson<{ message: string }>("/api/research", { profileId, queue: true, host: hostRequest, note: "בקשה מתוך החקר" });
                          setResearchReply(data.message);
                        } catch (reason) {
                          setError(reason instanceof Error ? reason.message : "הבקשה לא נשמרה.");
                        }
                      }}
                    >
                      לבקש מאבא להוסיף מקור
                    </Button>
                  </div>
                </div>
                {lesson.session.conclusionReady ? (
                  <Button size="xl" disabled={busy} onClick={async () => {
                    const next = await act({ action: "reach", step: 4 });
                    if (next) setView(4);
                  }}>אל האנגלית של הבית</Button>
                ) : null}
              </section>
            ) : null}

            {view === 4 ? (
              <section className="space-y-6 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-7">
                <EnglishPractice
                  title="המשפט של כל הבית היום"
                  sentence={lesson.english.shared}
                  situation={lesson.english.situation}
                  repeating={lesson.english.repeatingShared}
                  onDone={(result) => {
                    const nextBits = { ...englishBits, shared: result };
                    setEnglishBits(nextBits);
                    if (lesson.english.review && !nextBits.review) return;
                    void act({
                      action: "english",
                      spoken: true,
                      stumbled: result.stumbled,
                      how: result.how,
                      reviewSpoken: Boolean(nextBits.review),
                      reviewStumbled: nextBits.review?.stumbled,
                      reviewHow: nextBits.review?.how,
                    }).then((next) => {
                      if (next) setView(5);
                    });
                  }}
                />
                {lesson.english.review ? (
                  <EnglishPractice
                    title="עוד משפט קטן, רק לך, מיום קודם"
                    sentence={lesson.english.review}
                    situation={lesson.english.review.situation}
                    repeating
                    onDone={(result) => {
                      const nextBits = { ...englishBits, review: result };
                      setEnglishBits(nextBits);
                      if (!nextBits.shared) return;
                      void act({
                        action: "english",
                        spoken: true,
                        stumbled: nextBits.shared.stumbled,
                        how: nextBits.shared.how,
                        reviewSpoken: true,
                        reviewStumbled: result.stumbled,
                        reviewHow: result.how,
                      }).then((next) => {
                        if (next) setView(5);
                      });
                    }}
                  />
                ) : null}
                <p className="text-sm text-muted-foreground">אחרי שאומרים בקול, בוחרים אם המשפט ישב או שנחזור עליו בעדינות.</p>
              </section>
            ) : null}

            {view === 5 ? (
              <section className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-7">
                <h2 className="font-display text-3xl">{lesson.body.title}</h2>
                <p className="leading-8">{lesson.body.why}</p>
                <ol className="list-decimal space-y-2 pe-5">
                  {lesson.body.steps.map((step) => (
                    <li key={step} className="leading-8">{step}</li>
                  ))}
                </ol>
                <p className="text-sm text-muted-foreground">בערך {lesson.body.minutes} דקות. בלי תחרות.</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="xl" disabled={busy} onClick={async () => {
                    const next = await act({ action: "body", done: true });
                    if (next) setView(6);
                  }}>עשיתי</Button>
                  <Button size="xl" variant="outline" disabled={busy} onClick={async () => {
                    const next = await act({ action: "body", done: false });
                    if (next) setView(6);
                  }}>אעשה עוד מעט</Button>
                </div>
              </section>
            ) : null}

            {view === 6 ? (
              <section className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-7">
                {lesson.session.completed && lesson.session.stars ? (
                  <>
                    <h2 className="font-display text-3xl">סוף המסע להיום</h2>
                    <p className="text-lg leading-8">{lesson.closing.praise}</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Stars label="חשיבה" count={lesson.session.stars.thinking} note={starNote("thinking", lesson.session.stars.thinking)} />
                      <Stars label="חקר" count={lesson.session.stars.research} note={starNote("research", lesson.session.stars.research)} />
                      <Stars label="גוף" count={lesson.session.stars.body} note={starNote("body", lesson.session.stars.body)} />
                    </div>
                    <p className="font-display text-2xl leading-snug">שאלה להמשך: {lesson.closing.teaser}</p>
                    <Button size="xl" nativeButton={false} render={<Link href={`/child/${profileId}`} />}>חזרה הביתה</Button>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-3xl">לפני שסוגרים את המחברת</h2>
                    <p>איך הרגיש היום?</p>
                    <div className="flex flex-wrap gap-2">
                      {([
                        ["too_easy", "קל מדי, אפשר חד יותר"],
                        ["just_right", "בדיוק טוב"],
                        ["too_hard", "כבד, ונחזור בעדינות"],
                      ] as const).map(([value, label]) => (
                        <Button key={value} size="lg" variant={ease === value ? "default" : "outline"} onClick={() => setEase(value)}>
                          {label}
                        </Button>
                      ))}
                    </div>
                    <Textarea value={interest} onChange={(event) => setInterest(event.target.value)} placeholder="מה הדליק סקרנות? אפשר להשאיר ריק." className="min-h-20 md:text-lg" />
                    <Button
                      size="xl"
                      disabled={busy}
                      onClick={async () => {
                        const next = await act({ action: "complete", ease, interest });
                        if (next) setLesson(next);
                      }}
                    >
                      לשמור ולסיים
                    </Button>
                  </>
                )}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
