"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Noga } from "@/components/noga";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { getJson, postJson } from "@/lib/client-api";

type Item = { id: string; label: string; ask: string; done: boolean };
type Vision = { target: "room" | "bag"; tidy: boolean; message: string } | null;

export function ChecklistPanel({ profileId }: { profileId: string }) {
  const [name, setName] = useState("");
  const [period, setPeriod] = useState<"morning" | "evening">("evening");
  const [items, setItems] = useState<Item[]>([]);
  const [visionEnabled, setVisionEnabled] = useState(false);
  const [vision, setVision] = useState<Vision>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getJson<{ name: string; period: "morning" | "evening"; vision: boolean; items: Item[]; visionNote: Vision }>(`/api/checklist?profileId=${profileId}`)
      .then((data) => {
        if (cancelled) return;
        setName(data.name);
        setPeriod(data.period);
        setItems(data.items);
        setVisionEnabled(data.vision);
        setVision(data.visionNote);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "הרשימה לא נפתחה.");
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  async function toggle(item: Item) {
    setBusy(true);
    setError("");
    try {
      const data = await postJson<{ items: Item[]; visionNote: Vision }>("/api/checklist", {
        profileId,
        item: item.id,
        done: !item.done,
      });
      setItems(data.items);
      setVision(data.visionNote);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "הסימון לא נשמר.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(target: "room" | "bag", file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("profileId", profileId);
      form.set("target", target);
      form.set("image", file);
      const response = await fetch("/api/checklist/photo", { method: "POST", body: form });
      const data = (await response.json()) as { ok?: boolean; error?: string; vision?: Vision };
      if (!response.ok || data.ok === false || !data.vision) throw new Error(data.error || "התמונה לא נבדקה.");
      setVision(data.vision);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "התמונה לא נבדקה.");
    } finally {
      setBusy(false);
    }
  }

  const greeting = period === "morning"
    ? "בוקר טוב. נבדוק שהתיק מוכן והחדר נעים."
    : "האם כבר סידרת את החדר? יש מערכת למחר?";

  return (
    <Shell eyebrow={name ? `סדר היום של ${name}` : "סדר היום"}>
      <div className="grid items-start gap-6 md:grid-cols-[200px_1fr]">
        <Noga className="mx-auto h-64 w-auto" />
        <div className="space-y-4">
          <h1 className="font-display text-4xl">סדר היום בבית</h1>
          <p className="text-lg leading-8">{greeting}</p>
          {error ? <p className="rounded-xl bg-destructive/10 px-4 py-3 text-destructive">{error}</p> : null}
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(item)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-4 text-start ring-1 ${item.done ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/10"}`}
                >
                  <span>
                    <span className="block font-display text-2xl">{item.label}</span>
                    <span className="block text-sm opacity-80">{item.ask}</span>
                  </span>
                  <span className="text-sm">{item.done ? "סומן" : "לסמן"}</span>
                </button>
              </li>
            ))}
          </ul>
          {visionEnabled ? (
            <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <p>אפשר לצרף תמונה של החדר או של התיק. התמונה לא נשמרת, רק תשובה קצרה.</p>
              <label className="block text-sm">תמונת חדר
                <input className="mt-1 block w-full" type="file" accept="image/*" onChange={(event) => upload("room", event.target.files?.[0])} />
              </label>
              <label className="block text-sm">תמונת תיק
                <input className="mt-1 block w-full" type="file" accept="image/*" onChange={(event) => upload("bag", event.target.files?.[0])} />
              </label>
              {vision ? <p className="leading-8">{vision.message}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">בלי מפתח API נשארים עם הרשימה, בלי בדיקת תמונה.</p>
          )}
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href={`/child/${profileId}`} />}>חזרה אל נוגה</Button>
        </div>
      </div>
    </Shell>
  );
}
