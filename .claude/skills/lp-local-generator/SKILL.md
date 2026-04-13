---
name: lp-local-generator
description: Local LLM LP section generator
version: "1.0.0"
author: TAISUN
category: marketing-generation
tags: [lp, local-llm, ollama, rag, chromadb, taiyo-style, generation]
dependencies: [taiyo-analyzer]
disable-model-invocation: true
---

# LP Local Generator Skill

## Overview

ChromaDB（1096チャンク/153LP）からRAG検索し、Ollama（qwen3:8b / qwen2.5:32b）でLPセクションを生成。
taiyo-analyzerで70点以上を確認し、未達なら改善ポイント付きで再生成する自動品質保証パイプライン。

**全てローカル実行、API費用0円。**

## When to Use

```
「ローカルLLMでLPのヘッドラインを生成して」
「RAG検索してLPのリード文を作って」
「Ollamaでbulletセクションを生成」
「/lp-local-generator headline」
```

## 対応セクション（太陽スタイル12セクション）

| # | セクションキー | 内容 | 使用モデル |
|---|--------------|------|-----------|
| 1 | headline | プリヘッド + メインヘッドライン + サブヘッド | qwen3:8b |
| 2 | lead | 問題提起 → 共感 → 解決策の予告 | qwen2.5:32b |
| 3 | problem | 読者の悩み・痛みを具体的に描写 | qwen2.5:32b |
| 4 | agitation | このまま放置したらどうなるか | qwen2.5:32b |
| 5 | solution | 商品・サービスの紹介 | qwen2.5:32b |
| 6 | benefit | 得られる未来、変化 | qwen2.5:32b |
| 7 | bullet | 特徴→ベネフィット変換の箇条書き | qwen3:8b |
| 8 | proof | お客様の声、数字、権威性 | qwen2.5:32b |
| 9 | story | 開発者・講師の物語 | qwen2.5:32b |
| 10 | offer | 価格、特典、保証 | qwen2.5:32b |
| 11 | cta | 行動喚起 - 今すぐ申し込むべき理由 | qwen3:8b |
| 12 | ps | 追伸 - 最後の一押し | qwen3:8b |

## 実行フロー

```
┌─────────────────────────────────────────────────────────────┐
│                LP Local Generator Pipeline                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. 入力パラメータ確認                                        │
│     └── section, target, product, tone                       │
│                                                               │
│  2. RAG検索（ChromaDB）                                       │
│     └── scripts/chroma-search.py --rag                       │
│     └── 関連LP 3件を取得                                     │
│                                                               │
│  3. プロンプト構築                                             │
│     └── 太陽スタイルテンプレート + RAGコンテキスト             │
│                                                               │
│  4. Ollama生成                                                │
│     └── scripts/ollama-generate.py {section}                 │
│     └── モデル自動選択（短文→qwen3:8b / 長文→qwen2.5:32b） │
│                                                               │
│  5. taiyo-analyzer 品質評価                                   │
│     └── 6次元スコアリング（語尾/キラーワード/心理トリガー等） │
│     └── 70点未満 → 改善ポイント付きで再生成（最大2回）       │
│                                                               │
│  6. 結果保存                                                  │
│     └── Obsidian Generated/ に保存                           │
│     └── ChromaDBに追加（フィードバックループ）                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 使用方法

### CLI実行

```bash
# venv有効化
source /Users/matsumototoshihiko/Desktop/開発2026/LP制作2026年2月/.venv/bin/activate

# セクション単位で生成
python scripts/ollama-generate.py headline \
  --target "副業・起業に興味があるビジネスパーソン" \
  --product "AIエージェント構築スクール" \
  --tone "緊急性と希望を感じさせる太陽スタイル"

# JSON出力
python scripts/ollama-generate.py lead --json

# ファイル保存
python scripts/ollama-generate.py bullet --save output/bullet.md
```

### Claude Codeからの実行手順

1. **venv有効化 + Ollama起動確認**
```bash
source .venv/bin/activate
ollama list  # モデル確認
```

2. **RAG検索テスト**
```bash
python scripts/chroma-search.py "ヘッドライン 緊急性" -n 3 --rag
```

3. **セクション生成**
```bash
python scripts/ollama-generate.py headline --json
```

4. **taiyo-analyzer評価**
   - 生成結果をtaiyo-analyzerスキルに渡してスコアリング
   - 70点未満の場合: 改善ポイントをプロンプトに追加して再生成

5. **結果保存**
   - Obsidian vault: `~/Documents/ObsidianVaults/LP-Knowledge-System/Generated/`
   - ChromaDBにも追加（知識ベース拡充）

## パラメータ

| パラメータ | 必須 | デフォルト | 説明 |
|-----------|------|-----------|------|
| section | Yes | headline | 生成するセクション（上記12種） |
| --target | No | 副業・起業に興味があるビジネスパーソン | ターゲット |
| --product | No | AIエージェント構築スクール | 商品・サービス |
| --tone | No | 緊急性と希望を感じさせる太陽スタイル | トーン |
| --model | No | 自動選択 | 使用モデル上書き |
| --json | No | false | JSON形式出力 |
| --save | No | - | 保存先ファイルパス |

## 品質基準

### taiyo-analyzerスコア目標
| セクション | 最低スコア | 目標スコア |
|-----------|----------|----------|
| headline | 70 | 85+ |
| lead, problem, agitation | 70 | 80+ |
| solution, benefit | 70 | 80+ |
| bullet, cta, ps | 70 | 85+ |
| proof, story, offer | 70 | 75+ |

### 再生成ロジック
```
生成 → taiyo-analyzer評価
  ├── 70点以上 → OK（保存）
  └── 70点未満 → 改善ポイント抽出
       └── 再生成（改善指示付きプロンプト）
            ├── 70点以上 → OK（保存）
            └── 70点未満 → 2回目再生成
                 └── 結果をそのまま保存（警告付き）
```

## 前提条件

- Ollama起動済み（`ollama serve`）
- ChromaDB インデックス済み（1096チャンク）
- Python venv有効化済み
- 必要モデル: qwen3:8b, qwen2.5:32b

## ファイル構成

```
scripts/
├── ollama-generate.py    # Ollama API ラッパー + RAG統合
├── chroma-search.py      # ChromaDB 検索ユーティリティ
└── index-to-chroma.py    # ChromaDB インデックス化
```

## 関連スキル

- `taiyo-analyzer` - 6次元スコアリング（品質評価に使用）
- `taiyo-style-lp` - 太陽スタイルLP設計ガイド
- `lp-full-generation` - 12セクション一括生成
- `lp-analysis` - 既存LP分析
