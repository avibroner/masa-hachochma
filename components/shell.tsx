import Link from "next/link";
import { LanternMark } from "@/components/noga";

export function Shell({
  children,
  eyebrow,
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5 md:px-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring">
          <LanternMark />
          <span>
            <span className="font-display block text-2xl leading-none text-primary md:text-3xl">מסע החכמה</span>
            {eyebrow ? <span className="mt-1 block text-sm text-muted-foreground">{eyebrow}</span> : null}
          </span>
        </Link>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="mt-10 pb-4 text-sm text-muted-foreground">הלמידה נשארת בבית. אין כאן חיפוש פתוח, ואין לוח תוצאות.</footer>
    </div>
  );
}
