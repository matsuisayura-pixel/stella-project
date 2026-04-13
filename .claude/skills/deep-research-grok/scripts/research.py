#!/usr/bin/env python3
"""
Deep Research with Grok-4 Agent Tools + Exa Search
xAI Grok-4 の Agent Tools API + Exa セマンティック検索による高精度ディープリサーチ
"""

import os
import sys
import json
import argparse
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    from openai import OpenAI
except ImportError:
    print("Error: openai package required. Run: pip install openai", file=sys.stderr)
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(Path.cwd() / ".env")
    load_dotenv(Path.home() / "taisun_agent/.env", override=False)
except ImportError:
    pass

XAI_API_KEY = os.environ.get("XAI_API_KEY")
EXA_API_KEY = os.environ.get("EXA_API_KEY")
DEFAULT_MODEL = "grok-4-0709"

RESEARCH_PLAN_PROMPT = """あなたは高精度リサーチの専門家です。
以下のリサーチトピックについて、包括的な調査計画を立ててください。

トピック: {topic}

出力形式（JSON）:
{{
  "overview": "トピックの概要と調査の目的（2-3文）",
  "key_questions": ["調査すべき重要な問い1", "問い2", "問い3", "問い4", "問い5"],
  "search_queries": ["英語検索クエリ1", "英語検索クエリ2", "日本語検索クエリ1", "日本語検索クエリ2"],
  "expected_sections": ["最終レポートのセクション1", "セクション2", "セクション3", "セクション4"]
}}

JSONのみを出力してください。"""

RESEARCH_SECTION_PROMPT = """あなたはリサーチアナリストです。
Web検索を積極的に活用して、以下のセクションについて詳細な調査を行ってください。

全体トピック: {topic}
調査セクション: {section}
重点的に調べること:
{focus_questions}

{exa_context}

要件:
- Web検索ツールを積極的に使用してください
- 最新の情報（2024-2025年）を優先してください
- 具体的な数値・データ・事例を含めてください
- 信頼性の高いソースを参照してください
- 日本語で回答してください

このセクションの詳細な調査結果を400-600文字で報告してください。"""

SYNTHESIS_PROMPT = """あなたは上級リサーチアナリストです。
以下の調査結果を統合して、プロフェッショナルな最終レポートを作成してください。

## トピック
{topic}

## 各セクションの調査結果
{sections_content}

## 出力要件
以下のMarkdown形式で包括的なレポートを作成してください:

# {topic} - 高精度リサーチレポート

## エグゼクティブサマリー
（3-5文で核心的な発見をまとめる）

## 詳細分析
（各セクションの内容を深く掘り下げる）

## 主要な発見と洞察
（箇条書きで5-10個の重要ポイント）

## データ・統計
（具体的な数値、市場規模、成長率等）

## 今後の展望とトレンド
（将来予測と機会）

## 結論と推奨事項
（実行可能な提言）

---
*調査日時: {timestamp}*
*使用モデル: Grok-4 (xAI) - Agent Tools Web Search*"""


def create_client() -> OpenAI:
    if not XAI_API_KEY:
        print("Error: XAI_API_KEY not set in environment", file=sys.stderr)
        print("Set it in .env or export XAI_API_KEY=your-key", file=sys.stderr)
        sys.exit(1)
    return OpenAI(api_key=XAI_API_KEY, base_url="https://api.x.ai/v1")


