---
name: youtube-channel-summary
description: YouTube channel analysis
allowed-tools: Read, Write, Edit, Grep, Glob, WebFetch, WebSearch
disable-model-invocation: true
---

# YouTube Channel Summary Skill

YouTubeチャンネルの動画を分析し、要約を生成するスキル。

## 概要

指定されたYouTubeチャンネルの動画コンテンツを分析し、
主要なテーマ、トピック、コンテンツパターンを要約します。

## 使用場面

- チャンネル分析が必要な時
- 競合分析を行う時
- コンテンツ戦略を立てる時
- 動画のトレンドを把握したい時

## 機能

- チャンネル動画のリスト取得
- 動画タイトル・説明の分析
- 主要トピックの抽出
- コンテンツパターンの特定

## 使用方法

```
/youtube_channel_summary [チャンネルURL or チャンネルID]
```

## 関連ツール

- youtube MCP server
- video-download skill
