#!/bin/bash
# Workflow Guardian - Bash Command Guard (Phase 3)
#
# Claude Code Hook System Integration (PreToolUse)
# Reads JSON from stdin, blocks dangerous commands in strict mode.
# Exit code 0: allow, Exit code 2: block (with stderr message)

# Read JSON from stdin
INPUT=$(cat /dev/stdin 2>/dev/null || echo "{}")

# Extract command from JSON
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [ -z "$COMMAND" ]; then
  # No command found, allow
  exit 0
fi

# Check if workflow state exists
STATE_FILE=".workflow_state.json"

if [ ! -f "$STATE_FILE" ]; then
  # No active workflow, allow
  exit 0
fi

# Check if strict mode is enabled
STRICT=$(cat "$STATE_FILE" | jq -r '.strict // false' 2>/dev/null)

if [ "$STRICT" != "true" ]; then
  # Not in strict mode, allow
  exit 0
fi

# Dangerous patterns to block in strict mode
DANGEROUS_PATTERNS=(
  "rm -rf"
  "rm -fr"
  "git push --force"
  "git push -f"
  "git reset --hard"
  "DROP TABLE"
  "TRUNCATE"
  "DELETE FROM.*WHERE"
  "chmod 777"
  "sudo"
  "kill -9"
  "\\.env"
  "secrets/"
)

# Check for dangerous patterns
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qiE "$pattern"; then
    # Output to stderr (shown to user)
    echo "Workflow Guardian (strict mode): Dangerous command blocked" >&2
    echo "  Pattern: $pattern" >&2
    echo "  Command: ${COMMAND:0:100}..." >&2
    echo "" >&2
    echo "This command is not allowed in strict mode." >&2
    echo "Please run it manually for safety." >&2
    exit 2  # Exit code 2 = block
  fi
done

# Allow command
exit 0