def exa_search(query: str, num_results: int = 5) -> list[dict]:
    """Exa セマンティック検索で補足コンテキストを取得"""
    if not EXA_API_KEY:
        return []
    try:
        import urllib.request
        import urllib.error
        payload = json.dumps({
            "query": query,
            "numResults": num_results,
            "useAutoprompt": True,
            "type": "neural",
        }).encode()
        req = urllib.request.Request(
            "https://api.exa.ai/search",
            data=payload,
            headers={
                "x-api-key": EXA_API_KEY,
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            return data.get("results", [])
    except Exception as e:
        print(f"  ⚠ Exa search error: {e}", file=sys.stderr)
        return []


def format_exa_context(results: list[dict]) -> str:
    """Exa 結果をプロンプト用テキストに変換"""
    if not results:
        return ""
    lines = ["## 補足情報（Exa セマンティック検索結果）"]
    for r in results[:4]:
        title = r.get("title", "")
        url = r.get("url", "")
        snippet = r.get("text", "")[:200] if r.get("text") else ""
        if title or snippet:
            lines.append(f"- **{title}** ({url})\n  {snippet}")
    return "\n".join(lines) + "\n"


def extract_content(response) -> str:
    """レスポンスからテキストコンテンツを抽出（tool_use 含む）"""
    msg = response.choices[0].message
    # 直接コンテンツがある場合
    if msg.content:
        return msg.content
    # tool_calls がある場合（Agent Tools 使用時）
    if hasattr(msg, "tool_calls") and msg.tool_calls:
        # finish_reason が tool_calls なら再度コンテキストを詰める必要あり
        # xAI は通常 final answer を content に入れるため、空の場合はフォールバック
        return f"[調査実行中 - セクション内容をツール経由で取得]"
    return ""


def plan_research(client: OpenAI, topic: str, verbose: bool = False) -> dict:
    """Grok-3-mini でリサーチ計画を作成（コスト節約）"""
    if verbose:
        print("📋 リサーチ計画を作成中...", file=sys.stderr)

    response = client.chat.completions.create(
        model="grok-3-mini",
        messages=[{"role": "user", "content": RESEARCH_PLAN_PROMPT.format(topic=topic)}],
        max_tokens=1024,
        temperature=0.3,
    )

    content = response.choices[0].message.content.strip()
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    try:
        plan = json.loads(content)
    except json.JSONDecodeError:
        plan = {
            "overview": f"{topic}の包括的な調査",
            "key_questions": [f"{topic}の現状と概要", f"{topic}の市場・トレンド", f"{topic}の将来展望"],
            "search_queries": [topic, f"{topic} analysis 2025", f"{topic} trend"],
            "expected_sections": ["概要と現状", "詳細分析", "トレンドと展望", "結論"]
        }

    if verbose:
        print(f"✅ 計画完了: {len(plan.get('expected_sections', []))}セクション", file=sys.stderr)
        if EXA_API_KEY:
            print("  🔎 Exa セマンティック検索: 有効", file=sys.stderr)

    return plan


def research_section(
    client: OpenAI,
    topic: str,
    section: str,
    focus_questions: list,
    search_queries: list,
    use_search: bool = True,
    verbose: bool = False,
) -> tuple[str, list]:
    """Grok-4 Agent Tools + Exa で1セクションを調査"""
    if verbose:
        print(f"🔍 調査中: {section}", file=sys.stderr)

    # Exa で補足コンテキストを取得
    exa_context = ""
    if EXA_API_KEY and search_queries:
        exa_results = exa_search(search_queries[0] if search_queries else section)
        exa_context = format_exa_context(exa_results)
        if verbose and exa_results:
            print(f"  📚 Exa: {len(exa_results)}件の補足情報", file=sys.stderr)

    prompt = RESEARCH_SECTION_PROMPT.format(
        topic=topic,
        section=section,
        focus_questions="\n".join(f"- {q}" for q in focus_questions[:3]),
        exa_context=exa_context,
    )

    kwargs = {
        "model": DEFAULT_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 2048,
        "temperature": 0.2,
    }
    if use_search:
        kwargs["tools"] = [{"type": "web_search"}]

    response = client.chat.completions.create(**kwargs)
    content = extract_content(response)

    # 引用情報を取得
    citations = []
    msg = response.choices[0].message
    if hasattr(msg, "citations") and msg.citations:
        citations = msg.citations
    elif hasattr(response, "citations") and response.citations:
        citations = response.citations

    if verbose:
        print(f"  ✓ 完了 ({len(citations)}件の引用)", file=sys.stderr)

    return content, citations


def synthesize_report(
    client: OpenAI,
    topic: str,
    sections_data: list[dict],
    verbose: bool = False,
) -> str:
    """調査結果を統合してレポートを生成"""
    if verbose:
        print("📝 最終レポートを生成中...", file=sys.stderr)

    sections_content = ""
    for data in sections_data:
        sections_content += f"\n### {data['section']}\n{data['content']}\n"

    prompt = SYNTHESIS_PROMPT.format(
        topic=topic,
        sections_content=sections_content,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S JST"),
    )

    response = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096,
        temperature=0.3,
        tools=[{"type": "web_search"}],
    )

    return extract_content(response)


def run_deep_research(
    topic: str,
    output_dir: Optional[str] = None,
    verbose: bool = True,
    quick: bool = False,
) -> dict:
    """メインの深いリサーチを実行"""
    client = create_client()
    start_time = time.time()

    print(f"\n🔬 Deep Research (Grok-4 + Exa) 開始: {topic}", file=sys.stderr)
    print("━" * 60, file=sys.stderr)

    # Step 1: リサーチ計画
    plan = plan_research(client, topic, verbose=verbose)

    sections = plan.get("expected_sections", ["概要", "詳細分析", "展望"])
    key_questions = plan.get("key_questions", [])
    search_queries = plan.get("search_queries", [topic])

    if quick:
        sections = sections[:2]

    # Step 2: セクション別調査
    sections_data = []
    all_citations = []

    for i, section in enumerate(sections):
        section_questions = key_questions[i::len(sections)] if key_questions else []
        section_queries = search_queries[i::len(sections)] if search_queries else [topic]
        content, citations = research_section(
            client, topic, section, section_questions, section_queries,
            use_search=True, verbose=verbose,
        )
        sections_data.append({"section": section, "content": content})
        all_citations.extend(citations)

        if i < len(sections) - 1:
            time.sleep(1)

    # Step 3: 最終レポート生成
    final_report = synthesize_report(client, topic, sections_data, verbose=verbose)

    # 引用情報を付加
    if all_citations:
        final_report += "\n\n## 参考ソース\n"
        seen = set()
        for citation in all_citations:
            url = getattr(citation, "url", str(citation)) if not isinstance(citation, str) else citation
            if url and url not in seen:
                seen.add(url)
                title = getattr(citation, "title", url) if not isinstance(citation, str) else url
                final_report += f"- [{title}]({url})\n"

    elapsed = time.time() - start_time

    print(f"\n✅ 完了! 所要時間: {elapsed:.1f}秒", file=sys.stderr)
    print(f"📄 セクション数: {len(sections)}", file=sys.stderr)
    print(f"🔗 引用数: {len(all_citations)}", file=sys.stderr)

    # 保存
    if output_dir:
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        md_path = out_path / f"grok_research_{ts}.md"
        json_path = out_path / f"grok_research_{ts}.json"

        md_path.write_text(final_report, encoding="utf-8")
        json_data = {
            "topic": topic,
            "plan": plan,
            "sections": sections_data,
            "citations": [str(c) for c in all_citations],
            "elapsed_sec": elapsed,
            "timestamp": datetime.now().isoformat(),
        }
        json_path.write_text(json.dumps(json_data, ensure_ascii=False, indent=2), encoding="utf-8")

        print(f"💾 保存完了:", file=sys.stderr)
        print(f"   Markdown: {md_path}", file=sys.stderr)
        print(f"   JSON: {json_path}", file=sys.stderr)

        return {"report": final_report, "md_path": str(md_path), "json_path": str(json_path)}

    return {"report": final_report, "citations": all_citations}


def main():
    parser = argparse.ArgumentParser(
        description="Deep Research with Grok-4 Agent Tools + Exa",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
例:
  python3 research.py "AIエージェント市場の現状と将来"
  python3 research.py "Claude Code vs Cursor 比較" --quick
  python3 research.py "日本のスタートアップエコシステム" --output ./reports
        """
    )
    parser.add_argument("query", help="リサーチトピック")
    parser.add_argument("--output", "-o", help="出力ディレクトリ（省略時は標準出力）")
    parser.add_argument("--quick", "-q", action="store_true", help="クイックモード（2セクションのみ）")
    parser.add_argument("--quiet", action="store_true", help="進捗表示を抑制")
    parser.add_argument("--json", action="store_true", help="JSON形式で出力")

    args = parser.parse_args()

    result = run_deep_research(
        topic=args.query,
        output_dir=args.output,
        verbose=not args.quiet,
        quick=args.quick,
    )

    if args.json:
        print(json.dumps({"report": result["report"]}, ensure_ascii=False))
    else:
        print(result["report"])


if __name__ == "__main__":
    main()
