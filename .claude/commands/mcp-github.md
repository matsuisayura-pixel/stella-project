# GitHub統合 スキル

taiyou-mcp-bundleのGitHub APIツール（18個）を活用するスキルです。

## 使用方法

```
/mcp-github
```

> **注意**: GITHUB_TOKENの設定が必要です

---

## 利用可能なMCPツール

### Issue管理

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__github_issues` | Issue一覧を取得 |
| `mcp__taiyou-mcp__github_issue_details` | Issue詳細を取得 |
| `mcp__taiyou-mcp__github_issue_comments` | Issueコメントを取得 |
| `mcp__taiyou-mcp__github_create_issue` | Issueを作成 |
| `mcp__taiyou-mcp__github_labels` | ラベル一覧を取得 |

### Pull Request管理

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__github_pull_requests` | PR一覧を取得 |
| `mcp__taiyou-mcp__github_pr_details` | PR詳細を取得 |
| `mcp__taiyou-mcp__github_pr_files` | PR変更ファイルを取得 |
| `mcp__taiyou-mcp__github_pr_reviews` | PRレビューを取得 |
| `mcp__taiyou-mcp__github_pr_comments` | PRコメントを取得 |

### リポジトリ情報

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__github_repo_info` | リポジトリ情報を取得 |
| `mcp__taiyou-mcp__github_branches` | ブランチ一覧を取得 |
| `mcp__taiyou-mcp__github_branch_protection` | ブランチ保護設定を取得 |
| `mcp__taiyou-mcp__github_commits` | コミット一覧を取得 |
| `mcp__taiyou-mcp__github_compare` | コミット比較 |

### ワークフロー・リリース

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__github_workflows` | ワークフロー一覧を取得 |
| `mcp__taiyou-mcp__github_workflow_runs` | ワークフロー実行履歴を取得 |
| `mcp__taiyou-mcp__github_releases` | リリース一覧を取得 |

---

## ユースケース

### 1. Issue管理

```
「オープン中のIssueを一覧表示して」

使用ツール:
- mcp__taiyou-mcp__github_issues

パラメータ:
- state: "open"
- labels: (オプション)

出力例:
【オープンIssue一覧】
■ #45: バグ修正: ログイン機能 [bug, P1]
■ #44: 新機能: ダッシュボード [feature, P2]
■ #43: ドキュメント更新 [docs, P3]
合計: 3件
```

### 2. Issue詳細確認

```
「Issue #45の詳細を見せて」

使用ツール:
- mcp__taiyou-mcp__github_issue_details
- mcp__taiyou-mcp__github_issue_comments

パラメータ:
- issue_number: 45

出力例:
【Issue #45】
■ タイトル: バグ修正: ログイン機能
■ 状態: Open
■ 作成者: @username
■ ラベル: bug, P1-High
■ 担当者: @assignee
■ コメント数: 3

■ 説明:
ログイン時にエラーが発生する...

■ 最新コメント:
@user1: 確認しました...
```

### 3. PR一覧・詳細

```
「レビュー待ちのPRを見せて」

使用ツール:
- mcp__taiyou-mcp__github_pull_requests

パラメータ:
- state: "open"

出力例:
【オープンPR一覧】
■ #50: feat: 新機能追加
  - 作成者: @developer
  - ブランチ: feature/new-feature → main
  - レビュー: 0/2 approved
  - CI: ✓ passing

■ #49: fix: バグ修正
  - 作成者: @developer2
  - レビュー: 1/2 approved
  - CI: ✓ passing
```

### 4. PR変更内容の確認

```
「PR #50の変更ファイルを見せて」

使用ツール:
- mcp__taiyou-mcp__github_pr_files
- mcp__taiyou-mcp__github_pr_details

パラメータ:
- pr_number: 50

出力例:
【PR #50 変更ファイル】
■ 追加: 3ファイル
■ 変更: 5ファイル
■ 削除: 1ファイル

ファイル一覧:
+ src/components/NewFeature.tsx (+120)
M src/App.tsx (+15, -3)
M src/routes.ts (+5, -0)
...
```

### 5. ワークフロー実行状況

```
「最近のCI/CD実行状況を見せて」

使用ツール:
- mcp__taiyou-mcp__github_workflow_runs

出力例:
【ワークフロー実行履歴】
■ CI/CD Pipeline
  - #234: ✓ success (main, 10分前)
  - #233: ✓ success (feature/xxx, 1時間前)
  - #232: ✗ failure (fix/yyy, 2時間前)

■ Deploy
  - #45: ✓ success (main, 30分前)
```

### 6. リリース情報

```
「最新のリリース情報を見せて」

使用ツール:
- mcp__taiyou-mcp__github_releases

出力例:
【リリース一覧】
■ v2.1.0 (latest) - 2024-01-15
  - 新機能: ダッシュボード追加
  - バグ修正: 5件

■ v2.0.0 - 2024-01-01
  - メジャーアップデート
  - 破壊的変更あり
```

### 7. ブランチ比較

```
「mainとdevelopの差分を比較して」

使用ツール:
- mcp__taiyou-mcp__github_compare

パラメータ:
- base: "main"
- head: "develop"

出力例:
【ブランチ比較: main...develop】
■ コミット数: 15
■ 変更ファイル: 23
■ 追加行: +450
■ 削除行: -120

■ 主なコミット:
- feat: 新機能A
- feat: 新機能B
- fix: バグ修正
```

---

## 組み合わせ例

### プロジェクト進捗レポート

```
「プロジェクトの進捗状況をレポートして」

実行順序:
1. github_repo_info - 基本情報
2. github_issues (open) - オープンIssue
3. github_pull_requests (open) - オープンPR
4. github_workflow_runs - CI状況
5. github_releases - リリース情報

出力:
━━━━━━━━━━━━━━━━━━━━
【プロジェクト進捗レポート】
━━━━━━━━━━━━━━━━━━━━

■ リポジトリ: owner/repo
  スター: 156 ⭐
  フォーク: 23

■ Issue状況
  オープン: 12件
  - P1 (Critical): 2件
  - P2 (High): 5件
  - P3 (Medium): 5件

■ PR状況
  オープン: 4件
  - レビュー待ち: 2件
  - 承認済み: 2件

■ CI/CD
  最新: ✓ success
  成功率: 95%

■ 最新リリース
  v2.1.0 (3日前)
━━━━━━━━━━━━━━━━━━━━
```

### Issue作成支援

```
「バグ報告のIssueを作成して」

使用ツール:
- mcp__taiyou-mcp__github_labels (ラベル確認)
- mcp__taiyou-mcp__github_create_issue

パラメータ:
- title: "Bug: ..."
- body: "## 概要\n..."
- labels: ["bug", "P1"]
```

---

## 環境設定

```bash
# GITHUB_TOKENの設定が必要
# .mcp.json を編集

{
  "mcpServers": {
    "taiyou-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "taiyou-mcp-bundle"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

---

## 注意事項

```
- GITHUB_TOKENが必要です
- レート制限に注意（5000リクエスト/時間）
- プライベートリポジトリはトークンのスコープが必要
- 書き込み操作には適切な権限が必要
```
