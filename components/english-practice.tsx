"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { PublicSentence } from "@/lib/types";

type How = "recognition" | "checkbox";

function scoreSpeech(expected: string, heard: string): number {
  const words = expected.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const heardWords = heard.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  if (!words.length || !heardWords.length) return 0;
  const hits = words.filter((word) => heardWords.some((item) => item === word || item.includes(word) || word.includes(item))).length;
  return hits / words.length;
}

export function EnglishPractice({
  sentence,
  situation,
  repeating,
  title,
  onDone,
}: {
  sentence: PublicSentence;
  situation: string;
  repeating?: boolean;
  title: string;
  onDone: (result: { how: How; stumbled: boolean }) => void;
}) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => {
      const browser = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
      return Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition);
    },
    () => false,
  );
  const [heard, setHeard] = useState("");
  const [listening, setListening] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const [how, setHow] = useState<How>("checkbox");
  const [micNote, setMicNote] = useState("");

  function speak() {
    const utterance = new SpeechSynthesisUtterance(sentence.sentence);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function listen() {
    type RecognitionResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
    type Recognition = {
      lang: string;
      interimResults: boolean;
      start: () => void;
      onresult: ((event: RecognitionResult) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };
    const browser = window as Window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Ctor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Ctor) {
      setMicNote("בדפדפן הזה אין זיהוי דיבור. אפשר לסמן שאמרת את המשפט בקול בבית.");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    setListening(true);
    setMicNote("");
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setHeard(transcript);
      const good = scoreSpeech(sentence.sentence, transcript) >= 0.6;
      setSpoken(true);
      setHow("recognition");
      setMicNote(good ? "שמעתי את המשפט. יפה." : "שמעתי חלק. אפשר לנסות שוב, או לסמן שאמרת את זה בקול בבית.");
    };
    recognition.onerror = () => {
      setListening(false);
      setMicNote("המיקרופון לא ענה. אפשר לסמן שאמרת את המשפט בקול בבית.");
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      {repeating ? <p className="text-base text-primary">את המשפט הזה פגשת. היום הוא מופיע במצב אחר.</p> : null}
      <p className="text-base leading-8">{situation}</p>
      <p dir="ltr" className="font-display text-3xl leading-tight text-primary">{sentence.sentence}</p>
      <p className="text-lg">{sentence.translation}</p>
      <p className="text-sm text-muted-foreground" dir="ltr">{sentence.pronunciation}</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {sentence.words.map((word) => (
          <li key={word.en} className="rounded-xl bg-muted px-3 py-2">
            <span dir="ltr" className="font-medium">{word.en}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span>{word.he}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" variant="secondary" onClick={speak}>השמיעי לי</Button>
        {supported ? (
          <Button type="button" size="lg" onClick={listen} disabled={listening}>{listening ? "מקשיבה..." : "אמרי בקול"}</Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => {
            setSpoken(true);
            setHow("checkbox");
            setMicNote("סומן שאמרת את המשפט בקול בבית.");
          }}
        >
          אמרתי את זה בקול בבית
        </Button>
      </div>
      {heard ? <p className="text-sm text-muted-foreground">מה שנשמע: <span dir="ltr">{heard}</span></p> : null}
      {micNote ? <p>{micNote}</p> : null}
      {spoken ? (
        <div className="space-y-2">
          <p>איך היה לומר את זה?</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" onClick={() => onDone({ how, stumbled: false })}>הצלחתי</Button>
            <Button type="button" size="lg" variant="secondary" onClick={() => onDone({ how, stumbled: true })}>נחזור בעדינות</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
