---
description: "Re-score an existing requirements.md using sdd-req100 scorer. Writes score.json & critique.md next to the file."
argument-hint: "<path-to-requirements.md>"
allowed-tools: Bash(python *), Bash(ls:*), Bash(test:*), Bash(dirname:*), Bash(realpath:*), Bash(cat:*)
disable-model-invocation: true
---

## Task
- Take `$ARGUMENTS` as a path to `requirements.md`.
- Write outputs in the same directory:
  - `score.json`
  - `critique.md`
- Print the summary (score_total and breakdown) by reading `score.json`.

## Execute
```bash
set -e
REQ_PATH="$ARGUMENTS"
if [ -z "$REQ_PATH" ]; then
  echo "ERROR: provide path to requirements.md"
  exit 1
fi
REQ_REAL="$(realpath "$REQ_PATH")"
DIR="$(dirname "$REQ_REAL")"
python .claude/skills/sdd-req100/scripts/score_spec.py "$REQ_REAL" \
  --out-json "$DIR/score.json" \
  --out-critique "$DIR/critique.md" >/dev/null
echo "OK: wrote $DIR/score.json and $DIR/critique.md"
echo "--- score.json (head) ---"
cat "$DIR/score.json" | python -c "import sys,json; d=json.load(sys.stdin); print('score_total:', d.get('score_total')); print('breakdown:', d.get('score_breakdown'))"
```
