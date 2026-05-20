REQUIRED READING: Before starting any task, read docs/ENDALL_OPERATING_STANDARDS.md. These standards govern all design, engineering, and product decisions. If a task prompt conflicts with these standards, these standards win unless Jake explicitly overrides.

@AGENTS.md

## Development Infrastructure

### QA Pipeline
- **Visual QA**: Playwright MCP (dev) + Playwright CLI (CI/repeatable)
- **TDD**: Superpowers-derived skills enforce Red-Green-Refactor
- **Auto-test hook**: Every production code edit (src/, app/) triggers smoke test
- **Code review**: Dedicated read-only agent on Opus model
- **Security**: Automated dependency + secrets scanning

### Agent Team Structure
- `frontend-dev` (sonnet) -- React/Next.js, Tailwind, components
- `backend-dev` (sonnet) -- FastAPI, Twilio, ElevenLabs, agent pipeline
- `qa-orchestrator` (sonnet) -- Runs full test suite, generates reports
- `code-reviewer` (opus) -- Read-only architecture and quality review
- `security-auditor` (opus) -- Vulnerability scanning and auth review
- `test-automator` (sonnet) -- Test generation and coverage
- `deployment-engineer` (sonnet) -- Vercel, CI/CD, GitHub Actions
- `observability-engineer` (sonnet) -- Logging, monitoring, performance

### Model Routing
- Default: sonnet for all implementation and testing
- Escalate to opus: code review, security, complex debugging, architecture
- Never use opus for: boilerplate, file operations, running commands

### Build Pipeline
1. Plan (brainstorm, spec, plan)
2. Implement (TDD: RED, GREEN, REFACTOR via subagents)
3. Visual QA (Playwright checks affected routes)
4. Code Review (code-reviewer agent on opus)
5. Security Check (security-auditor if auth/API/payment touched)
6. Full QA Pass (qa-orchestrator runs everything)
7. Human sign-off (Jake reviews QA report + screenshots)

### Workflow

Per-session operating flow. The Build Pipeline above describes shipping a change; this describes working a session.

1. Start: read `docs/ENDALL_OPERATING_STANDARDS.md`, run `git status`, skim recent `main` commits.
2. Classify: GSD for small/obvious, TDD for complex/risky. Announce the classification before starting.
3. Plan first for anything non-trivial. Show the plan before writing code.
4. Verify before done: tests pass, UI renders in a browser if frontend-touching, no banned phrases (pre-commit enforces).
5. Show the diff before committing. Never auto-commit.
6. Do not push without an explicit greenlight.

Copy, naming, signature, and style rules live in `docs/ENDALL_OPERATING_STANDARDS.md`. Do not duplicate them here.

### Session Protocol

At session start:
1. `git status` on both `endall-web` and `chief-of-staff`. Uncommitted work older than this session is a release-blocking audit item (see `chief-of-staff/tasks/lessons.md`, lesson 10), not background context.
2. Inventory untracked files. Cross-reference against tracked code (nav links, imports, migration-number gaps). A tracked reference to an untracked artifact is a latent production bug.
3. Confirm the branch matches the intended scope. Branch from `origin/main` for Layer work.

At session end:
1. Report final state: pre/post SHAs, test counts, any diffs that shifted since approval.
2. Do not push. Push timing is Jake's call per layer.
3. For multi-session handoffs, write to `docs/SESSION_HANDOFF.md` (owned by the session-handoff skill).

### Autonomous Fixes

Safe to ship without pausing (still show the diff):
- Typos, broken links, dead buttons, bad `href` targets.
- Banned-phrase sweeps. `.husky/pre-commit` is source of truth.
- Visual regressions flagged by Playwright.
- Test flakiness isolated to a single file with an obvious fix.

Confirmation required before acting when touching:
- `tenant_id` values, `NEXT_PUBLIC_TENANT_ID`, or multi-tenant routing.
- Supabase Auth flows: `src/proxy.ts`, `createServerClient`, login/signup pages.
- Supabase RLS policies or migration files under `migrations/`.
- ElevenLabs Publish state.
- The `.husky/pre-commit` banned-phrase list itself.

Never modify Twilio webhook URLs under any circumstance.

### Token Efficiency Rules
- Playwright CLI over MCP for repeatable tests
- Subagents for isolated tasks (prevent context pollution)
- Save outputs to disk, not inline
- Truncate command output: `| tail -15`
- YAGNI enforced by TDD -- no speculative code

## UI Copy Hard Rules -- Never Violate

BANNED from all website, dashboard, and demo UI:
- "60-day free pilot" or any variation
- "free trial" or "free pilot"
- "No credit card"
- "data migration"
- "Live in under a week"
- "HVAC" (not part of MEP positioning -- use "mechanical" instead)
- "$1.5 trillion" or buildout statistics
- "Endall AI" (always "Endall")
- "software" (always "platform" or "ops team")
- "handles/handle/handling"

Pilot offer (60 days free, $199/month after, no contract) appears ONLY in Email 3 of the outreach sequence in chief-of-staff. Never on the website.

Enforced by pre-commit hook in `.husky/pre-commit` -- build will fail if banned phrases appear in src/.
