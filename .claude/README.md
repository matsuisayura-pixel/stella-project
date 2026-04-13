# TAISUN Guard Architecture

このリポジトリでは、Claude Code の hooks + state + lint/CI により
「論理逸脱（Stepスキップ / 入力すり替え / 既存無視）」を実行不能化する。

## 目的

- ユーザー意図と実行内容の乖離を防ぐ（契約・証跡・ゲート）
- 定義ミスでガードが無効化される事故を防ぐ（lint + hard gate）

## 防御レイヤー（概要）

1. Intent Contract First（契約が無ければ危険操作禁止）
2. Deterministic Reference Analyzer（sha256/寸法/特徴量で捏造防止）
3. Evidence Auto Capture（自己申告に依存しない証跡収集）
4. Step/Phase Transition Gate（遷移はゲート経由のみ）
5. Reference Provenance Guard（参照すり替えブロック）
6. Read-before-Create + Decision（既存無視の新規作成防止）
7. Definition Lint Hard Gate（誤定義のままstart/resume禁止）
8. Large Output Sink（大出力はmemory_addへ退避）

## コンテキスト最適化 (v2.16.0)

セッション開始時のコンテキスト消費を大幅に削減：

| 項目 | Before | After | 削減 |
|------|--------|-------|------|
| プロジェクト skills | 110 | 43 | -67 |
| プロジェクト commands | 107 | 9 | -98 |
| グローバル skills | 58 | 0 | -58 |
| グローバル commands | 24 | 0 | -24 |
| グローバル MCP | 7 | 4 | -3 |

削除したMCPサーバー: filesystem（Read/Write/Globで代替）、pixabay（pexelsと重複）、puppeteer（playwrightと重複）

アーカイブ先:
- `backup-skills-archived/` — プロジェクトskills
- `backup-commands-archived/` — プロジェクトcommands
- `~/backup-global-skills-archived/` — グローバルskills
- `~/backup-global-commands-archived/` — グローバルcommands

## 実行設定

- 実行に必要な設定は `.claude/settings.json`（純JSON）にのみ置く
- 設計/運用仕様は `docs/taisun_master_guard_spec.yaml` をSingle Source of Truthとする

## 運用ルール（必須）

- 作業開始前に `npm run guard:verify` を実行し、PASSまで作業開始禁止
- hooks/state/validator を触る場合は、必ず direct test を追加する
