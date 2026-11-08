import { Suspense } from "react";
import { ChildHome } from "@/components/child-home";

async function Gate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChildHome profileId={id} />;
}

export default function ChildPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-lg">נוגה מדליקה את הפנס...</p>}>
      <Gate params={params} />
    </Suspense>
  );
}
