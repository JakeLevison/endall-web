---
name: token-management
description: Governs model selection and token efficiency across all Endall development work. Always active -- consulted by all agents when making model routing decisions.
---

# Token Management -- Endall Development

## Model Selection Rules

### Use Sonnet (default for all agents unless specified)
- Writing tests (RED phase)
- Standard implementation (GREEN phase)
- Running test suites and reporting results
- File operations, boilerplate generation
- Frontend component work
- Standard API endpoint implementation
- Documentation generation

### Use Opus (explicitly route these tasks)
- Code review and architecture review
- Security auditing
- Complex debugging (3+ failed fix attempts)
- Planning and brainstorming phases
- Any task requiring reasoning about design tradeoffs
- Multi-file refactoring that changes system architecture

### Token Efficiency Practices
1. **Playwright CLI over MCP** for repeatable tests (file paths vs inline trees)
2. **Subagents over main context** for exploratory work (isolate context consumption)
3. **Targeted file reads** -- use Glob/Grep to find relevant files before reading them
4. **Truncated test output** -- pipe through `tail -15` or `head -15`
5. **Save to disk** -- screenshots, test results, reports go to files, not inline
6. **Fresh context per task** -- when context is getting long, spawn a subagent for the next task rather than continuing in a polluted context
7. **Kill speculation** -- TDD prevents writing code that isn't needed (YAGNI), which is the #1 source of wasted tokens
