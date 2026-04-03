---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history -- you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

## When to Use

- Have an implementation plan with mostly independent tasks
- Want to stay in the same session
- Tasks can be executed sequentially by isolated agents

## The Process

1. Read plan, extract all tasks with full text, note context, create task list
2. Per task:
   a. Dispatch implementer subagent with full task text + context
   b. If implementer asks questions -- answer clearly, re-dispatch
   c. Implementer implements, tests, commits, self-reviews
   d. Dispatch spec reviewer -- verify code matches spec (nothing more, nothing less)
   e. If spec issues found -- implementer fixes, re-review
   f. Dispatch code quality reviewer -- verify implementation is well-built
   g. If quality issues found -- implementer fixes, re-review
   h. Mark task complete
3. After all tasks: dispatch final code reviewer for entire implementation

## Model Selection

- Mechanical implementation (1-2 files, clear spec): use sonnet
- Integration/judgment tasks (multi-file, pattern matching): use sonnet
- Architecture, design, and review tasks: use opus

## Handling Implementer Status

- **DONE:** Proceed to spec compliance review
- **DONE_WITH_CONCERNS:** Read concerns. If correctness/scope issues, address before review. If observations, note and proceed.
- **NEEDS_CONTEXT:** Provide missing context and re-dispatch
- **BLOCKED:** Assess blocker -- provide context, escalate model, break into pieces, or escalate to human

**Never** ignore an escalation or force the same model to retry without changes.

## Prompt Templates

### Implementer Dispatch

```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N: [task name]

    ## Task Description
    [FULL TEXT of task from plan]

    ## Context
    [Scene-setting: where this fits, dependencies, architectural context]

    ## Before You Begin
    If you have questions about requirements, approach, dependencies, or anything unclear -- ask them now.

    ## Your Job
    1. Implement exactly what the task specifies
    2. Write tests (following TDD)
    3. Verify implementation works
    4. Commit your work
    5. Self-review
    6. Report back with: Status, what you implemented, test results, files changed, concerns
```

### Spec Reviewer Dispatch

```
Task tool (general-purpose):
  description: "Review spec compliance for Task N"
  prompt: |
    You are reviewing whether an implementation matches its specification.

    ## What Was Requested
    [FULL TEXT of task requirements]

    ## CRITICAL: Do Not Trust the Report
    Read the actual code. Compare to requirements line by line.
    Check for: missing requirements, extra/unneeded work, misunderstandings.
    Report: Spec compliant / Issues found with file:line references
```

### Code Quality Reviewer Dispatch

```
Task tool (code-reviewer):
  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

## Red Flags

**Never:**
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Start code quality review before spec compliance passes
- Move to next task while either review has open issues
