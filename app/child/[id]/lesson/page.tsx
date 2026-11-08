import { Suspense } from "react";
import { LessonExperience } from "@/components/lesson-experience";

async function Gate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonExperience profileId={id} />;
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-lg">נוגה פותחת את המחברת...</p>}>
      <Gate params={params} />
    </Suspense>
  );
}
