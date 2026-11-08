import type { EnglishSentence } from "./types";
import { dayIndex } from "./dates";

export const SENTENCES: EnglishSentence[] = [
  {
    id: "sun",
    sentence: "The sun is warm today.",
    translation: "השמש חמה היום.",
    pronunciation: "דֶ'ה סַאן איז ווֹרְם טוּדֵיי.",
    situation: "עומדות ליד החלון בבוקר ומסתכלות על האור.",
    situationAgain: "חוזרות הביתה והאור בחוץ עדיין נעים.",
    words: [
      { en: "the sun", he: "השמש" },
      { en: "is", he: "היא / פועל היות" },
      { en: "warm", he: "חמה" },
      { en: "today", he: "היום" },
    ],
  },
  {
    id: "learn",
    sentence: "I like to learn new things.",
    translation: "אני אוהבת ללמוד דברים חדשים.",
    pronunciation: "אַיי לַייק טוּ לֶרְן ניוּ ת'ינגז.",
    situation: "פותחות מחברת חדשה בתחילת השיעור.",
    situationAgain: "אחרי ששאלת שאלה שלא הייתה אתמול.",
    words: [
      { en: "I like", he: "אני אוהבת" },
      { en: "to learn", he: "ללמוד" },
      { en: "new", he: "חדשים" },
      { en: "things", he: "דברים" },
    ],
  },
  {
    id: "water",
    sentence: "Please pass the water.",
    translation: "אפשר בבקשה להעביר את המים.",
    pronunciation: "פְּליז פַּאס דֶ'ה ווֹטֶר.",
    situation: "יושבות לשולחן ומבקשות מים בנימוס.",
    situationAgain: "מישהי כבר שתתה, ועכשיו תורך לבקש שוב.",
    words: [
      { en: "please", he: "בבקשה" },
      { en: "pass", he: "להעביר" },
      { en: "the water", he: "המים" },
    ],
  },
  {
    id: "notebook",
    sentence: "Where is my notebook?",
    translation: "איפה המחברת שלי?",
    pronunciation: "וֶור איז מַיי נוֹטְבּוּק.",
    situation: "לפני שמתחילים לכתוב ומחפשות את המחברת בתיק.",
    situationAgain: "המחברת הייתה על השולחן, ועכשיו היא במקום אחר.",
    words: [
      { en: "where", he: "איפה" },
      { en: "is", he: "נמצאת" },
      { en: "my", he: "שלי" },
      { en: "notebook", he: "מחברת" },
    ],
  },
  {
    id: "walk",
    sentence: "We walk together after lunch.",
    translation: "אנחנו הולכות יחד אחרי הארוחה.",
    pronunciation: "ווי ווֹק טוּגֶדֶ'ר אַפְטֶר לַאנְץ'.",
    situation: "יוצאות לצעוד קצר אחרי ארוחת הצהריים.",
    situationAgain: "אתמול הלכתן לבד. היום מישהי מצטרפת.",
    words: [
      { en: "we", he: "אנחנו" },
      { en: "walk", he: "הולכות" },
      { en: "together", he: "יחד" },
      { en: "after lunch", he: "אחרי הארוחה" },
    ],
  },
  {
    id: "book",
    sentence: "This book is very interesting.",
    translation: "הספר הזה מעניין מאוד.",
    pronunciation: "דִיס בּוּק איז וֶרי אינטֶרֶסְטינג.",
    situation: "מסיימות פרק ורוצות לומר מה הרגשתן.",
    situationAgain: "ספר אחר מאתמול היה קשה. היום הספר הזה תופס.",
    words: [
      { en: "this book", he: "הספר הזה" },
      { en: "is", he: "הוא" },
      { en: "very", he: "מאוד" },
      { en: "interesting", he: "מעניין" },
    ],
  },
  {
    id: "thanks",
    sentence: "Thank you for your help.",
    translation: "תודה על העזרה שלך.",
    pronunciation: "תַ'נק יוּ פוֹר יוֹר הֶלְפּ.",
    situation: "מישהי בבית עזרה למצוא משהו, ואומרים תודה.",
    situationAgain: "כבר אמרת תודה בבוקר. עכשיו יש עזרה חדשה.",
    words: [
      { en: "thank you", he: "תודה" },
      { en: "for", he: "על" },
      { en: "your help", he: "העזרה שלך" },
    ],
  },
];

export function householdSentenceId(date: string): string {
  const idx = ((dayIndex(date) % SENTENCES.length) + SENTENCES.length) % SENTENCES.length;
  return SENTENCES[idx].id;
}

export function getSentence(id: string): EnglishSentence {
  const found = SENTENCES.find((s) => s.id === id);
  if (!found) return SENTENCES[0];
  return found;
}

export type EnglishPlan = {
  shared: EnglishSentence;
  situation: string;
  repeatingShared: boolean;
  review: (EnglishSentence & { situation: string }) | null;
};

export function englishPlan(
  needsRepeat: string[],
  date: string,
  sharedId: string,
): EnglishPlan {
  const shared = getSentence(sharedId);
  const repeatingShared = needsRepeat.includes(shared.id);
  const options = needsRepeat.filter((id) => id !== shared.id && SENTENCES.some((s) => s.id === id));
  let review: EnglishPlan["review"] = null;
  if (options.length) {
    const pick = options[((dayIndex(date) % options.length) + options.length) % options.length];
    const sentence = getSentence(pick);
    review = { ...sentence, situation: sentence.situationAgain };
  }
  return {
    shared,
    situation: repeatingShared ? shared.situationAgain : shared.situation,
    repeatingShared,
    review,
  };
}

export function nextEnglishLists(
  mastered: string[],
  needsRepeat: string[],
  sentenceId: string,
  stumbled: boolean,
): { mastered: string[]; needsRepeat: string[] } {
  const master = new Set(mastered);
  const repeat = new Set(needsRepeat);
  if (stumbled) {
    repeat.add(sentenceId);
    master.delete(sentenceId);
  } else {
    master.add(sentenceId);
    repeat.delete(sentenceId);
  }
  return { mastered: [...master], needsRepeat: [...repeat] };
}

export function toPublic(sentence: EnglishSentence) {
  return {
    id: sentence.id,
    sentence: sentence.sentence,
    translation: sentence.translation,
    pronunciation: sentence.pronunciation,
    words: sentence.words,
  };
}
