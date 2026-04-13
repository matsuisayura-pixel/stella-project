---
name: agent-trace
description: AI code attribution tracking
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
disable-model-invocation: true
---

# Agent Trace - AI生成コード帰属追跡スキル

Agent Trace仕様（v0.1.0）に基づくAI生成コードの帰属追跡・管理スキル。
自動記録されたトレースの確認、統計分析、レポート生成を支援。

## トリガー

以下のキーワードで発動:
- 「トレースを確認」「トレース一覧」「Agent Trace」
- 「AI貢献率」「誰が書いた」「帰属確認」
- 「コード履歴」「編集履歴」
- `/agent-trace`

## 機能概要

```
┌─────────────────────────────────────────────────────────────┐
│  Agent Trace Management                                     │
├─────────────────────────────────────────────────────────────┤
│  📊 統計表示     - AI/人間の貢献率、モデル別統計            │
│  📋 一覧表示     - 最近のトレース一覧                       │
│  🔍 検索        - ファイル別、日付別のトレース検索          │
│  📄 レポート生成 - コンプライアンス用レポート               │
│  🗄️ アーカイブ   - 古いトレースの整理                      │
└─────────────────────────────────────────────────────────────┘
```

## 使用方法

### 統計を確認

```bash
# プロジェクトの統計を表示
node -e "
const { TraceStore } = require('./.claude/lib/trace-store.ts');
const store = new TraceStore(process.cwd());
const stats = store.getStatistics();
console.log(JSON.stringify(stats, null, 2));
"
```

### 最近のトレースを確認

```bash
# 最新10件のトレースを表示
node -e "
const { TraceStore } = require('./.claude/lib/trace-store.ts');
const store = new TraceStore(process.cwd());
const traces = store.list(10);
traces.forEach(t => {
  console.log(\`[\${t.timestamp}] \${t.files.map(f => f.path).join(', ')}\`);
});
"
```

### 特定ファイルのトレースを検索

```bash
# src/api/auth.ts のトレース履歴を表示
node -e "
const { TraceStore } = require('./.claude/lib/trace-store.ts');
const store = new TraceStore(process.cwd());
const traces = store.findByFile('src/api/auth.ts');
console.log(JSON.stringify(traces, null, 2));
"
```

## 自動記録の仕組み

```
┌─────────────────────────────────────────────────────────────┐
│  自動トレース記録フロー                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Claude Code (Edit/Write)                                   │
│       │                                                     │
│       ▼                                                     │
│  PostToolUse Hook                                           │
│  (.claude/hooks/agent-trace-capture.js)                     │
│       │                                                     │
│       ▼                                                     │
│  Trace Record 生成                                          │
│  - ファイルパス                                             │
│  - 貢献者タイプ（ai）                                       │
│  - モデル情報                                               │
│  - タイムスタンプ                                           │
│  - Git commit/branch                                        │
│       │                                                     │
│       ▼                                                     │
│  .agent-trace/traces/*.json に保存                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## トレースレコード構造

```json
{
  "version": "0.1.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-04T12:00:00Z",
  "files": [
    {
      "path": "src/utils/helper.ts",
      "conversations": [
        {
          "contributor_type": "ai",
          "model": "anthropic/claude-opus-4-5-20251101",
          "ranges": [{ "start_line": 1, "end_line": -1 }],
          "description": "Edit: text replacement"
        }
      ]
    }
  ],
  "vcs": {
    "type": "git",
    "commit": "abc123...",
    "branch": "main"
  },
  "tool": {
    "name": "taisun-agent",
    "version": "2.10.1"
  },
  "metadata": {
    "dev.taisun": {
      "hook": "agent-trace-capture",
      "tool_used": "Edit"
    }
  }
}
```

## 貢献者タイプ

| タイプ | コード | 説明 |
|--------|--------|------|
| 人間 | `human` | 人間が直接記述したコード |
| AI | `ai` | AIが生成したコード |
| 混合 | `mixed` | 人間が編集したAIコード |
| 不明 | `unknown` | 起源が不明なコード |

## 除外パターン

以下のファイルはトレース対象外（機密保護）:

- `node_modules/`
- `.git/`
- `.agent-trace/`
- `.env*`
- `secrets/`, `credentials/`
- `*.pem`, `*.key`

## コマンドリファレンス

### /agent-trace stats
プロジェクト全体の統計を表示

### /agent-trace list [count]
最近のトレースを一覧表示（デフォルト: 10件）

### /agent-trace find <file-path>
特定ファイルのトレース履歴を検索

### /agent-trace report
コンプライアンス用のレポートを生成

### /agent-trace archive [days]
指定日数より古いトレースをアーカイブ（デフォルト: 30日）

## ストレージ構造

```
.agent-trace/
├── traces/           # アクティブなトレースファイル
│   ├── 2026-02-04_abc123.json
│   ├── 2026-02-04_def456.json
│   └── ...
└── archive/          # アーカイブ済みトレース
    └── 2026-01-*.json
```

## 関連ドキュメント

- [Agent Trace 公式仕様](https://agent-trace.dev/)
- [Cognition Blog](https://cognition.ai/blog/agent-trace)
- [統合提案書](../../../docs/AGENT_TRACE_INTEGRATION_PROPOSAL.md)

## 技術仕様

- **仕様バージョン**: 0.1.0
- **ライブラリ**: `.claude/lib/trace-store.ts`
- **フック**: `.claude/hooks/agent-trace-capture.js`
- **ストレージ**: ローカルJSON（`.agent-trace/`）

## 将来の拡張予定

- Phase 2: OpenTelemetry統合
- Phase 3: ダッシュボードUI
- Phase 3: Context Graph構築
