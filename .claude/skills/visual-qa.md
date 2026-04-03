---
name: visual-qa
description: Use when verifying UI changes, checking responsive layouts, or running visual regression checks on the Endall platform. Triggers on "check the site", "verify the UI", "visual QA", "does it look right", "screenshot", or after any frontend component change.
---

# Visual QA Skill

## When to Use
- After ANY frontend file edit (.tsx, .jsx, .css, .html)
- When explicitly asked to verify UI
- Before marking any frontend task as complete

## Workflow

### Quick Check (MCP -- use during active dev)
1. Use Playwright MCP to navigate to the affected route on localhost
2. Take a screenshot at desktop (1440px), tablet (768px), and mobile (375px) widths
3. Verify: no layout breaks, no overlapping elements, text is readable, interactive elements are clickable
4. Report findings with screenshots saved to `./screenshots/qa/`

### Full Regression (CLI -- use before commits and overnight)
1. Run `npx playwright test` against the full E2E suite
2. Save results to `./test-results/`
3. If failures: report which tests failed, attach screenshots, and suggest fixes
4. Do NOT mark task complete until all visual tests pass

## Token Efficiency
- Use CLI mode (file paths, not inline trees) for any test that will be run more than once
- Use MCP mode only for exploratory/one-off visual checks
- Always save screenshots to disk rather than returning them inline
