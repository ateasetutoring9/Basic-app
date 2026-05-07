import type { CommentNode } from "../_lib/types";

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const DEPTH_CAP = 2; // renders depths 0, 1, 2 — three visual levels

function CommentItem({ comment, depth }: { comment: CommentNode; depth: number }) {
  return (
    <li className={depth > 0 ? "border-l-2 border-border pl-4" : ""}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-sm font-semibold text-fg">{comment.authorName}</span>
        <span className="text-xs text-muted">{relativeTime(comment.createdAt)}</span>
      </div>
      <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap break-words">
        {comment.body}
      </p>
      {depth < DEPTH_CAP && (
        <button
          disabled
          title="Comments coming soon"
          className="mt-1.5 text-xs text-muted disabled:cursor-not-allowed"
        >
          Reply
        </button>
      )}
      {comment.replies.length > 0 && depth < DEPTH_CAP && (
        <ul className="mt-4 space-y-4">
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentThread({ comments }: { comments: CommentNode[] }) {
  return (
    <ul className="space-y-6">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} depth={0} />
      ))}
    </ul>
  );
}
