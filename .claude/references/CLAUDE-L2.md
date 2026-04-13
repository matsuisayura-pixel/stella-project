# TAISUN v2 - L2: Detailed Reference

## 13-Layer Defense System

| Layer | Guard | Function |
|-------|-------|----------|
| 0 | CLAUDE.md | Absolute compliance rules |
| 1 | SessionStart Injector | Auto-inject state |
| 2 | Permission Gate | Block out-of-phase operations |
| 3 | Read-before-Write | Block editing unread files |
| 4 | Baseline Lock | Block critical script modification |
| 5 | Skill Evidence | Block post-process without skill evidence |
| 6 | Deviation Approval | Require pre-approval for deviations |
| 7 | Agent Enforcement | Force agent use for complex tasks |
| 8 | Copy Safety | Block U+FFFD/U+3000/copy markers |
| 9 | Input Sanitizer | Detect command injection/secret leaks |
| 10 | Skill Auto-Select | Auto-force required skills by task type |
| 11 | Definition Lint | Validate workflow/policy definitions |
| 12 | Context Quality | tmux recommendation + console.log warning |

Violations are blocked with exit code 2.

## Skill Auto-Mapping

| Trigger | Required Skill | Strict |
|---------|---------------|--------|
| YOUTUBE + tutorial + video | video-course | No |
| Sales letter | taiyo-style-sales-letter | No |
| Step mail | taiyo-style-step-mail | No |
| VSL script | taiyo-style-vsl | No |
| Instagram + Shorts | shorts-create | Yes |
| Interactive/branching video | interactive-video-platform | Yes |
| TTS/voice/narration | interactive-video-platform | Yes |
| Image QA/visual check | agentic-vision | No |
| Phone/call/Voice AI | voice-ai | No |
| SDR/sales pipeline | ai-sdr | No |
| Lead scoring | lead-scoring | No |
| Outreach/messaging | outreach-composer | No |
| URL analysis/site analysis | url-deep-analysis | No |

## Guidelines

### Context Management
| Item | Recommended |
|------|------------|
| Active MCP | 10 or fewer |
| Active tools | 80 or fewer |

Details: `.claude/rules/context-management.md`

### Development Principles
1. **TDD First** - Test-driven development
2. **Clean Architecture** - Layer separation
3. **SOLID Principles** - Design principles
4. **Security by Design** - Built-in security

### Quality Gates
- Code review: 80+ score
- Test coverage: 80%+
- Security: Zero Critical/High vulnerabilities

## Quick Reference

```bash
/agent-run          # Run agent
/taiyou-status      # Check status
/mcp-health         # MCP diagnostics
/agent-catalog      # 82 agents detail
/skill-catalog      # 66 skills detail
/quick-reference    # Advanced features guide
```
