"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WorksheetEditorClient } from "@/components/admin/WorksheetEditorClient";
import type { Worksheet, Question } from "@/lib/content/types";

export function EditWorksheetClient() {
  const searchParams = useSearchParams();
  const syncId = searchParams.get("syncId") ?? "";

  const [status, setStatus] = useState<"loading" | "ready" | "not-found">("loading");
  const [topicTitle, setTopicTitle] = useState("");
  const [topicId, setTopicId] = useState<number | null>(null);
  const [initialWorksheet, setInitialWorksheet] = useState<Worksheet | null>(null);

  useEffect(() => {
    if (!syncId) {
      setStatus("not-found");
      return;
    }

    const supabase = createClient();
    supabase
      .from("topics")
      .select(`
        id,
        title,
        worksheets ( id, sync_id, title, questions, difficulty, deleted_at )
      `)
      .is("deleted_at", null)
      .eq("sync_id", syncId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setStatus("not-found");
          return;
        }

        setTopicTitle(data.title);
        setTopicId(data.id as number);

        const wsRow = Array.isArray(data.worksheets)
          ? data.worksheets[0]
          : data.worksheets;

        if (wsRow && !wsRow.deleted_at) {
          setInitialWorksheet({
            id: wsRow.id as number,
            syncId: wsRow.sync_id as string,
            title: wsRow.title as string,
            questions: wsRow.questions as unknown as Question[],
            difficulty: wsRow.difficulty as number,
          });
        }

        setStatus("ready");
      });
  }, [syncId]);

  if (status === "loading") {
    return <div className="text-muted text-sm animate-pulse">Loading topic…</div>;
  }

  if (status === "not-found") {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-semibold text-fg mb-2">Topic not found</p>
        <Link href="/admin/worksheets" className="text-sm text-muted hover:text-fg">
          ← Back to worksheet editor
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6 flex items-center gap-1.5">
        <Link href="/admin/worksheets" className="hover:text-fg transition-colors">
          Worksheet Editor
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-fg font-medium">{topicTitle}</span>
      </nav>

      <WorksheetEditorClient
        topicId={topicId!}
        topicSyncId={syncId}
        topicTitle={topicTitle}
        initialWorksheet={initialWorksheet}
      />
    </>
  );
}
