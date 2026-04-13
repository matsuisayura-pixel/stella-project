---
name: batch
description: "Use when running large-scale parallel code changes across many files - migrating frameworks, adding types, fixing lint errors, adding tests - by launching dozens of git-worktree-isolated agents that test and create PRs autonomously."
risk: medium
source: taisun
---

# /batch — 並列エージェントチームによる大規模コード変更

Claude Code v2.1.63のネイティブ `/batch` コマンドを活用したスキル。
数十のサブエージェントがgit worktreeで完全分離した環境で並列作業し、テスト・PR作成まで自動化する。

**開始時に宣言する:** "I'm using the batch skill to run parallel agents across isolated worktrees."

---

## いつ使うか

| 向いているタスク | 向いていないタスク |
|----------------|-----------------|
| フレームワーク移行 (Solid → React 等) | ファイル間依存が強い変更 |
| TypeScript strict型の一括追加 | 共有ロジックの設計変更 |
| ESLint/Prettier違反の一括修正 | データベーススキーマ変更 |
| テストの一括追加 | 認証・セキュリティ変更 |
| ファイル単位で独立したリファクタリング | 設定ファイルの変更 |

---

## 事前チェック（MUST）

```bash
# 1. MCPサーバーを5台以下に絞る（コンテキスト保護）
#    .claude/settings.json の disabledMcpServers を確認・更新

# 2. コンテキストが50%超ならコンパクト化
/compact

# 3. .gitignoreに worktrees が含まれているか確認
grep -q "worktrees" .gitignore && echo "OK" || echo ".claude/worktrees/ を .gitignore に追加してください"

# 4. git statusがクリーンであることを確認
git status
```

---

## 使い方

### 基本構文

```
/batch <タスク内容>
```

### 公式使用例（Boris Cherny推奨）

```bash
# フレームワーク移行
/batch migrate src/ from Solid to React

# 型安全性の強化
/batch add TypeScript strict types to src/

# テスト追加
/batch add unit tests to src/utils/

# lint修正
/batch fix ESLint errors in src/
```

### カスタムworktreeワークフロー（/batchなしで同等効果）

エージェントのfrontmatterに `isolation: worktree` を追加するだけで、
同じworktree分離を自前ワークフローに適用できる：

```yaml
# .claude/agents/my-batch-worker.md
---
name: my-batch-worker
model: haiku
isolation: worktree
---
# ここにエージェントの指示を書く
```

---

## /batch の内部動作

```
1. 計画フェーズ
   └─ 対話的にマイグレーション計画を立てる（承認が必要）

2. 並列実行フェーズ
   ├─ Agent 1 → .claude/worktrees/batch-xxxx-1/ (独立ブランチ)
   ├─ Agent 2 → .claude/worktrees/batch-xxxx-2/ (独立ブランチ)
   ├─ Agent N → .claude/worktrees/batch-xxxx-N/ (独立ブランチ)
   └─ 各エージェントがファイル群を担当（互いに干渉しない）

3. テスト・PRフェーズ
   └─ 各エージェントが自分でテスト実行 → 成功したらPR作成
```

---

## worktreeのクリーンアップ

| 状態 | 動作 |
|-----|------|
| 変更なしで終了 | worktreeとブランチは自動削除（ブランチが残る場合あり） |
| 変更・コミットありで終了 | Claudeが「保持するか削除するか」を確認 |

```bash
# 念のため手動確認
git branch | grep batch
git worktree list
```

---

## MCP制限の緊急対応

`/batch` 実行中にコンテキストが逼迫した場合：

```json
// .claude/settings.json に追記して再起動
{
  "disabledMcpServers": [
    "mcp-server-name-1",
    "mcp-server-name-2"
  ]
}
```

> **参考**: 13台のMCPサーバー構成では、ツール定義だけで約82,000トークン
> （コンテキストウィンドウの約41%）を消費した事例がある。
> `/batch` 使用時は **MCP ≤ 5台** を厳守する。

---

## 共有ファイルが絡む場合の対処

各エージェントが同じファイルを変更しようとするとコンフリクトが発生する。

```bash
# コンフリクト解決の流れ
git checkout main
git merge batch-xxxx-1   # まず1つ目をマージ
git merge batch-xxxx-2   # コンフリクトを手動解決
# ...
```

**推奨**: タスク設計時にエージェント間のファイル重複を避ける。
例えばディレクトリ単位でエージェントを割り当てる。

---

## 参照

- Boris Cherny 発表 (2026-02-28): `/simplify` と `/batch` で「エージェントチーム」時代
- Claude Code v2.1.63 GitHub Release Notes
- 公式ドキュメント: `code.claude.com/docs/en/skills`
- taisun_agentv2 AGENTS.md: `isolation: worktree` の適用済みエージェント一覧
