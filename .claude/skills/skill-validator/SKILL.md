---
name: skill-validator
description: Validate skill file structure
metadata:
  version: "1.0.0"
  author: TAISUN
  based-on: Anthropic Complete Guide to Building Skills for Claude (Jan 2026)
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
disable-model-invocation: true
---

# Skill Validator

Anthropic公式ガイドに基づくスキル品質検証ツール。

## Quick Validation

```bash
python scripts/validate_skill.py <skill-path>
```

## Validation Checklist

### 1. Structure Check
- [ ] `SKILL.md` exists (exact case)
- [ ] Folder name is kebab-case
- [ ] No README.md inside skill folder
- [ ] Optional: scripts/, references/, assets/

### 2. Frontmatter Check
- [ ] `---` delimiters present
- [ ] `name` field: kebab-case, no spaces, no capitals
- [ ] `description` field: non-empty, under 1024 chars
- [ ] No XML tags (< or >) in frontmatter
- [ ] No "claude" or "anthropic" in name

### 3. Description Quality
- [ ] Contains WHAT the skill does
- [ ] Contains WHEN to use (trigger conditions)
- [ ] Contains trigger phrases users would say
- [ ] Mentions relevant file types if applicable
- [ ] Under 1024 characters

### 4. Content Quality
- [ ] Under 5,000 words (or references/ used)
- [ ] Clear step-by-step instructions
- [ ] Code examples for key operations
- [ ] Error handling included
- [ ] Troubleshooting section present

### 5. Progressive Disclosure
- [ ] Core instructions in SKILL.md
- [ ] Detailed docs in references/ (if needed)
- [ ] Large content split to separate files
- [ ] Clear links to reference files

## Scoring System

| Score | Rating | Meaning |
|-------|--------|---------|
| 90-100 | Excellent | Production-ready |
| 80-89 | Good | Minor improvements needed |
| 70-79 | Fair | Several issues to fix |
| 60-69 | Poor | Major revision needed |
| <60 | Critical | Rewrite required |

## Common Issues & Fixes

### Issue: Skill doesn't trigger
**Cause**: Description too vague
**Fix**: Add specific trigger phrases

```yaml
# Before
description: Helps with projects

# After
description: |
  Manages Linear project workflows. Use when user says
  "plan sprint", "create Linear tasks", or "project planning".
```

### Issue: Over-triggering
**Cause**: Description too broad
**Fix**: Add negative triggers

```yaml
description: |
  ...existing description...
  Do NOT use for: simple data exploration (use data-viz instead).
```

### Issue: Instructions not followed
**Cause**: Content too verbose
**Fix**: Move details to references/

### Issue: Large context usage
**Cause**: All content in SKILL.md
**Fix**: Use progressive disclosure

## Usage Examples

### Validate Single Skill
```bash
/skill-validator .claude/skills/taiyo-style
```

### Validate All Skills
```bash
/skill-validator .claude/skills --all
```

### Generate Improvement Report
```bash
/skill-validator .claude/skills/mega-research --report
```

## Integration with TAISUN

This skill is part of the TAISUN quality assurance system:
- Runs automatically on `PostToolUse` for skill creation
- Blocks merging skills with score < 70
- Generates improvement suggestions

See [references/anthropic-guide-summary.md](references/anthropic-guide-summary.md) for full best practices.
