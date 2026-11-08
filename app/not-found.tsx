import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="font-display text-3xl">העמוד הזה לא במפה</h1>
      <p className="mt-3">חוזרות אל בחירת הפרופיל.</p>
      <Link href="/" className="mt-4 inline-block text-primary">אל הבית</Link>
    </div>
  );
}
