#!/usr/bin/env python3
"""
Omega Research - 最高精度統合リサーチシステム
Grok-4 Agent Tools + Exa + Tavily + Brave + NewsAPI の完全統合
"""

import os
import sys
import json
import argparse
import time
import urllib.request
import urllib.parse
import urllib.error
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

# ── API Keys ──────────────────────────────────────────
XAI_API_KEY = os.environ.get("XAI_API_KEY")
EXA_API_KEY = os.environ.get("EXA_API_KEY")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")
BRAVE_API_KEY = os.environ.get("BRAVE_SEARCH_API_KEY") or os.environ.get("BRAVE_API_KEY")
NEWSAPI_KEY = os.environ.get("NEWSAPI_KEY")
PERPLEXITY_API_KEY = os.environ.get("PERPLEXITY_API_KEY")

GROK_MODEL = "grok-4-0709"
PLAN_MODEL = "grok-3-mini"

# ── Prompts ───────────────────────────────────────────
PLAN_PROMPT = """\
あなたは高精度リサーチの専門家です。
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

SECTION_PROMPT = """\
あなたはリサーチアナリストです。
Web検索を積極的に活用して、以下のセクションについて詳細な調査を行ってください。

全体トピック: {topic}
調査セクション: {section}
重点的に調べること:
{focus_questions}

{api_context}

{exa_context}

要件:
- Web検索ツールを積極的に使用してください
- 最新の情報（2024-2026年）を優先してください
- 具体的な数値・データ・事例を含めてください
- 信頼性の高いソースを参照してください
- 日本語で回答してください

このセクションの詳細な調査結果を400-600文字で報告してください。"""

SYNTHESIS_PROMPT = """\
あなたは上級リサーチアナリストです。
以下の調査結果を統合して、プロフェッショナルな最終レポートを作成してください。

## トピック
{topic}

## Grok-4 各セクションの調査結果
{sections_content}

## API検索結果（補足）
{api_summary}

## 出力要件
以下のMarkdown形式で包括的なレポートを作成してください:

