---
name: voice-ai
description: Voice AI phone call orchestration
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
disable-model-invocation: true
---

# Voice AI スキル

## Overview

Twilio + OpenAI Realtime APIを統合した音声対話AI。
電話の発信・受信・リアルタイム会話を自動化。

## When to Use

- アウトバウンドコール自動化
- インバウンドコール対応（IVR代替）
- リアルタイム音声AI会話
- SMS送信・ボイスメッセージ
- 音声一斉配信（ブロードキャスト）

## Architecture

```
電話着信 → Twilio → TwiML(WebSocket) → MediaStream(g711_ulaw)
                                              ↕ bridge
                    OpenAI Realtime API ← WebSocket(g711_ulaw)
                          ↓
                    AI応答音声 → Twilio → 電話発信者
```

## Required MCP

- `voice-ai`: Voice AI MCP Server

## Required Environment Variables

- `TWILIO_ACCOUNT_SID`: Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Twilio Auth Token
- `TWILIO_PHONE_NUMBER`: Twilio電話番号
- `OPENAI_REALTIME_API_KEY`: OpenAI Realtime API Key
- `WEBHOOK_BASE_URL`: Webhook受信用ベースURL

## Available Tools

| Tool | Description |
|------|-------------|
| `voice_make_call` | アウトバウンドコール発信 |
| `voice_end_call` | コール終了 |
| `voice_get_call_status` | コール状態取得 |
| `voice_list_active_calls` | アクティブコール一覧 |
| `voice_send_sms` | SMS送信 |
| `voice_send_voice_message` | ボイスメッセージ送信 |
| `voice_broadcast` | 音声一斉配信 |
| `voice_start_realtime_session` | OpenAI Realtimeセッション開始 |
| `voice_configure_session` | セッション設定変更 |
| `voice_get_conversation_log` | 会話ログ取得 |
| `voice_health_check` | ヘルスチェック |

## Usage Examples

### アウトバウンドコール
```
voice_make_call:
  to: "+819012345678"
  prompt: "お客様への新商品ご案内です。丁寧な日本語で対応してください。"
  voice_config:
    voice: "shimmer"
    language: "ja"
```

### リアルタイム会話セッション
```
voice_start_realtime_session:
  systemPrompt: "あなたはカスタマーサポート担当です。商品についての質問に回答してください。"
  voice: "alloy"
  tools:
    - name: "check_order_status"
      description: "注文状況を確認する"
```

### SMS送信
```
voice_send_sms:
  to: "+819012345678"
  body: "面談のご予約ありがとうございます。明日14時にお待ちしております。"
```

## Workflow Integration

- `/workflow-start voice_ai_v1` でVoice AIワークフロー開始
- AI SDRスキルと連携してフォローアップコール自動化

## Related Skills

- `ai-sdr`: 自律営業パイプライン（Voice AI連携あり）
- `line-marketing`: LINEメッセージング
- `sales-systems`: セールスシステム設計
