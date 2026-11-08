export function Stars({
  label,
  count,
  note,
}: {
  label: string;
  count: number;
  note?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="font-display text-xl">{label}</p>
      <div className="mt-2 flex gap-1" aria-label={`${label}: ${count} מתוך 3`}>
        {[1, 2, 3].map((star) => (
          <svg key={star} viewBox="0 0 24 24" className="size-7" aria-hidden="true">
            <path
              d="M12 3.2 14.7 9l6.3.6-4.8 4.1 1.5 6.1L12 16.8 6.3 19.8 7.8 13.7 3 9.6 9.3 9z"
              fill={star <= count ? "#e39b2b" : "#e7dcc8"}
            />
          </svg>
        ))}
      </div>
      {note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{note}</p> : null}
    </div>
  );
}
