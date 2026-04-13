---
name: lp-full-generation
description: Full LP generation with local LLM
version: "1.0.0"
author: TAISUN
category: marketing-generation
tags: [lp, full-generation, local-llm, ollama, rag, chromadb, taiyo-style, pipeline]
dependencies: [taiyo-analyzer, lp-local-generator]
disable-model-invocation: true
---

# LP Full Generation Skill

## Overview

1コマンドで太陽スタイル12セクション全てを自動生成するフルパイプライン。
RAG検索 → Ollama生成 → taiyo-analyzer評価 → 品質保証 → 保存 → ChromaDB追加の完全自動サイクル。

**コスト0円。全てローカル実行。**

## When to Use

```
「フルLPを生成して」
「12セクション全部作って」
「AIエージェントスクールのLP一式を生成」
「/lp-full-generation」
```

## フルLP生成パイプライン

```
┌─────────────────────────────────────────────────────────────────┐
│              Full LP Generation Pipeline                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Phase A: 準備                                                    │
│  ├── 1. パラメータ確認（target, product, tone）                  │
│  ├── 2. Ollama起動確認                                           │
│  └── 3. ChromaDB接続確認                                         │
│                                                                   │
│  Phase B: セクション順次生成（12セクション）                      │
│  ├── headline  → RAG + qwen3:8b  → taiyo-analyzer → 保存        │
│  ├── lead      → RAG + qwen2.5:32b → taiyo-analyzer → 保存      │
│  ├── problem   → RAG + qwen2.5:32b → taiyo-analyzer → 保存      │
│  ├── agitation → RAG + qwen2.5:32b → taiyo-analyzer → 保存      │
│  ├── solution  → RAG + qwen2.5:32b → taiyo-analyzer → 保存      │
│  ├── benefit   → RAG + qwen2.5:32b → taiyo-analyzer → 保存      │
│  ├── bullet    → RAG + qwen3:8b  → taiyo-analyzer → 保存        │
│  ├── proof     → RAG + qwen2.5:32b → taiyo-analyzer → 保存      │
│  ├── story     → RAG + qwen2.5:32b → taiyo-analyzer → 保存      │
│  ├── offer     → RAG + qwen2.5:32b → taiyo-analyzer → 保存      │
│  ├── cta       → RAG + qwen3:8b  → taiyo-analyzer → 保存        │
│  └── ps        → RAG + qwen3:8b  → taiyo-analyzer → 保存        │
│                                                                   │
│  Phase C: 統合・品質保証                                          │
│  ├── 4. 12セクションを結合してフルLP生成                         │
│  ├── 5. taiyo-analyzer 総合評価（目標: 80点以上）                │
│  ├── 6. 低スコアセクションの再生成（70点未満のみ）               │
│  └── 7. 最終スコア確認                                           │
│                                                                   │
│  Phase D: 保存・フィードバック                                    │
│  ├── 8. Obsidian Generated/ に保存                               │
│  ├── 9. ChromaDBに追加（知識ベース拡充）                         │
│  └── 10. 生成レポート出力                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 使用方法

### CLI実行

```bash
# venv有効化
source /Users/matsumototoshihiko/Desktop/開発2026/LP制作2026年2月/.venv/bin/activate

# フルLP生成
python scripts/generate-with-quality.py full \
  --target "副業・起業に興味があるビジネスパーソン" \
  --product "AIエージェント構築スクール" \
  --tone "緊急性と希望を感じさせる太陽スタイル"

# JSON出力
python scripts/generate-with-quality.py full --json

# 保存なし（テスト用）
python scripts/generate-with-quality.py full --no-save
```

### Claude Codeからの実行手順

1. **環境確認**
```bash
source .venv/bin/activate
ollama list
python scripts/chroma-search.py "LP" -n 1  # ChromaDB接続テスト
```

2. **フルLP生成実行（品質自動評価ループ付き）**
```bash
python scripts/generate-with-quality.py full \
  --target "{ターゲット}" \
  --product "{商品名}"
