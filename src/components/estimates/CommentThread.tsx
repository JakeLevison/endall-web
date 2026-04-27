"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CommentRow = {
  id: string;
  author_type: "contractor" | "customer" | string;
  author_identifier: string | null;
  body: string;
  resolved_at: string | null;
  created_at: string;
};

type Props = {
  /** The comments endpoint to GET (and POST when mode=readwrite). */
  endpoint: string;
  /** "read" hides the composer, "readwrite" shows it. */
  mode: "read" | "readwrite";
  /** Polling interval in ms. 0 disables polling. Default 30000. */
  pollMs?: number;
  /** Optional label shown above the thread. */
  title?: string;
};

const POLL_DEFAULT_MS = 30_000;

function formatStamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Reusable comment thread for both contractor and customer surfaces.
 *
 * Tenant scoping is enforced server-side: contractor mode goes through
 * /api/estimates/{id}/comments which derives tenant from the Supabase
 * session, customer mode goes through /api/public/approval/{token}/comments
 * which derives tenant from the token row. The component never sees or
 * sends a tenant_id header, so a malicious customer page cannot escalate.
 */
export function CommentThread({
  endpoint,
  mode,
  pollMs = POLL_DEFAULT_MS,
  title = "Comments",
}: Props) {
  const [rows, setRows] = useState<CommentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!aliveRef.current) return;
      if (!res.ok) {
        setError(`comments unavailable (${res.status})`);
        return;
      }
      const body = (await res.json()) as { comments?: CommentRow[] };
      setRows(body.comments || []);
      setError(null);
    } catch (err) {
      if (!aliveRef.current) return;
      setError((err as Error).message || "comments unavailable");
    }
  }, [endpoint]);

  useEffect(() => {
    aliveRef.current = true;
    load();
    if (pollMs > 0) {
      const id = setInterval(load, pollMs);
      return () => {
        aliveRef.current = false;
        clearInterval(id);
      };
    }
    return () => {
      aliveRef.current = false;
    };
  }, [load, pollMs]);

  const handlePost = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        setError(`could not post comment (${res.status})`);
      } else {
        setDraft("");
        await load();
      }
    } catch (err) {
      setError((err as Error).message || "could not post comment");
    } finally {
      setPosting(false);
    }
  }, [draft, endpoint, load, posting]);

  return (
    <section
      data-testid="comment-thread"
      className="rounded-lg border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5"
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        {error ? (
          <span
            role="status"
            data-testid="comment-thread-error"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </span>
        ) : null}
      </header>

      <ol
        className="mt-3 flex flex-col gap-3"
        data-testid="comment-thread-list"
      >
        {rows === null && !error ? (
          <li className="text-xs text-neutral-500">Loading…</li>
        ) : null}
        {rows && rows.length === 0 ? (
          <li className="text-xs text-neutral-500">No comments yet.</li>
        ) : null}
        {rows?.map((row) => (
          <li
            key={row.id}
            data-testid="comment-row"
            className="rounded-md border border-black/5 bg-neutral-50 p-3 dark:border-white/5 dark:bg-white/5"
          >
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span data-testid="comment-author" className="font-medium">
                {row.author_type === "contractor"
                  ? row.author_identifier || "Contractor"
                  : row.author_identifier || "Customer"}
              </span>
              <span>{formatStamp(row.created_at)}</span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
              {row.body}
            </p>
          </li>
        ))}
      </ol>

      {mode === "readwrite" ? (
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="comment-thread-draft" className="sr-only">
            Add a comment
          </label>
          <textarea
            id="comment-thread-draft"
            data-testid="comment-thread-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            className="w-full rounded-md border border-black/10 bg-white p-2 text-sm dark:border-white/10 dark:bg-black/30"
          />
          <div className="flex justify-end">
            <button
              type="button"
              data-testid="comment-thread-post"
              onClick={handlePost}
              disabled={posting || !draft.trim()}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              {posting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
