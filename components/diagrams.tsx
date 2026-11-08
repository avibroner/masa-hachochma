import type { DiagramId } from "@/lib/types";

const frame = "w-full max-w-md rounded-2xl bg-[#fffaf3] p-3 ring-1 ring-[#e4d3b8]";

function Caption({ children }: { children: string }) {
  return <p className="mt-2 text-center text-sm text-muted-foreground">{children}</p>;
}

export function LessonDiagram({ id }: { id: DiagramId }) {
  if (id === "heart") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="תרשים פשוט של לב כמשאבה">
          <path d="M160 150c-48-28-92-58-92-100 0-24 18-36 36-36 16 0 28 8 36 20 8-12 20-20 36-20 18 0 36 12 36 36 0 42-44 72-52 100z" fill="#f3d2cc" stroke="#8d4b3c" strokeWidth="3" />
          <path d="M160 46v96" stroke="#8d4b3c" strokeWidth="2" />
          <path d="M92 92h136" stroke="#8d4b3c" strokeWidth="2" />
          <text x="104" y="78" fontSize="13" fill="#5c5146">עלייה</text>
          <text x="196" y="78" fontSize="13" fill="#5c5146">עלייה</text>
          <text x="108" y="124" fontSize="13" fill="#5c5146">חדר</text>
          <text x="198" y="124" fontSize="13" fill="#5c5146">חדר</text>
          <path d="M236 48c18 8 22 22 8 34" fill="none" stroke="#1d645d" strokeWidth="3" />
          <text x="214" y="34" fontSize="12" fill="#1d645d">דם יוצא אל הגוף</text>
        </svg>
        <Caption>תרשים לימודי של משאבה. לא ציור של גוף.</Caption>
      </figure>
    );
  }
  if (id === "lungs") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 180" className="h-auto w-full" role="img" aria-label="תרשים של קנה ושתי ריאות">
          <path d="M160 20v50" stroke="#1d645d" strokeWidth="8" strokeLinecap="round" />
          <path d="M160 70c-30 10-70 20-78 70-6 36 20 24 40 8 10-8 22-28 38-28" fill="#d7ebe4" stroke="#1d645d" strokeWidth="3" />
          <path d="M160 70c30 10 70 20 78 70 6 36-20 24-40 8-10-8-22-28-38-28" fill="#d7ebe4" stroke="#1d645d" strokeWidth="3" />
          <text x="70" y="150" fontSize="13" fill="#5c5146">ריאה</text>
          <text x="214" y="150" fontSize="13" fill="#5c5146">ריאה</text>
          <text x="168" y="40" fontSize="13" fill="#1d645d">אוויר</text>
        </svg>
        <Caption>תרשים של דרך האוויר. בלי ציור גוף.</Caption>
      </figure>
    );
  }
  if (id === "light") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 160" className="h-auto w-full" role="img" aria-label="מנורה, ספר וצל על קיר">
          <rect x="250" y="20" width="16" height="120" fill="#e7d7bc" />
          <circle cx="48" cy="48" r="16" fill="#f0c36a" />
          <path d="M64 48 L150 70 L250 30 L250 130 L170 100 Z" fill="#f6e2bc" opacity="0.7" />
          <rect x="146" y="68" width="28" height="40" rx="3" fill="#1d645d" />
          <path d="M174 78 L250 40 L250 120 L190 108 Z" fill="#c4b49a" opacity="0.85" />
          <text x="20" y="150" fontSize="13" fill="#5c5146">אור ישר</text>
          <text x="200" y="150" fontSize="13" fill="#5c5146">צל</text>
        </svg>
        <Caption>אור נע ישר, וחפץ אטום משאיר צל.</Caption>
      </figure>
    );
  }
  if (id === "magnet") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 150" className="h-auto w-full" role="img" aria-label="מגנט ושני קטבים">
          <path d="M70 40h40v70H70z" fill="#8d4b3c" />
          <path d="M110 40h50v70h-50z" fill="#e7e1d6" />
          <path d="M160 40h40v70h-40z" fill="#1d645d" />
          <text x="78" y="80" fontSize="16" fill="#fffaf3">N</text>
          <text x="168" y="80" fontSize="16" fill="#fffaf3">S</text>
          <circle cx="250" cy="74" r="10" fill="#8a8f93" />
          <text x="230" y="120" fontSize="13" fill="#5c5146">ברזל נמשך</text>
        </svg>
        <Caption>שני קטבים. לא כל מתכת נמשכת.</Caption>
      </figure>
    );
  }
  if (id === "pattern") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 120" className="h-auto w-full" role="img" aria-label="סדרת נקודות שגדלה בזוגות">
          {[0, 1, 2, 3].map((group) =>
            Array.from({ length: group + 2 }).map((_, dot) => (
              <circle key={`${group}-${dot}`} cx={40 + group * 70} cy={30 + dot * 16} r="6" fill="#1d645d" />
            )),
          )}
        </svg>
        <Caption>כל קבוצה מוסיפה נקודה. זה כלל, לא אוסף.</Caption>
      </figure>
    );
  }
  if (id === "lake") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 160" className="h-auto w-full" role="img" aria-label="סקיצה של אגם בין גבעות, צפון למעלה">
          <path d="M20 110c40-50 80-40 120-10 30 24 70 20 110-16 20 30 24 50 10 66H30c-16-10-16-24-10-40z" fill="#c5ddd4" />
          <ellipse cx="168" cy="96" rx="46" ry="22" fill="#7eb0c9" />
          <text x="150" y="100" fontSize="13" fill="#1d3d4a">כנרת</text>
          <text x="146" y="28" fontSize="13" fill="#5c5146">צפון</text>
          <text x="40" y="78" fontSize="12" fill="#5c5146">גבעות</text>
        </svg>
        <Caption>סקיצה לימודית, לא מפה מדינית.</Caption>
      </figure>
    );
  }
  if (id === "compare") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 140" className="h-auto w-full" role="img" aria-label="שני עיגולים חופפים: דומה ושונה">
          <circle cx="130" cy="70" r="46" fill="#d7ebe4" stroke="#1d645d" strokeWidth="3" />
          <circle cx="190" cy="70" r="46" fill="#f6e2bc" stroke="#c4882a" strokeWidth="3" />
          <text x="78" y="74" fontSize="13" fill="#1d645d">שונה</text>
          <text x="148" y="74" fontSize="13" fill="#5c5146">דומה</text>
          <text x="214" y="74" fontSize="13" fill="#8a5e16">שונה</text>
        </svg>
        <Caption>האמצע הוא הדמיון. הצדדים הם ההבדל.</Caption>
      </figure>
    );
  }
  if (id === "bee") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 140" className="h-auto w-full" role="img" aria-label="תרשים פשוט של דבורה">
          <ellipse cx="150" cy="70" rx="28" ry="16" fill="#f0c36a" stroke="#3f2c24" />
          <path d="M138 70h24M150 56v28" stroke="#3f2c24" strokeWidth="3" />
          <circle cx="186" cy="70" r="12" fill="#3f2c24" />
          <path d="M130 58c-20-24-10-30 8-16M130 82c-20 24-10 30 8 16" fill="none" stroke="#1d645d" strokeWidth="3" />
          <text x="40" y="40" fontSize="13" fill="#5c5146">כנף</text>
          <text x="210" y="74" fontSize="13" fill="#5c5146">ראש</text>
        </svg>
        <Caption>תרשים צנוע של מבנה, לא תמונה.</Caption>
      </figure>
    );
  }
  if (id === "ifthen") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 120" className="h-auto w-full" role="img" aria-label="שתי תיבות: אם ואז">
          <rect x="24" y="36" width="100" height="48" rx="10" fill="#d7ebe4" stroke="#1d645d" />
          <rect x="196" y="36" width="100" height="48" rx="10" fill="#f6e2bc" stroke="#c4882a" />
          <path d="M124 60h72" stroke="#5c5146" strokeWidth="3" />
          <text x="58" y="66" fontSize="18" fill="#1d645d">אם</text>
          <text x="230" y="66" fontSize="18" fill="#8a5e16">אז</text>
        </svg>
        <Caption>תנאי, ואחר כך תוצאה.</Caption>
      </figure>
    );
  }
  if (id === "lamp") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 150" className="h-auto w-full" role="img" aria-label="מנורת שמן פשוטה">
          <path d="M110 90h100c10 20-10 36-50 36s-60-16-50-36z" fill="#c4a574" stroke="#8a5e16" />
          <path d="M168 90c20-8 28-8 36 0" fill="none" stroke="#8a5e16" strokeWidth="4" />
          <path d="M160 90 V70" stroke="#5c5146" strokeWidth="3" />
          <ellipse className="flame" cx="160" cy="60" rx="6" ry="12" fill="#f6c15b" />
          <text x="70" y="140" fontSize="13" fill="#5c5146">שמן</text>
          <text x="188" y="78" fontSize="13" fill="#5c5146">פתיל</text>
        </svg>
        <Caption>השמן הוא הדלק. הפתיל הוא הדרך.</Caption>
      </figure>
    );
  }
  if (id === "water") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 150" className="h-auto w-full" role="img" aria-label="מחזור מים: ים, אדים, ענן וגשם">
          <ellipse cx="70" cy="110" rx="40" ry="16" fill="#7eb0c9" />
          <path d="M70 96c8-30 8-40 0-58" stroke="#1d645d" strokeWidth="2" strokeDasharray="4 4" fill="none" />
          <ellipse cx="180" cy="40" rx="36" ry="16" fill="#e7e1d6" />
          <path d="M200 56 v30" stroke="#7eb0c9" strokeWidth="3" />
          <path d="M214 56 v24" stroke="#7eb0c9" strokeWidth="3" />
          <circle cx="40" cy="36" r="12" fill="#f0c36a" />
          <text x="28" y="140" fontSize="12" fill="#5c5146">מים</text>
          <text x="160" y="28" fontSize="12" fill="#5c5146">ענן</text>
        </svg>
        <Caption>אדים, ענן, גשם, וחוזר.</Caption>
      </figure>
    );
  }
  if (id === "measure") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 140" className="h-auto w-full" role="img" aria-label="כוס ומשקל">
          <path d="M40 30h50l-8 70h-34z" fill="none" stroke="#1d645d" strokeWidth="3" />
          <path d="M150 80h70" stroke="#8a5e16" strokeWidth="4" />
          <path d="M185 50 v40" stroke="#8a5e16" strokeWidth="4" />
          <circle cx="160" cy="96" r="10" fill="#c4a574" />
          <circle cx="210" cy="96" r="14" fill="#8d4b3c" />
          <text x="48" y="120" fontSize="13" fill="#5c5146">נפח</text>
          <text x="168" y="120" fontSize="13" fill="#5c5146">משקל</text>
        </svg>
        <Caption>כוס אינה גרם. שתי מידות שונות.</Caption>
      </figure>
    );
  }
  if (id === "rhythm") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 120" className="h-auto w-full" role="img" aria-label="ארבעה סימני קצב">
          {[0, 1, 2, 3].map((index) => (
            <rect key={index} x={36 + index * 70} y={index === 0 ? 30 : 50} width="28" height={index === 0 ? 50 : 30} rx="6" fill={index === 3 ? "#e7d7bc" : "#1d645d"} />
          ))}
        </svg>
        <Caption>חזק, חלש, חלש, והפסקה בהירה.</Caption>
      </figure>
    );
  }
  if (id === "system") {
    return (
      <figure className={frame}>
        <svg viewBox="0 0 320 140" className="h-auto w-full" role="img" aria-label="שלושה חלקים מחוברים למטרה">
          <circle cx="70" cy="70" r="26" fill="#d7ebe4" stroke="#1d645d" />
          <circle cx="160" cy="40" r="26" fill="#f6e2bc" stroke="#c4882a" />
          <circle cx="250" cy="70" r="26" fill="#f3d2cc" stroke="#8d4b3c" />
          <path d="M94 60 L136 46 M184 46 L226 60 M96 78 H224" stroke="#5c5146" strokeWidth="2" />
          <text x="58" y="74" fontSize="12" fill="#1d645d">חלק</text>
          <text x="148" y="44" fontSize="12" fill="#8a5e16">חלק</text>
          <text x="238" y="74" fontSize="12" fill="#8d4b3c">חלק</text>
        </svg>
        <Caption>חלקים עם קשר. יחד יש מטרה.</Caption>
      </figure>
    );
  }
  return (
    <figure className={frame}>
      <svg viewBox="0 0 320 110" className="h-auto w-full" role="img" aria-label="שלוש תיבות של משפט אנגלי">
        {["Please", "pass", "the water"].map((word, index) => (
          <g key={word}>
            <rect x={16 + index * 100} y="30" width="92" height="40" rx="8" fill={index === 0 ? "#f6e2bc" : "#d7ebe4"} />
            <text x={28 + index * 100} y="56" fontSize="14" fill="#2a241c">{word}</text>
          </g>
        ))}
      </svg>
      <Caption>נימוס, פעולה, ואז הדבר. הסדר באנגלית משנה.</Caption>
    </figure>
  );
}
