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

### Workflow
1. Plan (brainstorm, spec, plan)
2. Implement (TDD: RED, GREEN, REFACTOR via subagents)
3. Visual QA (Playwright checks affected routes)
4. Code Review (code-reviewer agent on opus)
5. Security Check (security-auditor if auth/API/payment touched)
6. Full QA Pass (qa-orchestrator runs everything)
7. Human sign-off (Jake reviews QA report + screenshots)

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
