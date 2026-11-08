"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="font-display text-3xl">משהו נתקע במחברת</h1>
      <p className="mt-3 leading-8">אפשר לרענן ולהמשיך מהמקום שנשמר.</p>
      <button type="button" className="mt-4 rounded-xl bg-primary px-4 py-3 text-primary-foreground" onClick={reset}>
        נסי שוב
      </button>
    </div>
  );
}
