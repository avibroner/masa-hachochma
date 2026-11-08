import { connection } from "next/server";
import { ProfileHome } from "@/components/profile-home";
import { llmStatus } from "@/lib/llm";
import { store } from "@/lib/store";

export default async function HomePage() {
  await connection();
  const profiles = store.read((db) => db.profiles);
  return <ProfileHome initialProfiles={profiles} initialLlm={llmStatus().enabled} />;
}
