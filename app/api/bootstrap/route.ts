import { connection } from "next/server";
import { todayISO } from "@/lib/dates";
import { llmStatus, visionEnabled } from "@/lib/llm";
import { jsonOk } from "@/lib/respond";
import { store } from "@/lib/store";

export async function GET() {
  await connection();
  const profiles = store.read((db) => db.profiles.map((profile) => ({ id: profile.id, name: profile.name, role: profile.role })));
  return jsonOk({
    profiles,
    date: todayISO(),
    llm: llmStatus().enabled,
    vision: visionEnabled(),
    provider: llmStatus().provider,
  });
}
