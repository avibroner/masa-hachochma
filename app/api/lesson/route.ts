import { connection } from "next/server";
import { todayISO } from "@/lib/dates";
import {
  completeLesson,
  saveBody,
  saveEnglish,
  saveOpening,
  reachStep,
  startLesson,
  submitChallenge,
  submitConclusion,
} from "@/lib/lesson-service";
import { jsonError, jsonOk, readJson } from "@/lib/respond";
import { findChild, store } from "@/lib/store";
import type { Ease } from "@/lib/types";

type Body = {
  action?: string;
  profileId?: string;
  note?: string;
  step?: number;
  answer?: string;
  text?: string;
  spoken?: boolean;
  stumbled?: boolean;
  how?: "recognition" | "checkbox";
  reviewSpoken?: boolean;
  reviewStumbled?: boolean;
  reviewHow?: "recognition" | "checkbox";
  done?: boolean;
  ease?: Ease | null;
  interest?: string;
};

export async function POST(request: Request) {
  await connection();
  const body = await readJson<Body>(request);
  const profileId = body?.profileId;
  if (!profileId || !store.read((db) => findChild(db, profileId))) {
    return jsonError("לא מצאתי את הפרופיל.");
  }
  const date = todayISO();
  try {
    if (body?.action === "start") {
      const lesson = await startLesson(profileId, date);
      return jsonOk({ lesson });
    }
    if (body?.action === "reach") {
      return jsonOk({ lesson: reachStep(profileId, date, Number(body.step)) });
    }
    if (body?.action === "opening") {
      return jsonOk({ lesson: saveOpening(profileId, date, body.note ?? "") });
    }
    if (body?.action === "challenge") {
      return jsonOk({ lesson: submitChallenge(profileId, date, body.answer ?? "") });
    }
    if (body?.action === "conclusion") {
      return jsonOk({ lesson: submitConclusion(profileId, date, body.text ?? "") });
    }
    if (body?.action === "english") {
      if (!body.spoken || (body.how !== "recognition" && body.how !== "checkbox") || typeof body.stumbled !== "boolean") {
        return jsonError("סמני שאמרת את המשפט, ואיך זה הרגיש.");
      }
      return jsonOk({
        lesson: saveEnglish(profileId, date, {
          spoken: true,
          stumbled: body.stumbled,
          how: body.how,
          reviewSpoken: body.reviewSpoken,
          reviewStumbled: body.reviewStumbled,
          reviewHow: body.reviewHow,
        }),
      });
    }
    if (body?.action === "body") {
      if (typeof body.done !== "boolean") return jsonError("סמני אם ההפסקה נעשתה.");
      return jsonOk({ lesson: saveBody(profileId, date, body.done) });
    }
    if (body?.action === "complete") {
      const ease = body.ease === "too_easy" || body.ease === "just_right" || body.ease === "too_hard" ? body.ease : null;
      const lesson = await completeLesson(profileId, date, { ease, interest: body.interest ?? "" });
      return jsonOk({ lesson });
    }
    return jsonError("פעולה לא מוכרת.");
  } catch (error) {
    console.error(error);
    return jsonError("השיעור לא נשמר. אפשר לנסות שוב.", 500);
  }
}
