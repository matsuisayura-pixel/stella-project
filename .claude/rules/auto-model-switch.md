# LLM Auto-Switch Rules

## Overview

サブエージェント（Task tool）起動時に、hookが書き出した推奨モデルを自動適用する。
切替を行った場合は毎回報告するが、作業は止めない。

---

## 自動切替の仕組み

```
UserPromptSubmit hook
  → model-auto-switch.js が入力を解析
  → .claude/hooks/data/model-recommendation.json に推奨モデルを書き出し
  → AIがTask tool起動時にこのファイルを参照
  → model パラメータを自動設定
```

## 推奨モデル参照ルール（MANDATORY）

### Task tool 起動時

サブエージェントを起動する際、以下の手順で model パラメータを決定する:

1. `.claude/hooks/data/model-recommendation.json` を参照
2. `taskModel` フィールドの値を Task tool の `model` パラメータに設定
3. 切替が発生した場合（前回と異なるモデル）、ユーザーに1行で報告

### 推奨モデルマッピング

| recommendation.json の taskModel | Task tool の model |
|----------------------------------|-------------------|
| `haiku` | `"haiku"` |
| `sonnet` | `"sonnet"` |
| `opus` | `"opus"` |

### 報告フォーマット

切替時の報告（作業を止めずに1行で）:
```
[Auto-Switch] {complexity} -> {model} (信頼度{confidence}%)
```

## 複雑度→モデル対応表

| 複雑度 | モデル | 用途 |
|--------|--------|------|
| trivial | haiku | 挨拶・確認・単純応答 |
| simple | haiku | 検索・一覧表示・状況確認 |
| moderate | sonnet | ファイル修正・関数追加・テスト作成 |
| complex | sonnet | 新機能実装・API構築・マルチファイル変更 |
| expert | opus | アーキテクチャ設計・セキュリティ監査・大規模リファクタリング |

## 例外ルール

- recommendation.json が存在しない場合: `sonnet` をデフォルトとする
- ファイル読み取りエラーの場合: `sonnet` をデフォルトとする
- ユーザーが明示的にモデルを指定した場合: ユーザー指定を優先
- 予算超過（BudgetStatus.isOverBudget）の場合: `haiku` にフォールバック

## 注意事項

- この自動切替はサブエージェント（Task tool）にのみ適用
- メインセッションのモデルは変更しない（Claude Code の制約）
- hookは非ブロッキング（stderr出力のみ、exit 0固定）
