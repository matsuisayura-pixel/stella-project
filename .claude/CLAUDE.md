# TAISUN v2 - Ultimate Unified System

## WORKFLOW FIDELITY CONTRACT

### 1. Faithful Execution
When user says "same workflow" or "use XX skill", it is a **contract**.
- No shortcuts, simplifications, or substitutions
- Deviations require **explicit pre-approval**

### 2. Respect Existing Artifacts
- **Never create new scripts without Reading existing ones first**
- **Always Read before modifying any file**
- **Baseline-registered files are immutable**

### 3. No Unauthorized Actions
- Deviations MUST be confirmed: "This action is not in the instructions. May I proceed?"
- **Never deviate without explicit user approval**

### 4. Session Continuity
- Check `.workflow_state.json` (auto-injected)
- Read `SESSION_HANDOFF.md` if present
- Never contradict current phase

### 5. Skill Compliance
When "use XX skill" is specified: **MUST use Skill tool**. Manual implementation is PROHIBITED.

## System Overview

| Component | Count | Reference |
|-----------|-------|-----------|
| Agents | 96 | `/agent-catalog` |
| Skills | 110+ | `/skill-catalog` |
| Commands | 110 | Shortcut commands |
| MCP Servers | 15+ | Core servers |

## Pre-Flight Checks

Before starting work:
- [ ] Skill instruction? -> Use Skill tool
- [ ] "Same workflow"? -> Read existing files first
- [ ] SESSION_HANDOFF.md exists? -> Read it
- [ ] Summary ratio specified? -> Follow exactly

**VIOLATION = CRITICAL ERROR** -> Stop -> Apologize -> Record in `.claude/hooks/mistakes.md` -> Re-execute correctly

## Language
- Japanese priority
- Technical terms in English OK
- Use marketing terminology appropriately

## Sub-Agent Context Protection (MANDATORY)

### Result Size Control (MUST)
- **ALL** Task prompts MUST include `結果は500文字以内で要約して返してください`
- **ALL** research/analysis agents MUST use `run_in_background: true`
- Read background agent output files selectively (use `offset`/`limit`)

### Delegation Pattern (MUST)
- 3+ parallel agents: `run_in_background: true` **REQUIRED** (violation = context exhaustion)
- After background agent completes: Read output file, extract key findings only
- Task result >2000chars → run `mcp__praetorian__praetorian_compact` if available, otherwise use `/compact`

### Strategic /compact Timing
- **Before** launching 3+ parallel agents
- **Immediately after** receiving large agent results (hook: task-overflow-guard)
- Hook auto-suggests at dynamic intervals (compact-optimizer)

## Self-Improvement Loop

- **Cross-session lessons**: See `AGENTS.md` (project root) — auto-loaded every session
- **Record new lessons**: Run `/learn` after resolving non-obvious problems

## Hook Safety (Advisory-only)

Project-level hooks **never block** (shared system):
- `deviation-approval-guard` / `agent-enforcement-guard` / `definition-lint-gate` → exit 0, warning only
- Only `unified-guard` blocks: `rm -rf /`, `mkfs`, `dd if=/dev`, fork bombs

## MCP Caution

- Each MCP server consumes 1,000–26,000 tokens on load
- Keep active MCP ≤ 10 (GitHub MCP alone = 26k tokens)
- Disable unnecessary servers in `.claude/settings.json` → `disabledMcpServers`

## Detailed References

For detailed rules, mappings, and expert workflows:
- **L2** (defense layers, skill mapping, guidelines): `.claude/references/CLAUDE-L2.md`
- **L3** (specialized workflows, audio preprocessing): `.claude/references/CLAUDE-L3.md`
