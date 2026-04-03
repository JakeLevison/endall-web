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
