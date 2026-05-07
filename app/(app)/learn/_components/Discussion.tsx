import type { CommentNode } from "../_lib/types";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";

interface Props {
  commentCount: number;
  comments: CommentNode[];
}

export function Discussion({ commentCount, comments }: Props) {
  const label =
    commentCount === 0
      ? "Be the first to comment"
      : `View discussion (${commentCount} comment${commentCount === 1 ? "" : "s"})`;

  return (
    <section aria-label="Discussion" className="mt-12 pt-8 border-t border-border">
      <details className="group">
        <summary className="cursor-pointer [&::-webkit-details-marker]:hidden marker:hidden flex items-center gap-2 text-sm font-medium text-muted hover:text-fg transition-colors rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 shrink-0 group-open:rotate-90 transition-transform duration-200"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          {label}
        </summary>

        <div className="mt-6 space-y-8">
          {comments.length > 0 && <CommentThread comments={comments} />}
          <CommentForm />
        </div>
      </details>
    </section>
  );
}
