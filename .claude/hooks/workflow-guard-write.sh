#!/bin/bash
# Workflow Guardian - File Write Guard (Phase 3)
#
# Claude Code Hook System Integration (PreToolUse)
# Reads JSON from stdin, blocks dangerous file writes in strict mode.
# Exit code 0: allow, Exit code 2: block (with stderr message)

# Read JSON from stdin
INPUT=$(cat /dev/stdin 2>/dev/null || echo "{}")

# Extract file path from JSON (works for Write and Edit tools)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  # No file path found, allow
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

# Dangerous file patterns to block in strict mode
DANGEROUS_FILES=(
  "\\.env$"
  "\\.env\\..*"
  "secrets/"
  "credentials\\.json"
  "config/database\\.yml"
  "\\.git/"
  "\\.workflow_state\\.json"
  "id_rsa"
  "\\.pem$"
  "\\.key$"
)

# Check for dangerous file patterns
for pattern in "${DANGEROUS_FILES[@]}"; do
  if echo "$FILE_PATH" | grep -qiE "$pattern"; then
    # Output to stderr (shown to user)
    echo "Workflow Guardian (strict mode): Dangerous file write blocked" >&2
    echo "  Pattern: $pattern" >&2
    echo "  File: $FILE_PATH" >&2
    echo "" >&2
    echo "This file is not allowed to be written in strict mode." >&2
    echo "Please edit it manually for safety." >&2
    exit 2  # Exit code 2 = block
  fi
done

# Allow write
exit 0
