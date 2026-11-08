"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Noga } from "@/components/noga";
import { Shell } from "@/components/shell";
import { getJson } from "@/lib/client-api";

type Profile = { id: string; name: string; role: "child" | "parent" };

export function ProfileHome({
  initialProfiles,
  initialLlm,
}: {
  initialProfiles: Profile[];
  initialLlm: boolean;
}) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [llm, setLlm] = useState(initialLlm);
  const [error, setError] = useState("");

  useEffect(() => {
    getJson<{ profiles: Profile[]; llm: boolean }>("/api/bootstrap")
      .then((data) => {
        setProfiles(data.profiles);
        setLlm(data.llm);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "לא הצלחתי לפתוח את הבית."));
  }, []);

  const girls = profiles.filter((profile) => profile.role === "child");

  return (
    <Shell eyebrow="למידה בבית, בקצב שלכן">
      <div className="grid items-center gap-8 md:grid-cols-[280px_1fr]">
        <Noga className="mx-auto h-80 w-auto md:h-[420px]" />
        <div className="space-y-5">
          <h1 className="font-display text-5xl leading-tight">בחרו מי נכנסת היום</h1>
          <p className="max-w-xl text-lg leading-8">נוגה מחכה עם פנס ומחברת. לכל אחת מסלול משלה, ומשפט האנגלית של היום אחד לכל הבית.</p>
          {error ? <p className="rounded-xl bg-destructive/10 px-4 py-3 text-destructive">{error}</p> : null}
          {!llm && profiles.length ? <p className="text-sm text-muted-foreground">אפשר ללמוד עכשיו מתוך ספריית הבית, גם לפני שמכניסים מפתח.</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {girls.map((girl) => (
              <Link key={girl.id} href={`/child/${girl.id}`} className="rounded-3xl bg-card px-5 py-6 ring-1 ring-foreground/10 transition hover:ring-primary">
                <span className="block text-sm text-primary">פרופיל</span>
                <span className="font-display block text-3xl">{girl.name}</span>
                <span className="mt-2 block text-sm text-muted-foreground">שיעור, אנגלית, הפסקת גוף וסדר יום</span>
              </Link>
            ))}
          </div>
          <Link href="/parent" className="block rounded-3xl bg-primary px-5 py-6 text-primary-foreground">
            <span className="block text-sm opacity-80">הורה</span>
            <span className="font-display block text-3xl">אבא</span>
            <span className="mt-2 block text-sm opacity-80">סיכום שבועי, שמות, ומקורות מותרים</span>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