```

   - 各セクション自動生成 → taiyo-score.py で即座にスコアリング
   - 70点未満のセクションは改善ポイント付きで自動再生成（最大2回）
   - 生成完了後、Obsidian Generated/ に自動保存
   - 総合70点以上のLPはChromaDBにも自動追加（フィードバックループ）

## パラメータ

| パラメータ | 必須 | デフォルト | 説明 |
|-----------|------|-----------|------|
| --target | No | 副業・起業に興味があるビジネスパーソン | ターゲット |
| --product | No | AIエージェント構築スクール | 商品・サービス |
| --tone | No | 緊急性と希望を感じさせる太陽スタイル | トーン |
| --model | No | 自動選択 | 全セクション共通モデル上書き |
| --save | No | - | 保存先ファイルパス |
| --json | No | false | JSON形式出力 |

## 品質目標

### taiyo-analyzer スコア目標

| 指標 | 目標 |
|------|------|
| 総合スコア | 80/100 以上 |
| 各セクション最低 | 70/100 以上 |
| ヘッドライン | 85/100 以上 |
| CTA・追伸 | 85/100 以上 |

### 品質保証フロー

```
フルLP生成完了
  │
  ├── 総合スコア 80+ → 合格（保存 + ChromaDB追加）
  │
  └── 総合スコア 80未満
       │
       ├── 70未満セクションを特定
       ├── 改善ポイント付きで個別再生成（最大2回/セクション）
       ├── 再結合
       └── 最終スコア確認
            ├── 80+ → 合格
            └── 80未満 → 警告付きで保存（手動改善推奨）
```

## 出力フォーマット

### Markdown出力

```markdown
---
title: "{product} LP"
target: "{target}"
product: "{product}"
tone: "{tone}"
taiyo_score: XX
generated_date: "YYYY-MM-DD"
models_used:
  - qwen3:8b
  - qwen2.5:32b
rag_sources: [...]
---

# {product} - 太陽スタイルLP

## ヘッドライン（プリヘッド + メインヘッドライン + サブヘッド）

{generated_headline}

## リード文（問題提起 → 共感 → 解決策の予告）

{generated_lead}

...（12セクション全て）...

## 追伸（P.S. - 最後の一押し）

{generated_ps}

---

## 生成レポート
| セクション | モデル | スコア | RAGソース数 |
|-----------|--------|--------|------------|
| headline | qwen3:8b | XX/100 | 3 |
| lead | qwen2.5:32b | XX/100 | 3 |
| ... | ... | ... | ... |
| **総合** | - | **XX/100** | - |
```

## 推定実行時間

| モデル | セクション数 | 推定時間 |
|--------|------------|---------|
| qwen3:8b | 4セクション | 約2-4分 |
| qwen2.5:32b | 8セクション | 約8-16分 |
| **合計** | 12セクション | **約10-20分** |

※ M1/M2 Mac基準。再生成が発生する場合は追加時間。

## 前提条件

- Ollama起動済み（`ollama serve`）
- ChromaDB インデックス済み（1096チャンク/153LP）
- Python venv有効化済み
- 必要モデル: qwen3:8b, qwen2.5:32b
- 十分なメモリ（qwen2.5:32bは約20GB VRAM推奨）

## ファイル構成

```
scripts/
├── ollama-generate.py    # メイン生成スクリプト（full引数対応）
├── chroma-search.py      # RAG検索
└── index-to-chroma.py    # ChromaDBインデックス化（フィードバック用）

output/                    # 生成結果保存先
└── full-lp-YYYYMMDD-HHMMSS.md

~/Documents/ObsidianVaults/LP-Knowledge-System/
└── Generated/             # Obsidian保存先
    └── {product}-{date}-full-lp.md
```

## 関連スキル

- `lp-local-generator` - セクション単位生成（本スキルの基盤）
- `taiyo-analyzer` - 6次元スコアリング（品質評価）
- `taiyo-style-lp` - 太陽スタイルLP設計ガイド
- `lp-analytics` - LP分析・統計スキル
- `lp-analysis` - 既存LP分析
