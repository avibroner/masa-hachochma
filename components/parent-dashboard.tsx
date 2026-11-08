"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PARENT_TOKEN_KEY, getJson, postJson } from "@/lib/client-api";

type Girl = {
  id: string;
  name: string;
  minutes: number;
  lessons: number;
  subjects: { label: string; count: number }[];
  bodyDone: number;
  englishSpoken: number;
  checklistDoneDays: number;
  checklistToday: { id: string; label: string; done: boolean }[];
  strengthened: string[];
  interests: string[];
  streak: number;
  todaySubject: string | null;
  todayDone: boolean;
  nextFocus: string | null;
  upcoming: { label: string; subject: string; depth: string }[];
  visionNote: string | null;
};

type Report = { weekLabel: string; narrative: string; girls: Girl[] };
type Subject = { id: string; label: string };
type RequestItem = { id: string; host: string; note: string; status: string };

export function ParentDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [allowlist, setAllowlist] = useState<{ host: string; label: string }[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [host, setHost] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async (current: string) => {
    const data = await getJson<{
      report: Report;
      profiles: { id: string; name: string }[];
      allowlist: { host: string; label: string }[];
      siteRequests: RequestItem[];
      subjects: Subject[];
    }>("/api/parent", current);
    setReport(data.report);
    setNames(Object.fromEntries(data.profiles.map((profile) => [profile.id, profile.name])));
    setAllowlist(data.allowlist);
    setRequests(data.siteRequests);
    setSubjects(data.subjects);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(PARENT_TOKEN_KEY);
    const timer = window.setTimeout(() => {
      if (!saved) {
        setReady(true);
        return;
      }
      setToken(saved);
      load(saved)
        .catch(() => {
          sessionStorage.removeItem(PARENT_TOKEN_KEY);
          setToken(null);
        })
        .finally(() => setReady(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function mutate(body: Record<string, unknown>) {
    if (!token) return;
    setError("");
    try {
      await postJson("/api/parent", body, token);
      await load(token);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "הפעולה לא נשמרה.");
    }
  }

  return (
    <Shell eyebrow="מסך של אבא">
      {!ready ? <p>פותחת את הסיכום...</p> : null}
      {ready && !token ? (
        <form
          className="mx-auto max-w-md space-y-4 rounded-3xl bg-card p-6 ring-1 ring-foreground/10"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              const data = await postJson<{ token: string }>("/api/parent", { action: "unlock", pin });
              sessionStorage.setItem(PARENT_TOKEN_KEY, data.token);
              setToken(data.token);
              await load(data.token);
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "הקוד לא מתאים.");
            }
          }}
        >
          <h1 className="font-display text-4xl">קוד של אבא</h1>
          <p>ברירת המחדל היא 1234. זה שומר על המסך מפני הילדות, לא מפני העולם.</p>
          <Input value={pin} onChange={(event) => setPin(event.target.value)} inputMode="numeric" type="password" className="h-12 md:text-lg" aria-label="קוד" />
          {error ? <p className="text-destructive">{error}</p> : null}
          <Button size="xl" type="submit">כניסה</Button>
        </form>
      ) : null}
      {token && report ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-4xl">השבוע בבית</h1>
              <p className="text-muted-foreground">{report.weekLabel}</p>
            </div>
            <Button variant="outline" nativeButton={false} render={<Link href="/" />}>אל בחירת הפרופיל</Button>
          </div>
          {error ? <p className="rounded-xl bg-destructive/10 px-4 py-3 text-destructive">{error}</p> : null}
          <p className="rounded-3xl bg-card p-5 text-lg leading-8 ring-1 ring-foreground/10">{report.narrative}</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {report.girls.map((girl) => (
              <section key={girl.id} className="space-y-3 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
                <h2 className="font-display text-3xl">{girl.name}</h2>
                <p>{girl.minutes} דקות · {girl.lessons} שיעורים · רצף {girl.streak}</p>
                <p>גוף: {girl.bodyDone} · אנגלית בקול: {girl.englishSpoken} · ימי סדר מלאים: {girl.checklistDoneDays}</p>
                <p>היום: {girl.todaySubject} {girl.todayDone ? "· הושלם" : "· עוד פתוח"}</p>
                <p>מסלולים: {girl.subjects.map((subject) => `${subject.label} (${subject.count})`).join(", ") || "עדיין אין"}</p>
                <p>התחזק: {girl.strengthened.join(", ") || "עוד נאסף"}</p>
                <p>עניין: {girl.interests.join(", ") || "עוד לא נכתב"}</p>
                {girl.nextFocus ? <p>מוקד להמשך: {girl.nextFocus}</p> : null}
                <ul className="text-sm leading-6 text-muted-foreground">
                  {girl.upcoming.map((item) => (
                    <li key={item.label}>{item.label}: {item.subject} · {item.depth}</li>
                  ))}
                </ul>
                <div>
                  <p className="mb-2 text-sm">סדר היום היום</p>
                  <ul className="flex flex-wrap gap-2">
                    {girl.checklistToday.map((item) => (
                      <li key={item.id} className={`rounded-full px-3 py-1 text-sm ${item.done ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{item.label}</li>
                    ))}
                  </ul>
                  {girl.visionNote ? <p className="mt-2 text-sm">{girl.visionNote}</p> : null}
                </div>
                <label className="block text-sm">הנושא הבא
                  <select
                    className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3"
                    defaultValue=""
                    onChange={(event) => {
                      if (!event.target.value) return;
                      void mutate({ action: "override", profileId: girl.id, subject: event.target.value, forDate: girl.todayDone ? "tomorrow" : "today" });
                      event.target.value = "";
                    }}
                  >
                    <option value="">בחירה</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.label}</option>
                    ))}
                  </select>
                </label>
                <p className="text-sm text-muted-foreground">{girl.todayDone ? "השיעור של היום כבר שמור. הבחירה תחול מחר." : "אם השיעור עוד לא נפתח, הבחירה תחול היום."}</p>
                <div className="flex gap-2">
                  <Input value={names[girl.id] ?? ""} onChange={(event) => setNames((current) => ({ ...current, [girl.id]: event.target.value }))} className="h-11 md:text-base" aria-label={`שם של ${girl.name}`} />
                  <Button type="button" onClick={() => mutate({ action: "rename", profileId: girl.id, name: names[girl.id] })}>שמירת שם</Button>
                </div>
              </section>
            ))}
          </div>

          <section className="space-y-3 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-display text-3xl">מקורות מותרים</h2>
            <p>הילדות לא יוצאות אל האינטרנט. השרת קורא רק מאתרים שברשימה, וכרגע הוא יודע לשלוף ערכים מוויקיפדיה.</p>
            <ul className="space-y-2">
              {allowlist.map((entry) => (
                <li key={entry.host} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2">
                  <span>{entry.label} · {entry.host}</span>
                  <Button variant="outline" size="sm" onClick={() => mutate({ action: "allow-remove", host: entry.host })}>הסרה</Button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Input value={host} onChange={(event) => setHost(event.target.value)} placeholder="example.org" className="h-11 max-w-sm md:text-base" dir="ltr" />
              <Button onClick={() => mutate({ action: "allow-add", host, label: host }).then(() => setHost(""))}>הוספה</Button>
            </div>
            <h3 className="font-display text-2xl">בקשה לאתר חדש</h3>
            <ul className="space-y-2">
              {requests.filter((item) => item.status === "pending").length === 0 ? <li className="text-sm text-muted-foreground">אין בקשות ממתינות.</li> : null}
              {requests.filter((item) => item.status === "pending").map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2">
                  <span>{item.host} · {item.note}</span>
                  <span className="flex gap-2">
                    <Button size="sm" onClick={() => mutate({ action: "site-resolve", requestId: item.id, decision: "approved" })}>אישור</Button>
                    <Button size="sm" variant="outline" onClick={() => mutate({ action: "site-resolve", requestId: item.id, decision: "declined" })}>דחייה</Button>
                  </span>
                </li>
              ))}
            </ul>
            <Button variant="secondary" onClick={() => host && mutate({ action: "site-request", host })}>בקשה לאתר חדש</Button>
          </section>

          <section className="space-y-3 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-display text-3xl">קוד חדש</h2>
            <div className="flex flex-wrap gap-2">
              <Input value={nextPin} onChange={(event) => setNextPin(event.target.value)} inputMode="numeric" type="password" className="h-11 max-w-xs md:text-base" aria-label="קוד חדש" />
              <Button onClick={() => mutate({ action: "pin", nextPin })}>החלפת קוד</Button>
            </div>
            <Button variant="destructive" onClick={() => setResetOpen(true)}>מחיקת התקדמות</Button>
          </section>
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>למחוק את ההתקדמות?</DialogTitle>
                <DialogDescription>השמות, הקוד ורשימת האתרים יישארו. השיעורים והרצף יימחקו.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetOpen(false)}>ביטול</Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await mutate({ action: "reset" });
                    setResetOpen(false);
                  }}
                >
                  מחיקה
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </Shell>
  );
}
