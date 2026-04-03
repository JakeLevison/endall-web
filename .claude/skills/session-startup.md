---
name: session-startup
description: Runs at the start of every Claude Code session to establish the development environment context. Triggers automatically on session start.
---

# Session Startup -- Endall Development

## On Every Session Start

1. **Verify tools are loaded**:
   - Confirm Playwright MCP is available
   - Confirm all custom agents are loaded
   - Check test infrastructure is working

2. **Check project state**:
   - `git status` -- what branch are we on, any uncommitted changes?
   - `git log --oneline -5` -- what was the last work done?
   - Check `./qa-reports/` for the most recent QA report
   - Check `./test-results/` for the most recent test run

3. **Establish model routing**:
   - Default session model: `sonnet`
   - Escalate to `opus` only for: code review, security audit, complex debugging, architecture planning
   - Log model switches for token tracking

4. **Load context efficiently**:
   - Do NOT read the entire codebase
   - Read `CLAUDE.md` (project context)
   - Use Glob/Grep to find specific files as needed
   - Read `Endall_Master_Context.md` only if strategic decisions are involved
