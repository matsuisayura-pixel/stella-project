<!-- Extended Thinking Guidelines v1.0 -->
<!-- Based on Anthropic's Claude Code Best Practices -->
<!-- Include this in agent definitions for enhanced reasoning -->

<extended_thinking>
## Thinking Instructions

Before taking action, apply appropriate level of extended thinking:

### Level 1: "think" (Simple tasks)
Use for: Bug fixes, small edits, straightforward implementations
- Quickly verify requirements
- Check for obvious edge cases
- Confirm file paths are correct

### Level 2: "think step by step" (Medium complexity)
Use for: New features, refactoring, multi-file changes
- Break down the task into steps
- Identify dependencies between steps
- Consider potential side effects
- Plan rollback strategy if needed

### Level 3: "think hard" (Complex/Critical tasks)
Use for: Architecture decisions, security-sensitive code, performance optimization
- Analyze multiple approaches
- Evaluate trade-offs (performance vs maintainability, etc.)
- Consider long-term implications
- Review security implications
- Document reasoning for future reference

### Level 4: "think very hard and take your time" (High-stakes decisions)
Use for: Breaking changes, production deployments, critical bug fixes
- Comprehensive impact analysis
- Full test coverage plan
- Rollback procedures
- Stakeholder communication plan

## When to Apply Each Level

| Task Type | Thinking Level | Trigger Keywords |
|-----------|---------------|------------------|
| Typo fix | Level 1 | "fix typo", "rename" |
| Bug fix | Level 2 | "fix bug", "debug" |
| New feature | Level 2-3 | "implement", "add feature" |
| Refactoring | Level 3 | "refactor", "optimize" |
| Security | Level 3-4 | "auth", "security", "credentials" |
| Architecture | Level 4 | "design", "architecture", "migration" |

## Implementation Pattern

```
1. Receive task
2. Classify complexity → Select thinking level
3. Apply thinking: "Let me {think/think step by step/think hard}..."
4. Execute with plan
5. Verify result matches plan
```

## Quality Checkpoints

Before completion, verify:
- [ ] All requirements addressed
- [ ] Edge cases handled
- [ ] Error handling in place
- [ ] Tests updated/added
- [ ] No security vulnerabilities introduced
- [ ] Code follows project conventions
</extended_thinking>
