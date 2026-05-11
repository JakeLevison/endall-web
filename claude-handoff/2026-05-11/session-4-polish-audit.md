# Session 4 — Pre-demo Visual & UX Polish Audit (2026-05-11)

**Demo:** May 19 with Greg Klausa (Aspire Technology Partners).
**Tenant:** Cornerstone MEP Partners.
**Branch:** `feature/demo-polish-audit` (off `origin/main` @ `618afe5`).

This session swept every demo-visible screen for visual issues — raw "Loading..." text, flash-of-empty-state, hardcoded test data, broken empty/error states, missing currency/date formatting. Backend logic and API contracts were left untouched.

---

## Per-screen findings

### 1. `/command-center`

**Issues found**
- Activity Feed flashed "No recent agent activity" for one render tick before logs returned (SWR `fallbackData: []` made initial empty state indistinguishable from real empty).
- Workflow History flashed "No workflow files yet" before `/api/chat/files` resolved (fetched in `useEffect`; no isLoading tracking).
- Empty-feed copy was a single muted line with no hint of when content arrives.

**Issues fixed**
- Added `isLoading` plumbing to `ActivityFeedSection` (from SWR) and `WorkflowHistorySection` (new `filesLoading` state).
- Each section now renders animated skeleton rows on first paint, then transitions to populated or empty state.
- Empty-feed copy extended to explain when the feed populates ("as agents process calls, emails, and estimates").
- Updated the corresponding command-center test to await the empty state instead of asserting it synchronously.

**Deferred**
- None.

### 2. `/contacts` and `/contacts/[id]`

**Issues found**
- `/contacts` list: raw "Loading..." text; bare empty state with no CTA.
- `/contacts/[id]`: raw "Loading..." text *and* the same branch rendered when the contact actually wasn't found, so a missing contact looked like a permanent loading screen.
- Empty email / phone / company / owner fields rendered as blank strings.

**Issues fixed**
- List page: replaced "Loading..." with skeleton (header + filter bar + 8 table-row pulses). Empty state grew a dashed border, primary + secondary copy, and an "Add contact" CTA. Filter-matched empty (search returned 0) gets distinct "No matches" copy.
- Detail page: split loading vs not-found. Loading shows skeleton mimicking the 3-column layout. Not-found shows a branded card with breadcrumb + "Back to contacts" button.
- Blank profile fields render as "—" instead of empty space; missing owner renders "Unassigned".

**Deferred**
- `lastActivity` displays raw ISO date prefix (`2026-05-09`). Not a polish blocker — flagged for future humanization (e.g. "2 days ago" using the relTime helper already in command-center).

### 3. `/companies` and `/companies/[id]`

