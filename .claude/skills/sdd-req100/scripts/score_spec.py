#!/usr/bin/env python3
"""
C.U.T.E. Requirements Scorer for Agentic SDD

Scores requirements.md on 4 dimensions:
- C (Completeness): 0-25
- U (Unambiguity): 0-25
- T (Testability): 0-25
- E (EARS compliance): 0-25

Total: 0-100
"""

import argparse
import json
import re
from pathlib import Path

# Regex patterns
RE_REQ_HEADER = re.compile(r"^###\s+(REQ-\d{3})\s*:\s*(.+?)\s*$", re.MULTILINE)
RE_SECTION = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)

# EARS patterns (JP + EN) — intentionally strict
EARS_PATTERNS = [
    # English
    re.compile(r"^The system shall .+"),
    re.compile(r"^When .+, the system shall .+"),
    re.compile(r"^While .+, the system shall .+"),
    re.compile(r"^If .+, then the system shall .+"),
    re.compile(r"^Where .+ is (enabled|included).+, the system shall .+"),
    # Japanese
    re.compile(r"^システムは.+しなければならない。?$"),
    re.compile(r"^.+とき、システムは.+しなければならない。?$"),
    re.compile(r"^.+の間、システムは.+しなければならない。?$"),
    re.compile(r"^.+場合、システムは.+しなければならない。?$"),
    re.compile(r"^.+が有効な場合、システムは.+しなければならない。?$"),
]

RE_EARS_LINE = re.compile(r"^-?\s*要件文\(EARS\)\s*:\s*(.+)\s*$", re.MULTILINE)
RE_TYPE_LINE = re.compile(r"^-?\s*種別\s*:\s*(.+)\s*$", re.MULTILINE)
RE_PRIORITY_LINE = re.compile(r"^-?\s*優先度\s*:\s*(.+)\s*$", re.MULTILINE)
RE_AT_LINE = re.compile(r"^\s*-\s*AT-\d+\s*:\s*(.+)\s*$", re.MULTILINE)
RE_EH_LINE = re.compile(r"^\s*-\s*EH-\d+\s*:\s*(.+)\s*$", re.MULTILINE)


def strip_code_fences(md: str) -> str:
    """Remove fenced code blocks to avoid false positives"""
    return re.sub(r"```.*?```", "", md, flags=re.DOTALL)


def load_banned_words(path: Path):
    """Load banned words list from file"""
    words = []
    if not path.exists():
        return words
    for line in path.read_text(encoding="utf-8").splitlines():
        w = line.strip()
        if not w or w.startswith("#"):
            continue
        words.append(w)
    return words


def count_banned(md: str, banned_words):
    """Count banned word occurrences"""
    text = strip_code_fences(md)
    total = 0
    hits = []
    for w in banned_words:
        c = len(re.findall(re.escape(w), text, flags=re.IGNORECASE))
        if c:
            total += c
            hits.append({"word": w, "count": c})
    return total, hits


def ears_ok(s: str) -> bool:
    """Check if string matches EARS pattern"""
    s = s.strip()
    return any(p.match(s) for p in EARS_PATTERNS)


