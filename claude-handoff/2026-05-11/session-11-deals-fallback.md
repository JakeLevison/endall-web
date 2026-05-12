# Session 11 — Deals fallback removal

**Branch:** `fix/deals-fallback-activities-removal`
**File:** `src/app/(app)/deals/[id]/page.tsx`
**Pattern source:** PR #45 (`07f4245`), Session 4 polish audit

## Why

Session 10's final summary flagged residual hardcoded fallback data on `/deals/[id]` as a demo-day risk. If Supabase has any hiccup during the Greg Klausa demo (May 19, Cornerstone MEP Partners tenant) and a deal is opened, the catch block was substituting fake deals (Acme Corp, TechLabs, Sarah Chen, "Enterprise Platform License") and fake activities — the same class of bug PR #45 fixed for `/companies/[id]` and `/sequences/[id]`.

## Fix applied

Mirrored the PR #45 companies/[id] pattern in full:

1. Removed `fallbackDeals` const (8 fake deals with fake company + contact names).
2. Removed `fallbackActivities` const (4 fake emails/calls/meetings/notes).
3. `catch` block now sets `deal=null`, `activities=[]` and lets the not-found state render.
4. Loading state: 3-column skeleton loader matching the real layout (replaces raw "Loading...").
5. Not-found state: branded breadcrumb + dashed-border card with "Back to deals" CTA.
6. Activities empty state: upgraded from plain text to branded dashed-border card with helpful copy ("Emails, calls, meetings, and notes for this deal will appear here").

No CTA on the activity empty state — there is no activity-creation UI in the app (verified by grep — activities are read-only in the dashboard). Adding a dead button would violate the operating standard.

## Scope decision: removed `fallbackDeals` too

The task brief named only `fallbackActivities`, but `fallbackDeals` lives in the same file and the same `catch` block. The cleanest mirror of PR #45 is to remove both — that PR removed `fallbackCompanies` + `fallbackActivities` + `fallbackContacts` + `fallbackDeals` together from `/companies/[id]`. Leaving `fallbackDeals` would still leak fake deal names and "Acme Corp" on Supabase error, so a half-fix here would not close the demo-risk window.

## Verification

- `npx tsc --noEmit -p tsconfig.json` — no new errors in `deals/[id]/page.tsx`. Two pre-existing errors in unrelated test files (invoice-review tests, untouched here).
- Banned-phrase grep against the file — clean.
- Did not boot the dev server (no UI behavior change visible without a Supabase error to trigger; the skeleton/not-found states are derived directly from the merged PR #45 patterns that have already been demo-verified).

## STEP 4 — Other `fallback*` findings flagged for Jake's review

Grep across `src/` (excluding `AvatarFallback`, SWR `fallbackData`, and storage fallback constants) surfaced one additional file with the same demo-risk class:

### `src/app/(app)/workflows/[id]/page.tsx` — same pattern, NOT fixed

```ts
const fallbackWorkflow: Workflow = { ... };
const fallbackNodes: WorkflowNode[] = [ ... ];

} catch {
  setWorkflow(fallbackWorkflow);
  setNodes(fallbackNodes);
  setUsingFallback(true);
}
```

This is the same demo-risk shape as `/deals/[id]` and `/companies/[id]`. There is a `usingFallback` flag, so it may already render a "demo data" banner — worth checking whether the banner makes it safe or whether the underlying data still leaks fake workflow names into the demo. **Recommend a follow-up PR to either (a) keep the banner but verify content is truly generic, or (b) remove the fallback entirely matching PR #45.**

All other `fallback` matches were benign:
- SWR `fallbackData` (legit defaults, not test data) in `invoice-review/page.tsx` and `lib/ops-api.ts`.
- `lsGet(key, fallback)` helper in `hooks/useChat.ts`.
- `AvatarFallback` Radix component usage.
- Comments and test-file mentions.

## Pre/post

- Pre-SHA: `618afe5` (`origin/main` at session start)
- Post: pending commit on `fix/deals-fallback-activities-removal`
- Push: not pushed by this session — awaiting Jake greenlight per CLAUDE.md session protocol.
