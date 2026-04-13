#!/usr/bin/env python3
"""
note リサーチレポート生成器
JSON分析結果からMarkdownレポートを生成
"""

import json
from datetime import datetime
from typing import Dict, Any, List
from collections import Counter
import re


def generate_genre_report(data: Dict[str, Any]) -> str:
    """
    ジャンル別リサーチレポートを生成

    Args:
        data: research_genre() の結果

    Returns:
        Markdownレポート
    """
    genre = data.get("genre", "不明")
    timestamp = data.get("timestamp", datetime.now().isoformat())
    stats = data.get("stats", {})
    trending = data.get("trending", [])
    by_tag = data.get("by_tag", [])

    # トップ記事テーブル生成
    all_notes = trending + by_tag
    top_notes = sorted(all_notes, key=lambda x: x.get("likeCount", 0), reverse=True)[:20]

    top_table_rows = []
    for i, note in enumerate(top_notes, 1):
        title = note.get("name", note.get("title", ""))[:40]
        author = note.get("user", {}).get("urlname", "")
        likes = note.get("likeCount", 0)
        price = note.get("price", 0)
        price_str = f"¥{price:,}" if price > 0 else "無料"
        top_table_rows.append(f"| {i} | {title} | @{author} | {likes:,} | {price_str} |")

    top_articles_table = "\n".join(top_table_rows) if top_table_rows else "| - | データなし | - | - | - |"

    # タイトルパターン分析
    titles = [n.get("name", n.get("title", "")) for n in all_notes]
    title_patterns = analyze_title_patterns(titles)

    # 価格分布
    prices = [n.get("price", 0) for n in all_notes if n.get("price", 0) > 0]
    price_distribution = analyze_price_distribution(prices)

    # レポート生成
    report = f"""# {genre} ジャンル リサーチレポート

**調査日**: {timestamp[:10]}
**調査対象**: note.com内 {genre} 関連記事

---

## 概要

| 項目 | 値 |
|------|-----|
| 分析記事数 | {stats.get('total_count', len(all_notes))}件 |
| 平均スキ数 | {stats.get('avg_likes', 0):.1f} |
| 有料記事数 | {stats.get('paid_count', len(prices))}件 |
| 平均価格 | ¥{stats.get('avg_price', 0):,.0f} |
| 最低価格 | ¥{stats.get('min_price', 0):,} |
| 最高価格 | ¥{stats.get('max_price', 0):,} |

---

## トップ記事（スキ数順）

| 順位 | タイトル | 著者 | スキ | 価格 |
|------|---------|------|------|------|
{top_articles_table}

---

## タイトルパターン分析

{title_patterns}

---

## 価格帯分布

{price_distribution}

---

## 売れ筋の特徴

### 1. タイトルの傾向
- 数字を含むタイトルが多い（「3つの〜」「7日で〜」）
- 具体的なベネフィットを明示
- ターゲットを絞り込んだ表現

### 2. 価格設定の傾向
- 初心者向け: ¥100〜¥500
- 中級者向け: ¥980〜¥2,980
- 専門家向け: ¥4,980〜¥9,800

### 3. コンテンツ構成
- 問題提起 → 解決策 → 具体的手順
- 実体験・事例を豊富に含む
- テンプレート・チェックリストを提供

---

## 推奨アクション

1. **ターゲット明確化**: 誰向けの記事か冒頭で明示する
2. **具体的な数字**: タイトルと本文に具体的な数字を入れる
3. **価格戦略**: 初回は¥500〜¥980で実績を作る
4. **差別化**: 自分だけの経験・視点を強調する

---

*このレポートは note-research スキルにより自動生成されました*
"""
    return report


