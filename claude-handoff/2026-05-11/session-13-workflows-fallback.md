# Session 13 — Workflows fallback removal

**Branch:** `fix/workflows-fallback-removal`
**PR:** [#48](https://github.com/JakeLevison/endall-web/pull/48)
**File:** `src/app/(app)/workflows/[id]/page.tsx`
**Pattern source:** PR #47 (`cf46054`), which itself mirrors PR #45

## Why

PR #47's Session 11 handoff flagged this as the last known instance of the `fallback*` anti-pattern. On Supabase error the `catch` block was replacing the real workflow with a fake "New Lead Assignment" (340 enrolled) plus five hardcoded fake nodes (`record_created` trigger, `lifecycle_stage = Lead` condition, round-robin assign, 1-day delay, Slack notification). Any hiccup during the Greg Klausa demo (May 19, Cornerstone MEP Partners tenant) and a workflow open would have surfaced invented data as if it were the customer's real workflow.

## Fix applied

Mirrored PR #47 in full:

1. Removed `fallbackWorkflow` and `fallbackNodes` consts.
2. Removed `usingFallback` state. With no fake-data path, the flag is dead code — its three conditional branches in `handleToggleStatus` / `handleAddNode` / `handleDeleteNode` were collapsed so mutations always try Supabase. The pre-existing `catch` in `handleAddNode` (local optimistic append) is preserved; it's not fake data, just offline-tolerant.
3. `catch` block clears state (`workflow=null`, `nodes=[]`) and lets the not-found state render.
4. Loading state: skeleton matching the single-column `max-w-2xl` node-flow layout — breadcrumb-bar skeleton + 5 stacked node-card skeletons with connector lines. Single column was the right call here because the workflow detail page is single-column (unlike `/deals/[id]`'s 3-column).
5. Not-found state: branded breadcrumb + dashed-border card + "Back to workflows" CTA.
6. Empty-nodes state: upgraded from plain text to branded dashed-border card. **CTA kept** ("Add node") — workflow-node creation lives on this same page via the existing Dialog, so the CTA wires straight into `setDialogOpen(true)`. Removed the now-redundant second "Add node" button that previously rendered stacked below the empty-state text.

## Scope decision: dead code cleanup

The task brief named only `fallbackWorkflow` and `fallbackNodes`. I also removed `usingFallback` and its three conditional branches. Once the fallback constants are gone, the flag can never be `true`, so leaving it would be dead code that an unwary future edit could mistake for a live demo-data path. PR #47 made the same call (didn't apply because PR #47 didn't have an equivalent flag, but the spirit is the same).

## Verification

- `npx tsc --noEmit -p tsconfig.json` — clean on `workflows/[id]/page.tsx`.
- `.husky/pre-commit` banned-phrase pattern — clean.
- Em-dash sweep on user-facing strings — clean (no `—` literals).
- Did not boot the dev server (no UI behavior change visible without a Supabase error to trigger; skeleton/not-found patterns derived directly from PR #47 which has already been demo-verified).

## Fallback anti-pattern: closeout

This completes the `fallback*` cleanup across `src/`. Remaining `fallback` matches in the codebase are benign:

- SWR `fallbackData` (legit defaults) in `invoice-review/page.tsx` and `lib/ops-api.ts`
- `lsGet(key, fallback)` helper in `hooks/useChat.ts`
- `AvatarFallback` Radix component usage
- Comments and test-file mentions

No further sweeps needed for demo prep on this anti-pattern class.

## Pre/post

- Pre-SHA: `957067a` (PR #46 merge tip; branched from `origin/main`)
- Post-SHA: `13198e4` (single commit on `fix/workflows-fallback-removal`)
- Pushed: yes — branch is on remote, PR #48 open.
- Merge: pending Jake greenlight per CLAUDE.md session protocol.