# {topic} - Omega Research レポート

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
*使用ソース: Grok-4 Agent Tools Web Search + {sources_used}*"""


# ── API Helpers ───────────────────────────────────────

def _http_post(url: str, headers: dict, payload: dict, timeout: int = 15) -> dict:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def _http_get(url: str, headers: dict, timeout: int = 15) -> dict:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def exa_search(query: str, num_results: int = 5) -> list[dict]:
    if not EXA_API_KEY:
        return []
    try:
        data = _http_post(
            "https://api.exa.ai/search",
            headers={"x-api-key": EXA_API_KEY, "Content-Type": "application/json"},
            payload={"query": query, "numResults": num_results, "useAutoprompt": True, "type": "neural"},
        )
        return data.get("results", [])
    except Exception as e:
        print(f"  ⚠ Exa: {e}", file=sys.stderr)
        return []


def tavily_search(query: str, num_results: int = 8) -> list[dict]:
    if not TAVILY_API_KEY:
        return []
    try:
        data = _http_post(
            "https://api.tavily.com/search",
            headers={"Content-Type": "application/json"},
            payload={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "advanced",
                "include_answer": True,
                "include_raw_content": False,
                "max_results": num_results,
            },
        )
        return data.get("results", [])
    except Exception as e:
        print(f"  ⚠ Tavily: {e}", file=sys.stderr)
        return []


def brave_search(query: str, num_results: int = 8) -> list[dict]:
    if not BRAVE_API_KEY:
        return []
    try:
        q = urllib.parse.quote(query)
        data = _http_get(
            f"https://api.search.brave.com/res/v1/web/search?q={q}&count={num_results}",
            headers={"Accept": "application/json", "X-Subscription-Token": BRAVE_API_KEY},
        )
        return data.get("web", {}).get("results", [])
    except Exception as e:
        print(f"  ⚠ Brave: {e}", file=sys.stderr)
        return []


def newsapi_search(query: str, num_results: int = 5) -> list[dict]:
    if not NEWSAPI_KEY:
        return []
    try:
        q = urllib.parse.quote(query)
        data = _http_get(
            f"https://newsapi.org/v2/everything?q={q}&apiKey={NEWSAPI_KEY}&sortBy=publishedAt&pageSize={num_results}&language=en",
            headers={},
        )
        return data.get("articles", [])
    except Exception as e:
        print(f"  ⚠ NewsAPI: {e}", file=sys.stderr)
        return []


def perplexity_summary(query: str) -> str:
    if not PERPLEXITY_API_KEY:
        return ""
    try:
        data = _http_post(
            "https://api.perplexity.ai/chat/completions",
            headers={"Authorization": f"Bearer {PERPLEXITY_API_KEY}", "Content-Type": "application/json"},
            payload={
                "model": "llama-3.1-sonar-large-128k-online",
                "messages": [{"role": "user", "content": f"{query} について最新の要点を300文字で要約してください。"}],
            },
        )
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")
    except Exception as e:
        print(f"  ⚠ Perplexity: {e}", file=sys.stderr)
        return ""


# ── Context Formatters ────────────────────────────────

def format_exa_context(results: list[dict]) -> str:
    if not results:
        return ""
    lines = ["## 補足情報（Exa セマンティック検索）"]
    for r in results[:4]:
        title = r.get("title", "")
        url = r.get("url", "")
        snippet = (r.get("text", "") or "")[:180]
        if title or snippet:
            lines.append(f"- **{title}** ({url})\n  {snippet}")
    return "\n".join(lines) + "\n"


def format_api_context(tavily: list, brave: list, news: list, perplexity_text: str) -> str:
    """API結果をプロンプト用テキストに変換"""
    parts = []
    if tavily:
        parts.append("## Tavily AI検索結果")
        for r in tavily[:4]:
            title = r.get("title", "")
            url = r.get("url", "")
            content = (r.get("content", "") or "")[:150]
            parts.append(f"- **{title}** ({url})\n  {content}")

    if brave:
        parts.append("## Brave Web検索結果")
        for r in brave[:4]:
            title = r.get("title", "")
            url = r.get("url", "")
            desc = (r.get("description", "") or "")[:150]
            parts.append(f"- **{title}** ({url})\n  {desc}")

    if news:
        parts.append("## 最新ニュース (NewsAPI)")
        for a in news[:4]:
            title = a.get("title", "")
            url = a.get("url", "")
            published = a.get("publishedAt", "")[:10]
            parts.append(f"- [{published}] **{title}** ({url})")

    if perplexity_text:
        parts.append(f"## Perplexity AI要約\n{perplexity_text}")

    return "\n".join(parts) + "\n" if parts else ""


def format_api_summary(all_api_results: list[dict]) -> str:
    """最終統合用のAPI結果サマリー"""
    if not all_api_results:
        return "（API検索結果なし）"
    lines = []
    for r in all_api_results[:12]:
        title = r.get("title", "")
        url = r.get("url", "")
        src = r.get("_source", "")
        if title:
            lines.append(f"- [{src}] {title} - {url}")
    return "\n".join(lines) if lines else "（API結果なし）"


# ── Core Research Functions ───────────────────────────

def create_client() -> OpenAI:
    if not XAI_API_KEY:
        print("Error: XAI_API_KEY not set", file=sys.stderr)
        sys.exit(1)
    return OpenAI(api_key=XAI_API_KEY, base_url="https://api.x.ai/v1")


def extract_content(response) -> str:
    msg = response.choices[0].message
    if msg.content:
        return msg.content
    if hasattr(msg, "tool_calls") and msg.tool_calls:
        return "[調査実行中 - ツール経由で取得]"
    return ""


def plan_research(client: OpenAI, topic: str, verbose: bool = False) -> dict:
    if verbose:
        print("📋 リサーチ計画を作成中...", file=sys.stderr)
    response = client.chat.completions.create(
        model=PLAN_MODEL,
        messages=[{"role": "user", "content": PLAN_PROMPT.format(topic=topic)}],
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
            "key_questions": [f"{topic}の現状", f"{topic}の市場規模", f"{topic}の将来展望"],
            "search_queries": [topic, f"{topic} analysis 2025 2026", f"{topic} trend"],
            "expected_sections": ["概要と現状", "詳細分析", "トレンドと展望", "結論"],
        }
    if verbose:
        print(f"✅ 計画完了: {len(plan.get('expected_sections', []))}セクション", file=sys.stderr)
    return plan


def collect_api_results(query: str, verbose: bool = False) -> tuple[list, str]:
    """Tavily + Brave + NewsAPI + Perplexity を並列的に呼び出す"""
    all_results = []

    if TAVILY_API_KEY:
        if verbose:
            print(f"  🔍 Tavily検索: {query[:40]}", file=sys.stderr)
        results = tavily_search(query)
        for r in results:
            r["_source"] = "Tavily"
        all_results.extend(results)

    if BRAVE_API_KEY:
        if verbose:
            print(f"  🔍 Brave検索: {query[:40]}", file=sys.stderr)
        results = brave_search(query)
        for r in results:
            r["_source"] = "Brave"
        all_results.extend(results)

    if NEWSAPI_KEY:
        if verbose:
            print(f"  📰 NewsAPI: {query[:40]}", file=sys.stderr)
        results = newsapi_search(query)
        for r in results:
            r["_source"] = "NewsAPI"
        all_results.extend(results)

    perplexity_text = ""
    if PERPLEXITY_API_KEY and verbose:
        print(f"  🤖 Perplexity要約: {query[:40]}", file=sys.stderr)
    perplexity_text = perplexity_summary(query) if PERPLEXITY_API_KEY else ""

    return all_results, perplexity_text


def research_section(
    client: OpenAI,
    topic: str,
    section: str,
    focus_questions: list,
    search_queries: list,
    use_apis: bool = True,
    verbose: bool = False,
) -> tuple[str, list]:
    if verbose:
        print(f"🔍 セクション調査: {section}", file=sys.stderr)

    # Exa補足コンテキスト
    exa_context = ""
    if EXA_API_KEY and search_queries:
        exa_results = exa_search(search_queries[0])
        exa_context = format_exa_context(exa_results)
        if verbose and exa_results:
            print(f"  📚 Exa: {len(exa_results)}件", file=sys.stderr)

    # API検索コンテキスト
    api_context = ""
    api_all_results = []
    if use_apis and search_queries:
        api_all_results, perplexity_text = collect_api_results(search_queries[0], verbose=verbose)
        tavily_r = [r for r in api_all_results if r.get("_source") == "Tavily"]
        brave_r = [r for r in api_all_results if r.get("_source") == "Brave"]
        news_r = [r for r in api_all_results if r.get("_source") == "NewsAPI"]
        api_context = format_api_context(tavily_r, brave_r, news_r, perplexity_text)

    prompt = SECTION_PROMPT.format(
        topic=topic,
        section=section,
        focus_questions="\n".join(f"- {q}" for q in focus_questions[:3]),
        api_context=api_context,
        exa_context=exa_context,
    )

    response = client.chat.completions.create(
        model=GROK_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2048,
        temperature=0.2,
        tools=[{"type": "web_search"}],
    )
    content = extract_content(response)

    citations = []
    msg = response.choices[0].message
    if hasattr(msg, "citations") and msg.citations:
        citations = msg.citations
    elif hasattr(response, "citations") and response.citations:
        citations = response.citations

    if verbose:
        print(f"  ✓ 完了 (引用:{len(citations)}件, API:{len(api_all_results)}件)", file=sys.stderr)

    return content, citations


def synthesize_report(
    client: OpenAI,
    topic: str,
    sections_data: list[dict],
    all_api_results: list[dict],
    mode: str,
    verbose: bool = False,
) -> str:
    if verbose:
        print("📝 最終レポートを統合生成中...", file=sys.stderr)

    sections_content = ""
    for data in sections_data:
        sections_content += f"\n### {data['section']}\n{data['content']}\n"

    sources_used = []
    if EXA_API_KEY:
        sources_used.append("Exa")
    if TAVILY_API_KEY:
        sources_used.append("Tavily")
    if BRAVE_API_KEY:
        sources_used.append("Brave")
    if NEWSAPI_KEY:
        sources_used.append("NewsAPI")
    if PERPLEXITY_API_KEY:
        sources_used.append("Perplexity")
    sources_used.append(f"Mode:{mode}")

    prompt = SYNTHESIS_PROMPT.format(
        topic=topic,
        sections_content=sections_content,
        api_summary=format_api_summary(all_api_results),
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S JST"),
        sources_used=", ".join(sources_used) if sources_used else "None",
    )

    response = client.chat.completions.create(
        model=GROK_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096,
        temperature=0.3,
        tools=[{"type": "web_search"}],
    )
    return extract_content(response)


# ── Main Orchestrator ─────────────────────────────────

def run_omega_research(
    topic: str,
    output_dir: Optional[str] = None,
    mode: str = "deep",
    verbose: bool = True,
) -> dict:
    client = create_client()
    start_time = time.time()

    use_apis = mode in ("deep", "api", "intel", "quick")
    quick = mode == "quick"
    use_intel = mode in ("deep", "intel")

    print(f"\n🔬 Omega Research 開始: {topic}", file=sys.stderr)
    print(f"📡 モード: {mode.upper()}", file=sys.stderr)

    api_flags = []
    if EXA_API_KEY:
        api_flags.append("Exa")
    if TAVILY_API_KEY and use_apis:
        api_flags.append("Tavily")
    if BRAVE_API_KEY and use_apis:
        api_flags.append("Brave")
    if NEWSAPI_KEY and use_apis:
        api_flags.append("NewsAPI")
    if PERPLEXITY_API_KEY and use_apis:
        api_flags.append("Perplexity")

    print(f"🔌 有効API: Grok-4 + {', '.join(api_flags) if api_flags else 'なし'}", file=sys.stderr)
    if use_intel:
        print("⚠️  intelligence-research は別途起動してください（SKILL.md Step 3参照）", file=sys.stderr)
    print("━" * 60, file=sys.stderr)

    # Step 1: Plan
    plan = plan_research(client, topic, verbose=verbose)
    sections = plan.get("expected_sections", ["概要", "詳細分析", "展望"])
    key_questions = plan.get("key_questions", [])
    search_queries = plan.get("search_queries", [topic])

    if quick:
        sections = sections[:2]

    # Step 2: Section research
    sections_data = []
    all_citations = []
    all_api_results = []

    for i, section in enumerate(sections):
        section_questions = key_questions[i::len(sections)] if key_questions else []
        section_queries = search_queries[i::len(sections)] if search_queries else [topic]

        content, citations = research_section(
            client, topic, section, section_questions, section_queries,
            use_apis=use_apis, verbose=verbose,
        )
        sections_data.append({"section": section, "content": content})
        all_citations.extend(citations)

        # API結果も収集（セクション1のみ全件取得して再利用）
        if i == 0 and use_apis and section_queries:
            api_r, _ = collect_api_results(topic, verbose=False)
            all_api_results.extend(api_r)

        if i < len(sections) - 1:
            time.sleep(1)

    # Step 3: Synthesis
    final_report = synthesize_report(
        client, topic, sections_data, all_api_results, mode, verbose=verbose
    )

    # Citations
    if all_citations:
        final_report += "\n\n## 参考ソース（Grok-4 Web Search）\n"
        seen = set()
        for citation in all_citations:
            url = getattr(citation, "url", str(citation)) if not isinstance(citation, str) else citation
            if url and url not in seen:
                seen.add(url)
                title = getattr(citation, "title", url) if not isinstance(citation, str) else url
                final_report += f"- [{title}]({url})\n"

    # API sources
    if all_api_results:
        final_report += "\n## 参考ソース（API検索）\n"
        seen_urls = set()
        for r in all_api_results:
            url = r.get("url", "")
            title = r.get("title", url)
            src = r.get("_source", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                final_report += f"- [{title}]({url}) [{src}]\n"

    elapsed = time.time() - start_time

    print(f"\n✅ 完了! 所要時間: {elapsed:.1f}秒", file=sys.stderr)
    print(f"📄 セクション数: {len(sections)}", file=sys.stderr)
    print(f"🔗 引用数: {len(all_citations)} + API {len(all_api_results)}件", file=sys.stderr)

    # Save
    if output_dir:
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        md_path = out_path / f"omega_research_{ts}.md"
        json_path = out_path / f"omega_research_{ts}.json"

        md_path.write_text(final_report, encoding="utf-8")
        json_data = {
            "topic": topic,
            "mode": mode,
            "plan": plan,
            "sections": sections_data,
            "api_results_count": len(all_api_results),
            "citations_count": len(all_citations),
            "elapsed_sec": elapsed,
            "timestamp": datetime.now().isoformat(),
            "apis_used": {
                "grok4": True,
                "exa": bool(EXA_API_KEY),
                "tavily": bool(TAVILY_API_KEY) and use_apis,
                "brave": bool(BRAVE_API_KEY) and use_apis,
                "newsapi": bool(NEWSAPI_KEY) and use_apis,
                "perplexity": bool(PERPLEXITY_API_KEY) and use_apis,
            },
        }
        json_path.write_text(json.dumps(json_data, ensure_ascii=False, indent=2), encoding="utf-8")

        print(f"💾 保存完了:", file=sys.stderr)
        print(f"   Markdown: {md_path}", file=sys.stderr)
        print(f"   JSON:     {json_path}", file=sys.stderr)

        return {"report": final_report, "md_path": str(md_path), "json_path": str(json_path), "elapsed": elapsed}

    return {"report": final_report, "elapsed": elapsed}


def main():
    parser = argparse.ArgumentParser(
        description="Omega Research - Grok-4 + Exa + Tavily + Brave + NewsAPI 統合リサーチ",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
例:
  python3 research.py "AIエージェント市場の現状と将来"
  python3 research.py "Claude Code vs Cursor 比較" --mode grok --quick
  python3 research.py "日本のSaaSトレンド" --mode api --output ./reports
  python3 research.py "量子コンピューティング投資" --mode deep --output ./reports
        """,
    )
    parser.add_argument("query", help="リサーチトピック")
    parser.add_argument("--output", "-o", help="出力ディレクトリ")
    parser.add_argument(
        "--mode", "-m",
        choices=["deep", "grok", "api", "intel", "academic", "quick"],
        default="deep",
        help="リサーチモード (default: deep)",
    )
    parser.add_argument("--quiet", action="store_true", help="進捗表示を抑制")
    parser.add_argument("--json", action="store_true", help="JSON形式で出力")

    args = parser.parse_args()

    result = run_omega_research(
        topic=args.query,
        output_dir=args.output,
        mode=args.mode,
        verbose=not args.quiet,
    )

    if args.json:
        print(json.dumps({"report": result["report"], "elapsed": result.get("elapsed")}, ensure_ascii=False))
    else:
        print(result["report"])


if __name__ == "__main__":
    main()
