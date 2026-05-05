import { Suspense } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { EditWorksheetClient } from "./EditWorksheetClient";

export const runtime = 'edge';

export const metadata = { title: "Edit Worksheet" };

export default function EditWorksheetPage() {
  return (
    <PageContainer as="main">
      <Suspense fallback={<div className="text-muted text-sm">Loading…</div>}>
        <EditWorksheetClient />
      </Suspense>
    </PageContainer>
  );
}
