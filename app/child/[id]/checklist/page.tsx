import { Suspense } from "react";
import { ChecklistPanel } from "@/components/checklist-panel";

async function Gate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChecklistPanel profileId={id} />;
}

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-lg">נוגה בודקת את הרשימה...</p>}>
      <Gate params={params} />
    </Suspense>
  );
}
