---
name: ai-sdr
description: Autonomous AI sales pipeline
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
disable-model-invocation: true
---

# AI SDR スキル

## Overview

自律型営業AI（Sales Development Representative）。
リード取込→スコアリング→マルチチャネルアウトリーチ→フォローアップを自動化。

## When to Use

- リード取込・管理（CSV/APIインポート）
- 4次元リードスコアリング
- マルチチャネルアウトリーチ（LINE > Email > SMS > Voice）
- フォローアップシーケンス自動化
- セールスパイプライン管理・分析

## Pipeline

```
Discovery → Qualification → Outreach → Follow-up → Meeting → Analytics
    ↓            ↓              ↓           ↓          ↓         ↓
  リード取込  4次元スコア  LINE優先送信  自動追客  Cal.com連携  KPI集計
```

## Lead Scoring (4 Dimensions)

| Dimension | Weight | Signals |
|-----------|--------|---------|
| Demographic | 20% | 業種, 役職, 企業規模 |
| Behavioral | 35% | ページ閲覧, DL, セミナー参加 |
| Engagement | 25% | メール開封, LINE反応, 返信 |
| Intent | 20% | 価格ページ閲覧, 資料請求, 問合せ |

**Score Ranks**: HOT (80+) / WARM (50-79) / COLD (20-49) / DISQUALIFIED (<20)

## Multi-Channel Strategy

```
1st: LINE（開封率80%）→ 未反応72h
2nd: Email（リッチコンテンツ）→ 未反応72h
3rd: SMS（緊急性）→ 未反応48h
4th: Voice AI 自動架電（voice-aiスキル連携）
```

## Required MCP

- `ai-sdr`: AI SDR MCP Server

## Available Tools

| Category | Tool | Description |
|----------|------|-------------|
| Lead | `sdr_lead_import` | CSV/APIからリード取込 |
| Lead | `sdr_lead_search` | 条件検索 |
| Lead | `sdr_lead_update` | リード情報更新 |
| Lead | `sdr_lead_get_profile` | 詳細プロフィール |
| Score | `sdr_score_lead` | 単体スコアリング |
| Score | `sdr_score_bulk` | 一括スコアリング |
| Outreach | `sdr_compose_message` | メッセージ作成 |
| Outreach | `sdr_send_outreach` | 送信実行 |
| Outreach | `sdr_schedule_followup` | フォローアップ予約 |
| Sequence | `sdr_create_sequence` | シーケンス定義 |
| Sequence | `sdr_get_sequence_status` | 進捗確認 |
| Pipeline | `sdr_get_pipeline` | ファネル全体表示 |
| Pipeline | `sdr_update_pipeline_stage` | ステージ遷移 |
| Analytics | `sdr_get_analytics` | KPIダッシュボード |

## Usage Examples

### リード取込
```
sdr_lead_import:
  source: "csv"
  data: |
    name,email,phone,company,industry,jobTitle
    田中太郎,tanaka@example.com,09012345678,株式会社ABC,IT,部長
    佐藤花子,sato@example.com,09087654321,株式会社XYZ,製造,課長
```

### スコアリング
```
sdr_score_lead:
  leadId: "lead_001"

# → { total: 72, demographic: 65, behavioral: 80, engagement: 75, intent: 60, rank: "WARM" }
```

### シーケンス作成
```
sdr_create_sequence:
  name: "新規リード初回アプローチ"
  steps:
    - order: 1
      channel: "line"
      delayHours: 0
      template: "initial_greeting"
    - order: 2
      channel: "email"
      delayHours: 72
      template: "value_proposition"
    - order: 3
      channel: "sms"
      delayHours: 144
      template: "urgency_reminder"
    - order: 4
      channel: "voice"
      delayHours: 192
```

## Workflow Integration

- `/workflow-start sdr_pipeline_v1` でSDRパイプラインワークフロー開始
- Voice AIスキルと連携してフォローアップコール自動化

## Related Skills

- `voice-ai`: 電話+会話AI（第4チャネル）
- `lead-scoring`: リード評価・分類
- `outreach-composer`: マルチチャネルメッセージ作成
- `line-marketing`: LINE配信
- `taiyo-style-sales-letter`: セールスレター
