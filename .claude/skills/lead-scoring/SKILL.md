---
name: lead-scoring
description: 4D lead scoring and qualification
allowed-tools: Read, Write, Edit, Grep, Glob
disable-model-invocation: true
---

# Lead Scoring スキル

## Overview

4次元リードスコアリングエンジン。
Demographic/Behavioral/Engagement/Intentの4軸でリードを定量評価。

## When to Use

- リードの質を数値評価したい
- HOT/WARM/COLD/DISQUALIFIEDの分類
- 一括スコアリングでリスト整理
- スコアリングルールのカスタマイズ

## Scoring Dimensions

| Dimension | Weight | Score Range | Signals |
|-----------|--------|-------------|---------|
| Demographic | 20% | 0-100 | 業種マッチ(+30), 決裁者(+25), 企業規模(+20) |
| Behavioral | 35% | 0-100 | ページ閲覧(+10/page), DL(+20), セミナー(+25) |
| Engagement | 25% | 0-100 | メール開封(+15), LINE反応(+20), 返信(+30) |
| Intent | 20% | 0-100 | 価格ページ(+30), 資料請求(+25), 問合せ(+35) |

## Score Ranks

| Rank | Score | Action |
|------|-------|--------|
| HOT | 80+ | 即座にアプローチ |
| WARM | 50-79 | ナーチャリング継続 |
| COLD | 20-49 | 長期育成 |
| DISQUALIFIED | <20 | 対象外 |

## Required MCP

- `ai-sdr`: AI SDR MCP Server

## Available Tools

| Tool | Description |
|------|-------------|
| `sdr_score_lead` | 単体リードスコアリング |
| `sdr_score_bulk` | 一括スコアリング |

## Usage Examples

### 単体スコアリング
```
sdr_score_lead:
  leadId: "lead_001"
```

### 一括スコアリング
```
sdr_score_bulk:
  leadIds: ["lead_001", "lead_002", "lead_003"]
```

## Related Skills

- `ai-sdr`: 自律営業パイプライン全体
- `outreach-composer`: メッセージ作成