**Issues found**
- **Critical:** `/companies/[id]` had a `fallbackCompanies` object with eight hardcoded fake companies ("Acme Corp", "TechLabs", "BrightPath", "NovaSoft", "GreenLeaf", etc.), plus fake `fallbackActivities` ("Partnership proposal sent", "Quarterly review call") and `fallbackContacts` ("Sarah Chen / sarah@acmecorp.com"). On any Supabase failure during the demo, the screen would have shown "Acme Corp" branded data inside the Cornerstone tenant.
- `/companies` list: raw "Loading..."; "contacts" and "deals" columns hardcoded to `0` in the mapper (data layer hasn't wired the aggregates yet), so every row showed `0 / 0`.
- Bare empty state, no CTA.

**Issues fixed**
- Removed all `fallback*` constants from `/companies/[id]`. Catch branch now sets `company: null` and renders a real "Company not found" card.
- Detail loading state is a 3-column skeleton matching layout. Not-found gets a branded card with "Back to companies".
- List page: skeleton loading; empty/no-match states with CTA. Hardcoded-zero counts now display "—" so the table doesn't read as "every company has zero contacts and zero deals".

**Deferred**
- The contacts/deals counts on `/companies` (and the deals-by-company aggregates everywhere) need real queries — currently always `0`. Flagged for backend follow-up; outside polish scope.
- Unused `Globe` import in `/companies/[id]` left in place; removing it is unrelated cleanup.

### 4. `/sequences` and `/sequences/[id]`

**Issues found**
- **Critical:** `/sequences/[id]` had a `fallbackSequence` ("Cold Outreach - SaaS", 142 enrolled, 18.3% reply rate) and 5 `fallbackSteps` with fake email bodies ("Hi {{first_name}}, I noticed your team is scaling fast..."). On any Supabase failure during the demo, an unrelated marketing sequence would have shown up.
- List page: raw "Loading...", bare empty state, em-dash inside a template description (`{description} — N steps`), and table cells rendered "0" / "0%" for newly created sequences (mapper hardcodes `enrolled` and `reply_rate` to 0).
- Same dead-end "Loading..." pattern on detail page.

**Issues fixed**
- Removed `fallbackSequence` and `fallbackSteps`. Catch branch sets `sequence: null` and the detail page renders a real "Sequence not found" card.
- Detail loading is a skeleton (breadcrumb + 4 step cards). Em-dash in template description replaced with `·`.
- List page: skeleton loading, branded empty state with CTA, zero-valued cells fall back to "—".

**Deferred**
- The dead `usingFallback` state flag and its `if (!usingFallback)` branches in mutation handlers are now unreachable (always `false`). Removing them is a small refactor and was left alone to keep this PR scoped to polish.

### 5. `/estimates` and `/estimates/[id]`

**Issues found**
- `/estimates` has **no index `page.tsx`** — only `[id]/page.tsx`. Visiting `/estimates` directly 404s. The nav bar doesn't link to it (only `/invoice-review`), so users won't reach the bare URL via the UI, but the storyboard explicitly lists it. **Flagged for Jake.**
- `/estimates/[id]`: loading copy already reads "Loading estimate…" with proper ellipsis. Already had explicit loading / ready / not-found / error states. No fixes needed.
- `InvoiceModal` (QB push) was verified by Session B (PR #40, commit `876e99d`). Banner + retry button + toasts present. Not re-touched.

**Issues fixed**
- None on `/estimates/[id]` — it was already in good shape (proper state machine, distinct loading / ready / not-found / error branches, formatted USD, breadcrumb-less but acceptable).

**Deferred**
- Build a `/estimates` index page listing all estimates, or remove the route from the demo storyboard. **Recommend Jake decides** before the demo so we don't direct attendees to a 404.

### 6. `/dispatch` and job detail

**Issues found**
- Raw "Loading plan..." text inside the dispatch loading branch. Has `data-testid="dispatch-loading"` which one test relies on (testid presence, not content).

**Issues fixed**
- Replaced with a 3-row skeleton inside the same `data-testid="dispatch-loading"` wrapper, with `aria-busy="true"` and `aria-label="Loading plan"`. The existing dispatch tests (25 of them) all still pass.

**Deferred**
- No separate "job detail view" exists in this codebase — dispatch shows job summaries inline via `DayPlanView` → `TechSection`. Storyboard wording mismatch, not a missing page. Flagged here for clarity.

### 7. `/tasks`

**Issues found**
- Two raw "Loading..." instances (main page + Projects tab).
- Three bare empty states ("No tasks yet. Create your first task.") across board / table / projects.

**Issues fixed**
- Main loading: Kanban-shaped skeleton (4 columns × 3 cards).
- Projects loading: 3-card grid skeleton.
- Empty states gained dashed borders, primary copy, and explainer text. Projects empty state was already good (had an icon + helpful copy).

**Deferred**
- None.

### 8. `/reports`

**Issues found**
- Raw "Loading...".

**Issues fixed**
- Replaced with full-page skeleton: title placeholder, 4 metric cards, 2 chart placeholders.

**Deferred**
- None.

### 9. `/settings/integrations`

**Issues found**
- Status line on QB section shows "Checking connection..." raw text rather than an animated indicator. Copy is acceptable demo-quality.
- Page uses `text-white`, `bg-white/5`, `border-white/10` directly rather than theme tokens — inconsistent with the rest of the app (which uses CSS variables). Demo-visible but not broken in either mode.

**Issues fixed**
- None. The page already has proper connected / not-connected / error / loading states, banners with `role="status"`/`role="alert"`, and dedicated test IDs. Touching color tokens here would expand scope without a clear visual win for the demo.

**Deferred**
- Theme-token migration for the QB section is a code-health task, not polish. Flagged for post-demo cleanup.

### 10. `/onboarding` wizard (8 steps)

**Issues found**
- None of substance. Session B verified the wiring (PR #42). The wizard has:
  - Progress bar + step labels in `StepShell`.
  - Inline error banner (`role="alert"` semantics implicit).
  - Step error boundaries (`StepErrorBoundary`) per step.
  - Persisted state in localStorage; URL `?step=` survives refresh.
  - Form placeholders ("Jane Doe", "jane@acme.com") are standard form-affordance copy, not lorem-ipsum bleed.

**Issues fixed**
- None. Onboarding is the most polished surface in the app — no demo-blocking visuals.

**Deferred**
- None.

### Bonus — `(app)` layout Suspense fallback

**Issue found**
- The top-level `<React.Suspense fallback={...}>` in `src/app/(app)/layout.tsx` rendered the raw string "Loading..." while any client component below it suspended. This is the *first* thing a user sees on any navigation between in-app routes.

**Fix**
- Replaced with a skeleton (title bar + 4 stacked rows). Affects every route under the `(app)` group on initial transition.

---

## Flagged for Jake's review (deeper than visual polish)

These were observed in passing. None were touched — they all involve data layer or routing decisions outside polish scope.

1. **`/estimates` has no index page.** The route is in the demo storyboard but only `[id]/page.tsx` exists. Direct navigation 404s. Decide: build an index, or scrub `/estimates` from the storyboard.
2. **Companies aggregates are hardcoded to zero.** `c.contacts` and `c.deals` in `/companies` (and the deals-by-company aggregates in `/reports`) are always `0` in the mapper. Real queries needed before the demo if a contractor asks "how many contacts per account."
3. **Sequences enrolled / reply_rate are hardcoded to zero.** Same shape — list page mapper hardcodes `enrolled: 0, reply_rate: 0`. Detail page reads `seqData.enrolled` and `seqData.reply_rate` from the DB but seeded data may not include those fields. Verify the chief-of-staff seed populates them, or these cells show "0" / "0%" on every row.
4. **`/contacts/[id]` lastActivity formatting.** Renders raw ISO date prefix. Not breaking, but a contractor scanning a contact card will see "2026-05-09" instead of "2 days ago." `relTime()` exists in `command-center/page.tsx` — could be lifted.
5. **`/settings/integrations` uses hardcoded white-on-black classes.** Works in dark mode but won't theme-toggle correctly in light mode. Probably fine for demo (dark mode is the demo path), but flag for post-demo.
6. **Header avatar hardcoded to "JK".** In `src/app/(app)/layout.tsx` the user avatar fallback is the literal string "JK". A contractor logged in as themselves will still see "JK". Probably fine for an internal demo where Jake is logged in, but worth knowing.

## Recommended manual eyeball passes before the demo

In storyboard order, 5-minute pass with seeded data loaded:

1. **`/command-center`** — confirm activity feed populates with real Cornerstone agent logs and pipeline summary cards show real numbers (not "––").
2. **`/contacts`** — confirm rows render with the seeded contacts, stage badges color correctly, search works against the seed.
3. **`/contacts/[id]` for one seeded contact** — confirm email/phone/company are populated (not "—"), activity timeline renders.
4. **`/companies` and one detail** — same check. If contacts/deals counts read "—" everywhere, that's expected per finding #2 above.
5. **`/sequences`** — confirm the seed creates sequences with non-zero `steps`, `enrolled`, `reply_rate`. If any are zero, finding #3 applies.
6. **`/sequences/[id]`** — open one and confirm the step timeline renders.
7. **`/estimates/[id]` for one seeded estimate** — confirm line items, USD formatting, grand total.
8. **`/dispatch`** — confirm a day plan exists for today (or tomorrow if local time ≥ 4pm). Click "Approve" path. Click "Override" path.
9. **`/tasks`** — drag a task between columns. Open the create dialog. Switch to List and Projects tabs.
10. **`/reports`** — confirm bar charts render (not empty), timeseries chart renders (needs ≥ 2 monthly buckets in seed).
11. **`/settings/integrations`** — confirm QB connection state matches reality. The error banner only shows if `?error=...` is in the URL (only happens on a real failed callback).
12. **Onboarding** — run through one step manually if a fresh token is available. Don't bother with all 8 if time is tight; the wiring is verified.

Run the manual pass in dark mode (the demo default) on a laptop screen. Light mode survives the polish changes (skeletons use CSS variables) but wasn't actively eyeball-tested in this session.

---

## Test & type-check results

- `npx tsc --noEmit`: 2 pre-existing errors in `invoice-review` test files (also fail on `origin/main`). My changes introduced zero new type errors.
- `npx vitest run`: 2 flaky failures in `CustomerApprovalView` tests that also fail on `origin/main` when run as part of the full suite, but pass when run alone. Pre-existing race / test-isolation issue, not introduced here.
- Updated test: `src/app/(app)/command-center/__tests__/page.test.tsx::renders workflow history empty state without breaking layout` — switched from `getByText` to `await findByText` to accommodate the new async `filesLoading` state. All other command-center assertions still pass synchronously.

---

## Files changed

```
src/app/(app)/command-center/__tests__/page.test.tsx
src/app/(app)/command-center/page.tsx
src/app/(app)/companies/[id]/page.tsx
src/app/(app)/companies/page.tsx
src/app/(app)/contacts/[id]/page.tsx
src/app/(app)/contacts/page.tsx
src/app/(app)/dispatch/page.tsx
src/app/(app)/layout.tsx
src/app/(app)/reports/page.tsx
src/app/(app)/sequences/[id]/page.tsx
src/app/(app)/sequences/page.tsx
src/app/(app)/tasks/page.tsx
```

12 files, +365/-106. No backend changes, no API changes, no routing changes, no migration changes.
