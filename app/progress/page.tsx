import type { Metadata } from "next";
import { getAllTopics } from "@/lib/content/loader";
import { ProgressClient } from "@/components/ProgressClient";

export const metadata: Metadata = {
  title: "My Progress",
  description: "Track your worksheet scores, streaks, and learning history on At Ease Learning.",
};

export default async function ProgressPage() {
  // Fetch topic titles at build time so the client component has friendly names
  // without needing a runtime API call to the filesystem.
  const allTopics = await getAllTopics();
  const titleMap = Object.fromEntries(
    allTopics.map((t) => [`${t.subject}/${t.year}/${t.slug}`, t.title])
  );

  return <ProgressClient titleMap={titleMap} />;
}
