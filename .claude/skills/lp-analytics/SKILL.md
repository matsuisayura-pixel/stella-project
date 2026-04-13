---
name: lp-analytics
description: LP knowledge base analytics
version: "1.0.0"
author: TAISUN
category: marketing-analysis
tags: [lp, analytics, chromadb, obsidian, patterns, statistics]
dependencies: [taiyo-analyzer]
disable-model-invocation: true
---

# LP Analytics Skill

## Overview

LP知識ベース（ChromaDB 1096チャンク / Obsidian 153ファイル）を統計分析し、
高品質LPの共通パターン抽出、カバレッジギャップ分析、次回生成の推奨を行う。

## When to Use

```
「LP知識ベースの統計を見せて」
「高スコアLPの共通パターンは？」
「不足しているLPパターンを特定して」
「次に何を生成すべき？」
「/lp-analytics」
```

## 分析機能

### 1. カテゴリ別統計

ChromaDBとObsidian vaultの統計を集計:

```bash
# ChromaDBの統計
source .venv/bin/activate
python -c "
import chromadb
client = chromadb.PersistentClient(path='.chroma')
col = client.get_collection('lp_patterns')
print(f'Total chunks: {col.count()}')

# カテゴリ別集計
results = col.get(include=['metadatas'])
categories = {}
for meta in results['metadatas']:
    cat = meta.get('category', 'unknown')
    categories[cat] = categories.get(cat, 0) + 1
for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {count} chunks')
"
```

### 2. 高スコアパターン共通要素抽出

taiyo-analyzerスコアが80+のLPから共通要素を抽出:

**分析観点**:
- 語尾パターン比率の共通傾向
- 高頻度キラーワードTOP10
- 心理トリガーの配置パターン
- 文章リズム（短文/中文/長文比率）
- ストーリー構造の型
- セクション構成の順序

**実行方法**:
```bash
# 高スコアLPを検索
python scripts/chroma-search.py "高成約 太陽スタイル" -n 10 --json | \
  python -c "
import sys, json
data = json.load(sys.stdin)
for r in data:
    score = r['metadata'].get('taiyo_score', 'N/A')
    title = r['metadata'].get('title', 'N/A')
    print(f'{score}: {title}')
"
```

### 3. カバレッジギャップ分析

太陽スタイル12セクション x パターンバリエーションのカバレッジ:

| セクション | 既存パターン数 | 目標 | ギャップ |
|-----------|--------------|------|---------|
| headline | ? | 20+ | ? |
| lead | ? | 10+ | ? |
| problem | ? | 10+ | ? |
| agitation | ? | 10+ | ? |
| solution | ? | 10+ | ? |
| benefit | ? | 10+ | ? |
| bullet | ? | 15+ | ? |
| proof | ? | 10+ | ? |
| story | ? | 5+ | ? |
| offer | ? | 10+ | ? |
| cta | ? | 15+ | ? |
| ps | ? | 10+ | ? |

**実行方法**:
```bash
python scripts/chroma-search.py "ヘッドライン キャッチコピー" -n 20 --json | python -c "import sys,json; print(len(json.load(sys.stdin)))"
```

### 4. 推奨次回生成内容

ギャップ分析結果から、次に生成すべきLPセクション・パターンを提案:

**提案ロジック**:
1. カバレッジが最も低いセクションを優先
2. 高スコアパターンが少ないカテゴリを優先
3. 最近のCase Studiesで発見された新パターンを反映
4. ターゲットバリエーションの多様化

### 5. トレンド分析

Case-Studies/の収集データから:
- 最新LP業界トレンド
- 新しい心理トリガーの発見
- 競合LPの変化検知

## 出力フォーマット

```markdown
# LP Analytics Report - YYYY-MM-DD

## Knowledge Base Overview
- Total Files: 153
- Total Chunks: 1096
- Categories: 11
- Generated LPs: X

## Category Distribution
| Category | Files | Chunks | Avg Score |
|----------|-------|--------|-----------|
| ... | ... | ... | ... |

## Top 5 High-Score Patterns
1. [Score] Title - Category
2. ...

## Coverage Gaps (Priority Order)
1. **[HIGH]** headline - 5 more variations needed
2. **[MED]** cta - 3 more variations needed
3. ...

## Recommended Next Generation
1. Generate 5 headline variations (ポジティブ型)
2. Generate 3 CTA patterns (緊急性重視)
3. ...

## Trends from Case Studies
- [Trend 1]
- [Trend 2]
```

## 前提条件

- ChromaDB インデックス済み
- Obsidian Dataviewプラグイン（ダッシュボード用）
- Python venv有効化

## 関連スキル

- `taiyo-analyzer` - スコアリング
- `lp-local-generator` - セクション生成
- `lp-full-generation` - フルLP生成
- `lp-analysis` - 既存LP分析
