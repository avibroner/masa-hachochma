function term(token: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${token})(?![\\p{L}\\p{N}])`, "iu");
}

const BLOCKED: RegExp[] = [
  term("יוטיוב|youtube|טיקטוק|tiktok|אינסטגרם|instagram|פייסבוק|facebook|נטפליקס"),
  term("גוגל|google"),
  term("באינטרנט|לינק|קישור"),
  term("עירום|ערומה|ביקיני|סקס|נשיקה|דייט"),
  /בלי בגדים|יחסי מין/,
  term("רוצח|להרוג|רצח|אקדח|רובה"),
  /דם שפוך/,
  term("מטומטם|מטומטמת|דביל|אידיוט|מפגר|יאללה|וואלה|סבבה"),
  term("פוקימון|דיסני|ברבי|יוטיובר"),
  /ignore previous|system prompt|התעלמי מההוראות|תתעלמי מהכללים/i,
];

export function boundaryIssue(text: string): string | null {
  const value = text.trim();
  if (!value) return null;
  for (const pattern of BLOCKED) {
    if (pattern.test(value)) return "bounds";
  }
  return null;
}

export function redirectLine(): string {
  return "זה כיוון שאנחנו לא נכנסות אליו כאן. נחזור בעדינות אל הפלא של השיעור, בלי בושה ובלי רעש.";
}

export function passesSafety(text: string): boolean {
  return boundaryIssue(text) === null;
}

export const SAFETY_MARKERS = [
  "אין להמציא מקור",
  "אין בושה",
  "גוף האדם",
  "לא רומנטי",
  "לא אלים",
];
