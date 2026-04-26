"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { WorksheetEditorClient } from "@/components/admin/WorksheetEditorClient";
import type { Worksheet, Question } from "@/lib/content/types";

interface TopicDetail {
  id: number;
  syncId: string;
  title: string;
  subject: { name: string; year: { displayName: string } | null } | null;
  worksheet: {
    id: number;
    syncId: string;
    title: string;
    questions: Question[];
    difficulty: number;
    isPublished: boolean;
  } | null;
}

export default function WorksheetEditorPage() {
  const { syncId } = useParams<{ syncId: string }>();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/topics/sync/${syncId}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const data: TopicDetail = await res.json();
      setTopic(data);

      // Fetch attempt count so the editor can warn before overwriting
      if (data.id) {
        const wsRes = await fetch(`/api/admin/worksheet?topicId=${data.id}`);
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          setAttemptCount(wsData.attemptCount ?? 0);
        }
      }
      setLoading(false);
    }
    load();
  }, [syncId]);

  if (loading) {
    return <PageContainer as="main"><p className="text-muted animate-pulse">Loading…</p></PageContainer>;
  }
  if (notFound || !topic) {
    return (
      <PageContainer as="main">
        <p className="text-muted">Topic not found.</p>
        <Link href="/admin/topics" className="text-primary hover:underline text-sm mt-2 inline-block">← Back to Topics</Link>
      </PageContainer>
    );
  }

  // Build a Worksheet object compatible with the editor (or null if none exists)
  const initialWorksheet: Worksheet | null = topic.worksheet
    ? {
        id: topic.worksheet.id,
        syncId: topic.worksheet.syncId,
        title: topic.worksheet.title,
        questions: topic.worksheet.questions,
        difficulty: topic.worksheet.difficulty,
      }
    : null;

  return (
    <PageContainer as="main">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-8">
        <Link href="/admin/topics" className="hover:text-fg transition-colors">Topics</Link>
        <span>/</span>
        <Link href={`/admin/topics/${syncId}`} className="hover:text-fg transition-colors truncate max-w-[200px]">
          {topic.title}
        </Link>
        <span>/</span>
        <span className="text-fg">Worksheet</span>
      </div>

      <WorksheetEditorClient
        topicId={topic.id}
        topicSyncId={topic.syncId}
        topicTitle={topic.title}
        initialWorksheet={initialWorksheet}
        attemptCount={attemptCount}
        backHref={`/admin/topics/${syncId}`}
      />
    </PageContainer>
  );
}
