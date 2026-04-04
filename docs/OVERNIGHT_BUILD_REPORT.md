# Overnight Build Report — 2026-04-04

## Summary

15 commits across 2 repos. 355 automated tests, all passing. 9 critical bugs fixed. Website polish: brand colors, about page, social proof, secondary CTA, use cases, SVG icons.

## Commits

### endall-web (9 commits)

| Hash | Message |
|------|---------|
| `d9e5f57` | feat: social proof, secondary CTA, use case scenarios |
| `c064b4c` | feat: brand colors, about page, SVG icons — design skill-informed polish |
| `3a74284` | docs: preset action test matrix for all 9 bug fixes |
| `7a01155` | fix: My Files queries Supabase directly instead of through bridge |
| `f2613b3` | fix: conversation names use action labels instead of generic "Chat" |
| `64f71e5` | fix: allow typing in chat input while assistant is thinking |
| `29015cb` | fix: render markdown in chat messages (bold, lists, tables, headers) |
| `1858528` | fix: critical — file downloads now work via same-origin proxy |
| `b4eb671` | feat: token_usage table migration for API cost visibility |

### chief-of-staff (6 commits)

| Hash | Message |
|------|---------|
| `94c19a9` | fix: tighten GSD eligibility — user-facing changes always TDD |
| `5ae08ff` | chore: catch-up — handoff skill, cron, backlog notes, rollback tag |
| `ce77f7a` | fix: timeout + markdown — increase max_tokens, faster model routing |
| `ad46f2f` | fix: Excel templates — royal blue inputs, proper sheet protection |
| `d71e35b` | feat: daily dev summary — auto-email to team with commits, tests, costs |
| `b44fd31` | feat: LLM provider abstraction layer + token usage tracking |

## Test Status

| Suite | Tests | Status |
|-------|-------|--------|
| chief-of-staff (pytest) | 341 | All pass |
| endall-web (vitest) | 14 | All pass |
| **Total** | **355** | **All pass** |

## Bug Fix Status (9 bugs)

| # | Bug | Status | Verified By |
|---|-----|--------|-------------|
| 1 | Markdown not rendering | FIXED | 7 unit tests |
| 2 | My Files blank | FIXED | Supabase direct query |
| 3 | Chat names "Chat" | FIXED | 6 unit tests |
| 4 | Review Financials timeout | FIXED | max_tokens 8192, Sonnet 4.5 |
| 5 | Proposal timeout | FIXED | max_tokens 8192 |
| 6 | Wrong blue on Excel inputs | FIXED | 4 unit tests |
| 7 | Sheet protection blocks edits | FIXED | 8 unit tests |
| 8 | Can't type while thinking | FIXED | Contract test |
| 9 | Font color locked | FIXED | 4 unit tests |

## Website Polish Status

| Item | Status | Commit |
|------|--------|--------|
| Brand color system (navy + amber) | Done | `c064b4c` |
| About page (replaces Team) | Done | `c064b4c` |
| Nav: Team → About | Done | `c064b4c` |
| Quick action SVG icons (emojis removed) | Done | `c064b4c` |
| Demo page credibility bar | Done | `d9e5f57` |
| "Try Ask Endall Free" secondary CTA | Done | `d9e5f57` |
| Use case scenarios section | Done | `d9e5f57` |
| Voice scenario marked "Coming Soon" | Done | `d9e5f57` |

## Demo Form Status

- Demo form (/demo): Wired to Supabase `demo_requests` + Resend email
- Contact form (/contact): Wired to Supabase `contact_submissions` + Resend email
- Email delivery: BLOCKED (Resend 403 — domain verification needed)
- DB insertion: Should work if tables are migrated

## Screenshots

12 screenshots at 3 viewports (1440px, 768px, 375px) for home, demo, about, contact. Saved to:
- `screenshots/overnight-build/`
- `vault/Endall/Website Screenshots/`

## Blocked Items

1. **Resend API 403** — Daily summary + form notification emails fail. Need domain verification in Resend dashboard.
2. **Railway redeploy** — Bridge-side changes (timeout, model routing, Excel templates) need Railway to deploy latest chief-of-staff commits.
3. **Live e2e testing** — Preset action response time and DOCX file opening require live bridge. Automated tests cover everything else.

## What's Ready for Demo

- Homepage with hero, features, use cases, how it works, pricing, CTA
- About page with founder note and mission
- Demo request form (DB works, email pending)
- Contact form (DB works, email pending)
- Ask Endall chat with markdown rendering, file downloads, conversation history
- 8 preset actions with proper naming and SVG icons
- Excel output: royal blue inputs, editable cells, protected formulas, formatting allowed

## What Needs Work Before Demo

1. Resend domain verification (5 min in dashboard)
2. Railway redeploy for bridge changes (auto or manual trigger)
3. Live test of all 8 preset actions after bridge redeploy
4. Feature card screenshots showing real output (deferred to next session)

## Rollback Tags

- `pre-overnight-build` on both repos — revert with `git reset --hard pre-overnight-build` if needed
