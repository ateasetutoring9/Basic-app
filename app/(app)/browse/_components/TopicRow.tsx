import Link from "next/link";
import type { BrowseTopic } from "../_lib/loaders";

export function TopicRow({ topic }: { topic: BrowseTopic }) {
  const parts: string[] = [];
  if (topic.hasLecture) parts.push("Lecture");
  if (topic.questionCount > 0) parts.push(`${topic.questionCount}-question worksheet`);
  const subLine = parts.join(" · ");

  return (
    <li>
      <Link
        href={`/learn/${topic.syncId}`}
        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary"
      >
        <div className="min-w-0">
          <p className="font-medium text-fg leading-snug">{topic.title}</p>
          {subLine && (
            <p className="text-sm text-muted mt-0.5">{subLine}</p>
          )}
        </div>
        <div className="shrink-0">
          {topic.attempted ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"
              aria-label="You have attempted this topic"
            >
              ✓ Attempted
            </span>
          ) : (
            <span
              className="text-xs font-medium text-muted"
              aria-label="You have not started this topic"
            >
              Not started
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
