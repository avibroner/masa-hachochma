"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Noga } from "@/components/noga";
import { Shell } from "@/components/shell";
import { Stars } from "@/components/stars";
import { Button } from "@/components/ui/button";
import { getJson } from "@/lib/client-api";
import type { StudentLesson } from "@/lib/types";

type HomeData = {
  profile: { id: string; name: string };
  streak: number;
  totalMinutes: number;
  llm: boolean;
  plannedSubject: string;
  plannedFocus: string;
  lesson: StudentLesson | null;
  teaser: string | null;
  checklist: { done: number; total: number };
  week: { date: string; label: string; state: "today" | "past" | "ahead"; subject: string | null; done: boolean }[];
};

export function ChildHome({ profileId }: { profileId: string }) {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getJson<HomeData & { ok: boolean }>(`/api/child/${profileId}`)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "לא הצלחתי לפתוח את הבית.");
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const done = Boolean(data?.lesson?.session.completed);
  return (
    <Shell eyebrow={data ? `שלום, ${data.profile.name}` : "הבית"}>
      {error ? <p className="rounded-xl bg-destructive/10 px-4 py-3 text-destructive">{error}</p> : null}
      {!data && !error ? <p className="text-lg">נוגה מדליקה את הפנס...</p> : null}
      {data ? (
        <div className="grid items-start gap-6 md:grid-cols-[240px_1fr]">
          <Noga pose={done ? "praise" : "stand"} className="mx-auto h-72 w-auto" />
          <div className="space-y-5">
            <div>
              <p className="text-sm text-primary">{data.streak > 0 ? `רצף של ${data.streak} ימים` : "יום חדש במסע"}</p>
              <h1 className="font-display text-4xl leading-tight">שלום, {data.profile.name}</h1>
              <p className="mt-3 text-lg leading-8">
                {done
                  ? "המחברת של היום כבר סגורה. אפשר לנוח, או לעבור על מה שלמדת."
                  : `היום נצא אל ${data.plannedSubject}. ${data.plannedFocus}`}
              </p>
              {!data.llm ? <p className="mt-2 text-sm text-muted-foreground">מצב ספריית הבית: השיעורים מוכנים מראש. עם מפתח API נוגה תתאים את העומק.</p> : null}
            </div>
            {data.teaser ? <p className="rounded-2xl bg-muted px-4 py-3 leading-8">שאלה שנשארה: {data.teaser}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button size="xl" nativeButton={false} render={<Link href={`/child/${profileId}/lesson`} />}>{done ? "לפתוח את השיעור שוב" : data.lesson ? "להמשיך את השיעור" : "מתחילים"}</Button>
              <Button size="xl" variant="secondary" nativeButton={false} render={<Link href={`/child/${profileId}/checklist`} />}>סדר היום בבית ({data.checklist.done}/{data.checklist.total})</Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/" />}>החלפת משתמשת</Button>
            </div>
            {done && data.lesson?.session.stars ? (
              <div className="grid gap-3 md:grid-cols-3">
                <Stars label="חשיבה" count={data.lesson.session.stars.thinking} />
                <Stars label="חקר" count={data.lesson.session.stars.research} />
                <Stars label="גוף" count={data.lesson.session.stars.body} />
              </div>
            ) : null}
            <section>
              <h2 className="font-display text-2xl">השביל השבועי</h2>
              <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.week.map((day) => (
                  <li key={day.date} className={`rounded-2xl px-4 py-3 ring-1 ${day.state === "today" ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/10"}`}>
                    <p className="text-sm opacity-80">{day.label}</p>
                    <p className="font-medium">{day.subject ?? "המשך הדרך"}</p>
                    <p className="text-sm">{day.done ? "הושלם" : day.state === "today" ? "היום" : day.state === "past" ? "עבר" : "לפנינו"}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
