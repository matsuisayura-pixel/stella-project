# URL Learning Pipeline Rules

## Overview

URL分析（url-all / url-deep-analysis）実行後に、自動的にメモリ保存し、
内容がノウハウ・技術の場合はスキル化を提案するパイプライン。

---

## パイプラインフロー

```
URL分析実行（url-all / url-deep-analysis）
  → Phase 1: コンテンツ理解・要約
  → Phase 2: Praetorian compact で自動メモリ保存
  → Phase 3: ノウハウ判定
  → Phase 4: スキル化提案（ノウハウの場合のみ）
  → Phase 5: ユーザー承認後にスキル生成
```

## Phase 1: コンテンツ理解

URL分析スキル（url-all / url-deep-analysis）実行後、以下を抽出:

- サイトのメインコンテンツ（文章・テキスト）
- 技術構造（HTML/CSS/JS構成）
- 主要リンク・ナビゲーション
- コンテンツのカテゴリ判定

## Phase 2: 自動メモリ保存（推奨・任意）

URL分析完了後、Praetorian compact が利用可能であれば保存する:

```
// Praetorian MCP が有効な場合のみ実行（なければスキップしてPhase 3へ）
mcp__praetorian__praetorian_compact({
  type: "web_research",
  title: "{サイト名} - {カテゴリ}",
  source: "{URL}",
  key_insights: [...],        // 主要な発見・ポイント
  findings: [...],            // 詳細な発見
  techniques: {...},          // 技術・パターン（該当する場合）
  recommendations: [...],     // 次のアクション
})
```

> **Note**: Praetorian MCP はオプションです。インストールしていない環境ではこのフェーズをスキップし、Phase 3 に進んでください。

## Phase 3: ノウハウ判定

以下の基準でコンテンツがノウハウ・技術かどうかを判定:

### ノウハウと判定する条件（いずれかに該当）

| カテゴリ | 判定基準 |
|---------|---------|
| 技術記事 | プログラミング、設計パターン、ツール使い方 |
| マーケティング手法 | セールスコピー、LP構成、広告運用テクニック |
| ビジネス戦略 | 営業手法、顧客獲得、成長戦略 |
| ワークフロー | 自動化手順、効率化テクニック、運用ノウハウ |
| デザインパターン | UI/UX手法、レイアウト原則 |

### ノウハウではないもの

- ニュース記事（情報のみ）
- 企業概要・会社情報
- 商品カタログ・価格表
- 利用規約・プライバシーポリシー

## Phase 4: スキル化提案

ノウハウと判定された場合、ユーザーに確認する:

```
AskUserQuestion({
  questions: [{
    question: "この内容をスキル化しますか？",
    header: "スキル化",
    options: [
      { label: "スキル化する", description: "習得した内容を再利用可能なスキルとして保存" },
      { label: "メモリ保存のみ", description: "Praetorianに保存済み。スキル化は不要" }
    ]
  }]
})
```

## Phase 5: スキル生成

ユーザーが「スキル化する」を選択した場合:

1. `/skill-create` スキルを使用してスキルを生成
2. 生成されたスキルの概要をユーザーに報告
3. スキルが正常に作成されたことを確認

## 自動保存するメタデータ

| フィールド | 内容 |
|-----------|------|
| source | 元URL |
| title | サイト名 + カテゴリ |
| type | `web_research` |
| key_insights | 3-5個のキーポイント |
| techniques | 識別されたテクニック/パターン |
| findings | 詳細な発見事項 |
| recommendations | 活用方法の提案 |

## 注意事項

- URL分析は既存のスキル（url-all / url-deep-analysis）を使用
- メモリ保存はPraetorian MCP compact を使用
- スキル化は skill-create スキルを使用
- 各フェーズでエラーが発生しても、前フェーズの結果は保持される
- ユーザーの承認なしにスキル化を実行しない
