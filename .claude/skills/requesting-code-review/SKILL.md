---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch code-reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation -- never your session's history.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code-reviewer agent with:**
- `WHAT_WAS_IMPLEMENTED` -- What you just built
- `PLAN_OR_REQUIREMENTS` -- What it should do
- `BASE_SHA` -- Starting commit
- `HEAD_SHA` -- Ending commit
- `DESCRIPTION` -- Brief summary

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Review Checklist

**Code Quality:** Clean separation, error handling, type safety, DRY, edge cases
**Architecture:** Sound design, scalability, performance, security
**Testing:** Real behavior tests (not mocks), edge cases, integration tests, all passing
**Requirements:** All met, no scope creep, breaking changes documented
**Production Readiness:** Migration strategy, backward compat, documentation

## Output Format

- **Strengths** -- specific positive observations
- **Issues** -- Critical (must fix) / Important (should fix) / Minor (nice to have)
- **Assessment** -- Ready to merge? Yes / No / With fixes