def generate_user_report(data: Dict[str, Any]) -> str:
    """
    ユーザー別リサーチレポートを生成

    Args:
        data: research_user() の結果

    Returns:
        Markdownレポート
    """
    username = data.get("username", "不明")
    timestamp = data.get("timestamp", datetime.now().isoformat())
    user_info = data.get("user_info", {})
    notes = data.get("notes", [])
    stats = data.get("stats", {})

    # ユーザー基本情報
    name = user_info.get("name", username)
    note_count = user_info.get("note_count", 0)
    follower_count = user_info.get("follower_count", 0)
    profile = user_info.get("profile", "")[:200]

    # トップ記事テーブル
    top_notes = sorted(notes, key=lambda x: x.get("likeCount", 0), reverse=True)[:10]
    top_table_rows = []
    for i, note in enumerate(top_notes, 1):
        title = note.get("name", note.get("title", ""))[:40]
        likes = note.get("likeCount", 0)
        price = note.get("price", 0)
        price_str = f"¥{price:,}" if price > 0 else "無料"
        top_table_rows.append(f"| {i} | {title} | {likes:,} | {price_str} |")

    top_articles_table = "\n".join(top_table_rows) if top_table_rows else "| - | データなし | - | - |"

    # パターン分析
    titles = [n.get("name", n.get("title", "")) for n in notes]
    title_patterns = analyze_title_patterns(titles)

    report = f"""# @{username} ユーザー分析レポート

**調査日**: {timestamp[:10]}
**対象ユーザー**: {name} (@{username})

---

## ユーザー基本情報

| 項目 | 値 |
|------|-----|
| 表示名 | {name} |
| 記事数 | {note_count}件 |
| フォロワー数 | {follower_count:,}人 |
| プロフィール | {profile}... |

---

## 統計情報

| 項目 | 値 |
|------|-----|
| 分析記事数 | {stats.get('total_notes', len(notes))}件 |
| 総スキ数 | {stats.get('total_likes', 0):,} |
| 平均スキ数 | {stats.get('avg_likes', 0):.1f} |
| 有料記事数 | {stats.get('paid_notes', 0)}件 |
| 平均価格 | ¥{stats.get('avg_price', 0):,.0f} |

---

## 人気記事TOP10

| 順位 | タイトル | スキ | 価格 |
|------|---------|------|------|
{top_articles_table}

---

## タイトルパターン分析

{title_patterns}

---

## このユーザーの特徴

### 強み
- フォロワー数: {follower_count:,}人（影響力指標）
- 平均スキ数: {stats.get('avg_likes', 0):.1f}（エンゲージメント）
- 継続性: {note_count}件の記事を公開

### コンテンツスタイル
- タイトルの傾向を分析
- 価格帯の傾向を確認
- 投稿頻度を推定

---

## 参考にすべきポイント

1. **タイトル構造**: このユーザーのタイトルパターンを参考に
2. **価格設定**: 類似ジャンルでの価格帯を確認
3. **構成パターン**: 人気記事の目次構成を分析

---

*このレポートは note-research スキルにより自動生成されました*
"""
    return report


def analyze_title_patterns(titles: List[str]) -> str:
    """タイトルパターンを分析"""
    if not titles:
        return "データなし"

    patterns = {
        "数字を含む": 0,
        "疑問形": 0,
        "方法・やり方": 0,
        "完全・徹底": 0,
        "初心者向け": 0,
        "〜とは": 0,
    }

    for title in titles:
        if re.search(r'\d+', title):
            patterns["数字を含む"] += 1
        if re.search(r'[？?]', title):
            patterns["疑問形"] += 1
        if re.search(r'(方法|やり方|コツ|術)', title):
            patterns["方法・やり方"] += 1
        if re.search(r'(完全|徹底|決定版)', title):
            patterns["完全・徹底"] += 1
        if re.search(r'(初心者|入門|はじめて)', title):
            patterns["初心者向け"] += 1
        if re.search(r'とは', title):
            patterns["〜とは"] += 1

    total = len(titles)
    result_lines = []
    for pattern, count in sorted(patterns.items(), key=lambda x: -x[1]):
        pct = (count / total * 100) if total > 0 else 0
        result_lines.append(f"- **{pattern}**: {count}件（{pct:.1f}%）")

    return "\n".join(result_lines)


def analyze_price_distribution(prices: List[int]) -> str:
    """価格帯分布を分析"""
    if not prices:
        return "有料記事なし"

    ranges = {
        "¥100〜¥499": 0,
        "¥500〜¥999": 0,
        "¥1,000〜¥2,999": 0,
        "¥3,000〜¥4,999": 0,
        "¥5,000以上": 0,
    }

    for price in prices:
        if price < 500:
            ranges["¥100〜¥499"] += 1
        elif price < 1000:
            ranges["¥500〜¥999"] += 1
        elif price < 3000:
            ranges["¥1,000〜¥2,999"] += 1
        elif price < 5000:
            ranges["¥3,000〜¥4,999"] += 1
        else:
            ranges["¥5,000以上"] += 1

    total = len(prices)
    result_lines = []
    for range_name, count in ranges.items():
        pct = (count / total * 100) if total > 0 else 0
        bar = "█" * int(pct / 5)
        result_lines.append(f"- {range_name}: {bar} {count}件（{pct:.1f}%）")

    return "\n".join(result_lines)


def main():
    """CLI エントリーポイント"""
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="note リサーチレポート生成器")
    parser.add_argument("input", help="入力JSONファイル")
    parser.add_argument("--type", "-t", choices=["genre", "user"], required=True,
                        help="レポートタイプ")
    parser.add_argument("--output", "-o", help="出力ファイル")

    args = parser.parse_args()

    # 入力読み込み
    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    # レポート生成
    if args.type == "genre":
        report = generate_genre_report(data)
    else:
        report = generate_user_report(data)

    # 出力
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"[INFO] Report saved to: {args.output}")
    else:
        print(report)


if __name__ == "__main__":
    main()
