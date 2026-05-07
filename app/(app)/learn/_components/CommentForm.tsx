// TODO: connect to POST /api/comments once endpoint exists

export function CommentForm() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-fg mb-3">Leave a comment</h3>
      <form>
        <fieldset disabled className="space-y-3">
          <textarea
            className="w-full rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm text-fg placeholder:text-muted resize-none disabled:cursor-not-allowed disabled:opacity-60"
            rows={4}
            placeholder="Comments coming soon…"
            aria-label="Comment body"
          />
          <button
            type="submit"
            title="Comments coming soon"
            className="inline-flex items-center justify-center min-h-[40px] px-5 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post comment
          </button>
        </fieldset>
      </form>
    </div>
  );
}
