---
name: outreach-composer
description: Multi-channel outreach messages
allowed-tools: Read, Write, Edit, Grep, Glob
disable-model-invocation: true
---

# Outreach Composer スキル

## Overview

リード情報に基づくパーソナライズされたマルチチャネルメッセージ生成。
LINE > Email > SMS > Voice の優先順位でチャネルルーティング。

## When to Use

- リード向けパーソナライズメッセージ作成
- マルチチャネルシーケンス設計
- フォローアップメッセージ自動生成
- テンプレートベースのメッセージカスタマイズ

## Channel Priority

| Priority | Channel | Open Rate | Use Case |
|----------|---------|-----------|----------|
| 1st | LINE | 80% | 初回アプローチ |
| 2nd | Email | 20-30% | リッチコンテンツ |
| 3rd | SMS | 90%+ | 緊急性・リマインダー |
| 4th | Voice | N/A | 最終フォローアップ |

## Required MCP

- `ai-sdr`: AI SDR MCP Server

## Available Tools

| Tool | Description |
|------|-------------|
| `sdr_compose_message` | メッセージ作成 |
| `sdr_send_outreach` | 送信実行 |
| `sdr_schedule_followup` | フォローアップ予約 |
| `sdr_create_sequence` | シーケンス定義 |
| `sdr_get_sequence_status` | 進捗確認 |

## Usage Examples

### メッセージ作成
```
sdr_compose_message:
  leadId: "lead_001"
  channel: "line"
  template: "initial_greeting"
```

### フォローアップスケジュール
```
sdr_schedule_followup:
  leadId: "lead_001"
  channel: "email"
  delayHours: 72
  message: "先日のセミナーご参加ありがとうございました。"
```

## Related Skills

- `ai-sdr`: 自律営業パイプライン全体
- `lead-scoring`: リードスコアリング
- `taiyo-style-sales-letter`: セールスレター作成
- `line-marketing`: LINE配信
