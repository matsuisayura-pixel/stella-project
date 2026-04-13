# Git インスペクター スキル

taiyou-mcp-bundleのGitインスペクターツール（15個）を活用するスキルです。

## 使用方法

```
/mcp-git
```

---

## 利用可能なMCPツール

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__git_status` | リポジトリの現在の状態を取得 |
| `mcp__taiyou-mcp__git_branch` | 現在のブランチ情報を取得 |
| `mcp__taiyou-mcp__git_branches` | 全ブランチ一覧を取得 |
| `mcp__taiyou-mcp__git_log` | コミット履歴を取得 |
| `mcp__taiyou-mcp__git_commit_details` | 特定コミットの詳細を取得 |
| `mcp__taiyou-mcp__git_diff` | 変更差分を表示 |
| `mcp__taiyou-mcp__git_blame` | ファイルのブレーム情報を取得 |
| `mcp__taiyou-mcp__git_file_history` | ファイルの変更履歴を取得 |
| `mcp__taiyou-mcp__git_tags` | タグ一覧を取得 |
| `mcp__taiyou-mcp__git_contributors` | 貢献者統計を取得 |
| `mcp__taiyou-mcp__git_stash_list` | スタッシュ一覧を取得 |
| `mcp__taiyou-mcp__git_remote` | リモート情報を取得 |
| `mcp__taiyou-mcp__git_config` | Git設定を取得 |

---

## ユースケース

### 1. リポジトリ状態確認

```
「現在のリポジトリの状態を確認して」

使用ツール:
- mcp__taiyou-mcp__git_status
- mcp__taiyou-mcp__git_branch

出力例:
- 現在のブランチ
- 変更されたファイル
- ステージング状態
- コミット待ちファイル
```

### 2. コミット履歴分析

```
「最近のコミット履歴を見せて」

使用ツール:
- mcp__taiyou-mcp__git_log

パラメータ:
- limit: 表示件数（デフォルト: 10）
- branch: 対象ブランチ

出力例:
- コミットハッシュ
- 作者
- 日時
- コミットメッセージ
```

### 3. 特定コミットの詳細確認

```
「このコミットの詳細を見せて: abc1234」

使用ツール:
- mcp__taiyou-mcp__git_commit_details

パラメータ:
- commit_hash: コミットハッシュ

出力例:
- 変更ファイル一覧
- 追加/削除行数
- 差分内容
```

### 4. ファイル変更履歴の追跡

```
「src/index.tsの変更履歴を見せて」

使用ツール:
- mcp__taiyou-mcp__git_file_history
- mcp__taiyou-mcp__git_blame

パラメータ:
- file_path: ファイルパス

出力例:
- 各行の最終変更者
- 変更日時
- コミット情報
```

### 5. ブランチ管理

```
「全ブランチを一覧表示して」

使用ツール:
- mcp__taiyou-mcp__git_branches

出力例:
- ローカルブランチ
- リモートブランチ
- 現在のブランチ（*マーク）
```

### 6. 差分確認

```
「mainブランチとの差分を見せて」

使用ツール:
- mcp__taiyou-mcp__git_diff

パラメータ:
- target: 比較対象（ブランチ/コミット）

出力例:
- 変更ファイル
- 追加/削除行
- 差分内容
```

### 7. 貢献者分析

```
「このリポジトリの貢献者統計を見せて」

使用ツール:
- mcp__taiyou-mcp__git_contributors

出力例:
- 貢献者名
- コミット数
- 追加/削除行数
- 貢献割合
```

### 8. タグ管理

```
「リリースタグ一覧を見せて」

使用ツール:
- mcp__taiyou-mcp__git_tags

出力例:
- タグ名
- 作成日
- 関連コミット
```

---

## 組み合わせ例

### プロジェクト全体レポート

```
「プロジェクトの全体的な状態をレポートして」

実行順序:
1. git_status - 現在の状態
2. git_branch - ブランチ情報
3. git_log - 最近のコミット
4. git_contributors - 貢献者情報
5. git_tags - リリース情報

出力:
【プロジェクトレポート】
■ 現在のブランチ: main
■ 未コミットの変更: 3ファイル
■ 最新コミット: "feat: 新機能追加" (2時間前)
■ 総コミット数: 156
■ 貢献者数: 3名
■ 最新リリース: v1.2.0
```

### コードレビュー支援

```
「PR用の変更内容をまとめて」

実行順序:
1. git_diff - 変更差分
2. git_log - 関連コミット
3. git_file_history - 変更ファイルの履歴

出力:
【PR変更サマリー】
■ 変更ファイル数: 5
■ 追加行: +120
■ 削除行: -45
■ 関連コミット: 3件
```

---

## 注意事項

```
- リポジトリ外では動作しません
- 大規模リポジトリでは時間がかかる場合があります
- リモート操作（push/pull等）は含まれません（読み取り専用）
```
