"""
コンテンツ生成パイプライン
note / ショート動画台本 / 音声スクリプト を同時生成する
"""

import anthropic
import os
from pathlib import Path
from datetime import datetime
from typing import Dict

from .character import STELLA_SYSTEM_PROMPT, FORMAT_INSTRUCTIONS, LINE_CTA
from .rag import search, format_for_prompt


MODEL = "claude-3-5-sonnet-20241022"
OUTPUT_DIR = Path(__file__).parent.parent / "output"


def generate_content(theme: str, user_query: str) -> Dict[str, str]:
    """
    テーマと相談内容をもとに、3媒体のコンテンツを同時生成する

    Args:
        theme: 今日のテーマ（例: "金運", "人間関係", "瞑想"）
        user_query: 相談内容・悩み（例: "お金が貯まらない理由がわからない"）

    Returns:
        {"note": ..., "short_video": ..., "audio": ...}
    """
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    # Step 1: RAG検索
    print(f"🔍 ナレッジベースを検索中... (テーマ: {theme})")
    hits = search(query=user_query, n_results=5, theme=theme if theme else None)
    rag_context = format_for_prompt(hits)

    results = {}

    # Step 2: 3媒体を順次生成
    for format_key, format_name in [
        ("note", "note記事"),
        ("short_video", "ショート動画台本"),
        ("audio", "音声スクリプト")
    ]:
        print(f"✍️  {format_name}を生成中...")

        prompt = _build_prompt(
            theme=theme,
            user_query=user_query,
            rag_context=rag_context,
            format_key=format_key
        )

        message = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=STELLA_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}]
        )

        content = message.content[0].text

        # CTA が含まれていない場合は末尾に追加
        if "LINE登録" not in content:
            content += "\n" + LINE_CTA

        results[format_key] = content

    return results


def _build_prompt(theme: str, user_query: str, rag_context: str, format_key: str) -> str:
    """生成プロンプトを組み立てる"""
    format_instruction = FORMAT_INSTRUCTIONS[format_key]

    return f"""
今日のテーマ: 「{theme}」
相談内容・悩み: {user_query}

{rag_context}

---

上記のナレッジベースを参照しながら、以下のフォーマットでコンテンツを生成してください。

{format_instruction}

**重要な制約**:
- 引用はそのまま使わず、必ずステラの口調（「〜ですね」「〜なのです」）に変換する
- 講師名は使わず、「かつての賢者はこう説いた」等の表現に変換する
- 「どちらの季節にいるか」という多次元統合の視点を必ず盛り込む
- 末尾に必ずLINE CTA（魂の現在地診断）を挿入する
- 読者を「あなた」と呼ぶ

それでは、ステラとして出力してください。
"""


def save_results(theme: str, results: Dict[str, str]) -> str:
    """
    生成結果をファイルに保存する

    Returns:
        保存先ディレクトリパス
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_dir = OUTPUT_DIR / f"{timestamp}_{theme}"
    save_dir.mkdir(parents=True, exist_ok=True)

    file_map = {
        "note": "01_note記事.md",
        "short_video": "02_ショート動画台本.md",
        "audio": "03_音声スクリプト.md"
    }

    for key, content in results.items():
        file_path = save_dir / file_map[key]
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

    print(f"\n💾 保存先: {save_dir}")
    return str(save_dir)


def run_daily_pipeline(theme: str, user_query: str) -> str:
    """
    デイリーコンテンツ生成のメインフロー

    Args:
        theme: テーマ（例: "金運"）
        user_query: 相談内容（例: "お金が全然貯まらない。なぜ？"）

    Returns:
        保存先ディレクトリパス
    """
    print(f"\n🌟 ステラ コンテンツ生成パイプライン 起動")
    print(f"   テーマ: {theme}")
    print(f"   相談: {user_query}\n")

    results = generate_content(theme=theme, user_query=user_query)
    save_path = save_results(theme=theme, results=results)

    print("\n✅ 生成完了！")
    print("=" * 50)
    for format_key, content in results.items():
        format_name = {"note": "note記事", "short_video": "ショート動画台本", "audio": "音声スクリプト"}[format_key]
        print(f"\n📄 【{format_name}】")
        print(content[:300] + "..." if len(content) > 300 else content)
        print()

    return save_path