def main():
    ap = argparse.ArgumentParser(description="C.U.T.E. Requirements Scorer")
    ap.add_argument("requirements_md", type=str, help="Path to requirements.md")
    ap.add_argument("--out-json", type=str, default=None, help="Output path for score.json")
    ap.add_argument("--out-critique", type=str, default=None, help="Output path for critique.md")
    ap.add_argument("--banned-words", type=str,
                    default=str(Path(".claude/skills/sdd-req100/banned_words.txt")),
                    help="Path to banned_words.txt")
    args = ap.parse_args()

    req_path = Path(args.requirements_md)
    if not req_path.exists():
        print(json.dumps({"error": f"File not found: {req_path}"}))
        return

    md = req_path.read_text(encoding="utf-8")

    # Load banned words
    banned_path = Path(args.banned_words)
    if not banned_path.exists():
        # fallback for user-level skill install
        banned_path = Path.home() / ".claude/skills/sdd-req100/banned_words.txt"
    banned_words = load_banned_words(banned_path) if banned_path.exists() else []

    # ---- Parse sections ----
    sections = [m.group(1).strip() for m in RE_SECTION.finditer(md)]
    required_sections = [
        "目的", "概要", "スコープ", "用語集", "前提/仮定", "前提", "仮定",
        "機能要件", "非機能要件", "セキュリティ", "プライバシー",
        "ログ", "監視", "運用", "未解決事項"
    ]

    # Check which required sections are missing
    found_sections = set()
    for sec in sections:
        for req in required_sections:
            if req in sec:
                found_sections.add(req)

    # Core required sections
    core_required = ["目的", "スコープ", "機能要件", "非機能要件", "未解決事項"]
    missing_sections = [s for s in core_required if s not in found_sections and
                        not any(s in sec for sec in sections)]

    # ---- Parse requirements blocks ----
    reqs = []
    matches = list(RE_REQ_HEADER.finditer(md))
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i+1].start() if i+1 < len(matches) else len(md)
        block = md[start:end]
        req_id = m.group(1)
        title = m.group(2)

        t = RE_TYPE_LINE.search(block)
        p = RE_PRIORITY_LINE.search(block)
        e = RE_EARS_LINE.search(block)
        ats = RE_AT_LINE.findall(block)
        ehs = RE_EH_LINE.findall(block)

        ears_line = e.group(1).strip() if e else ""
        reqs.append({
            "id": req_id,
            "title": title,
            "has_type": bool(t),
            "has_priority": bool(p),
            "has_ears": bool(e),
            "ears": ears_line,
            "ears_ok": ears_ok(ears_line) if ears_line else False,
            "ats": ats,
            "ehs": ehs,
            "has_at": len(ats) > 0,
            "has_eh": len(ehs) > 0,
            "gwt_ok": any(("Given" in a and "When" in a and "Then" in a) for a in ats),
        })

    # ---- Open Questions count ----
    open_q_count = 0
    oq_match = re.search(r"^##\s+.*未解決事項.*$(.*?)(^##\s+|\Z)", md, flags=re.MULTILINE | re.DOTALL)
    if oq_match:
        body = oq_match.group(1)
        # Count bullet points that aren't just "なし" or empty
        bullets = re.findall(r"^\s*-\s+(.+)", body, flags=re.MULTILINE)
        for b in bullets:
            if b.strip() and b.strip() not in ["なし", "（なし）", "None", "N/A", "-"]:
                open_q_count += 1

    # ---- Scoring (C/U/T/E each 0..25) ----
    C = 25
    U = 25
    T = 25
    E = 25

    violations = []

    # Completeness
    C -= 3 * len(missing_sections)
    for s in missing_sections:
        violations.append({
            "code": "MISSING_SECTION",
            "severity": "high",
            "message": f"必須セクションが不足: {s}"
        })

    # Per requirement mandatory fields
    for r in reqs:
        for field, ok in [
            ("種別", r["has_type"]),
            ("優先度", r["has_priority"]),
            ("要件文(EARS)", r["has_ears"]),
            ("受入テスト", r["has_at"]),
            ("例外・エラー", r["has_eh"])
        ]:
            if not ok:
                C -= 1
                violations.append({
                    "code": "MISSING_REQ_FIELD",
                    "severity": "high",
                    "message": f"{r['id']} に必須フィールド欠落: {field}"
                })

    # Open questions penalty
    if open_q_count > 0:
        C -= 2 * open_q_count
        violations.append({
            "code": "OPEN_QUESTIONS",
            "severity": "high",
            "message": f"未解決事項が {open_q_count} 件あります（100点到達不可）。"
        })

    C = max(0, min(25, C))

    # Unambiguity
    banned_total, banned_hits = count_banned(md, banned_words)
    U -= min(25, banned_total)
    if banned_total:
        violations.append({
            "code": "AMBIGUOUS_WORDS",
            "severity": "medium",
            "message": f"曖昧語が {banned_total} 個出現: {banned_hits}"
        })
    U = max(0, min(25, U))

    # Testability
    for r in reqs:
        if not r["has_at"]:
            T -= 3
            violations.append({
                "code": "NO_ACCEPTANCE_TEST",
                "severity": "high",
                "message": f"{r['id']} に受入テストがありません"
            })
        elif not r["gwt_ok"]:
            T -= 1
            violations.append({
                "code": "GWT_NOT_OK",
                "severity": "medium",
                "message": f"{r['id']} の受入テストがGWT(Given/When/Then)形式に見えません"
            })
    T = max(0, min(25, T))

    # EARS compliance
    for r in reqs:
        if r["has_ears"] and not r["ears_ok"]:
            E -= 2
            violations.append({
                "code": "EARS_NOT_OK",
                "severity": "high",
                "message": f"{r['id']} の要件文(EARS)がEARSパターンに一致しません: {r['ears']}"
            })
        if not r["has_ears"]:
            E -= 2
    E = max(0, min(25, E))

    score_total = int(C + U + T + E)

    score = {
        "score_total": score_total,
        "score_breakdown": {"C": C, "U": U, "T": T, "E": E},
        "counts": {
            "requirements": len(reqs),
            "missing_sections": len(missing_sections),
            "open_questions": open_q_count,
            "banned_word_total": banned_total,
        },
        "violations": violations,
    }

    # Generate critique
    critique_lines = []
    critique_lines.append("# Critique\n\n")
    critique_lines.append(f"- **Score**: {score_total}/100 (C={C}, U={U}, T={T}, E={E})\n")
    critique_lines.append(f"- **Requirements found**: {len(reqs)}\n")
    critique_lines.append(f"- **Missing sections**: {len(missing_sections)}\n")
    critique_lines.append(f"- **Open questions**: {open_q_count}\n")
    critique_lines.append(f"- **Banned words**: {banned_total}\n\n")

    if len(reqs) == 0:
        critique_lines.append("## Critical\n")
        critique_lines.append("- 要件(REQ-xxx)が見つかりません。テンプレ形式に沿ってください。\n\n")

    if violations:
        critique_lines.append("## Issues\n\n")
        for v in violations[:50]:  # Limit to 50 issues
            severity_icon = "🔴" if v['severity'] == 'high' else "🟡"
            critique_lines.append(f"- {severity_icon} [{v['severity']}] **{v['code']}**: {v['message']}\n")
    else:
        critique_lines.append("## Issues\n\n")
        critique_lines.append("- 重大な問題は検出されませんでした。\n")

    critique_lines.append("\n## Recommendations\n\n")
    if score_total >= 98:
        critique_lines.append("- スコアは目標(98点以上)を達成しています。\n")
    else:
        critique_lines.append(f"- 目標スコア(98点)まであと {98 - score_total} 点必要です。\n")
        if C < 25:
            critique_lines.append("- **Completeness**: 必須セクション/フィールドを追加してください。\n")
        if U < 25:
            critique_lines.append("- **Unambiguity**: 曖昧語を具体的な数値/状態に置き換えてください。\n")
        if T < 25:
            critique_lines.append("- **Testability**: 全REQにGWT形式の受入テストを追加してください。\n")
        if E < 25:
            critique_lines.append("- **EARS**: 全REQの要件文をEARSパターンに準拠させてください。\n")

    # Write outputs
    if args.out_json:
        Path(args.out_json).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out_json).write_text(json.dumps(score, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.out_critique:
        Path(args.out_critique).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out_critique).write_text("".join(critique_lines), encoding="utf-8")

    # Print summary for terminal
    print(json.dumps(score, ensure_ascii=False))


if __name__ == "__main__":
    main()
