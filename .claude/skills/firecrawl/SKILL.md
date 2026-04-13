# firecrawl - Webスクレイピング・クロール・構造分析

## 使い方

```
/firecrawl
/firecrawl --mode=scrape --url=https://example.com
/firecrawl --mode=crawl --url=https://example.com
/firecrawl --mode=map --url=https://example.com
/firecrawl --mode=search --query=キーワード
```

## 概要

Firecrawl MCPを使用してウェブサイトのスクレイピング、全ページクロール、
URL収集、サイト構造分析、コンテンツ抽出を行うスキル。

## モード一覧

| モード | コマンド | 用途 |
|--------|---------|------|
| scrape | `--mode=scrape` | 単一URLのコンテンツ抽出 |
| crawl | `--mode=crawl` | サイト全体のクロール |
| map | `--mode=map` | サイト内の全URL収集 |
| search | `--mode=search` | Web検索 + コンテンツ取得 |
| agent | `--mode=agent` | 自然言語でウェブ調査 |

## 手順

### 前提条件

Firecrawl MCPが利用可能であること（`.mcp.json`に登録済み）。
`FIRECRAWL_API_KEY`が`.env`に設定されていること。

### 1. モード判定

ARGUMENTSから`--mode`と`--url`または`--query`を抽出する。
指定なしの場合はユーザーに確認する。

### 2. scrapeモード（単一ページ抽出）

URLから本文テキストをMarkdown形式で抽出する。

```
mcp__firecrawl__firecrawl_scrape を使用:
- url: 対象URL
- formats: ["markdown"]
- onlyMainContent: true  ← ナビ・フッターを除外
```

出力形式:
- タイトル
- メタディスクリプション
- 本文（Markdown）
- 文字数

### 3. crawlモード（全サイトクロール）

サイト全体を再帰的にクロールしてコンテンツを収集する。

```
mcp__firecrawl__firecrawl_crawl を使用:
- url: 起点URL
- limit: 50（デフォルト。大規模サイトは100以上）
- formats: ["markdown"]
```

出力形式:
- クロール済みページ数
- 各ページのURL + タイトル + 要約
- 全体サマリー

### 4. mapモード（URL全量収集）

サイト内の全URLを高速に収集してリスト化する。

```
mcp__firecrawl__firecrawl_map を使用:
- url: 起点URL
- includeSubdomains: false
```

出力形式:
- URL一覧（総数）
- カテゴリ別分類（/blog/, /product/, /about/ 等）
- サイト構造ツリー

### 5. searchモード（Web検索）

キーワードでWeb検索し、上位ページのコンテンツを取得する。

```
mcp__firecrawl__firecrawl_search を使用:
- query: 検索キーワード
- limit: 5
- scrapeOptions: { formats: ["markdown"] }
```

出力形式:
- 検索結果一覧
- 各ページの要約
- 参考URL

### 6. agentモード（自然言語ウェブ調査）

自然言語のプロンプトでウェブから情報を収集する。

```
mcp__firecrawl__firecrawl_generate_llmstxt または
mcp__firecrawl__firecrawl_deep_research を使用:
- prompt: 調査したい内容を自然言語で記述
```

### 7. 結果の保存（オプション）

大規模クロールの結果は`research/runs/`に保存することを推奨:

```
research/runs/YYYYMMDD__firecrawl-<slug>/
├── map.json        # URL一覧
├── crawl.json      # クロール結果
└── report.md       # 要約レポート
```

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| FIRECRAWL_API_KEY | 必須 | Firecrawl APIキー |

APIキー取得: https://www.firecrawl.dev/

## 料金目安

| 操作 | クレジット消費 |
|------|--------------|
| scrape 1ページ | 1クレジット |
| crawl 50ページ | 50クレジット |
| map（URL収集） | 1クレジット |
| search 1クエリ | 5クレジット |

無料枠: 500クレジット/月

## 使用例

### 競合サイトの全コンテンツ調査
```
/firecrawl --mode=crawl --url=https://competitor.com
```

### サイトのURL構造を把握
```
/firecrawl --mode=map --url=https://example.com
```

### 特定ページの記事を読み込む
```
/firecrawl --mode=scrape --url=https://blog.example.com/article
```

### キーワードでリサーチ
```
/firecrawl --mode=search --query=生成AI市場規模 2026
```

## 関連スキル

- `playwright-skill` - インタラクティブなブラウザ操作（ログイン・クリック等）
- `mega-research` - 複数API統合リサーチ
- `intelligence-research` - 定期情報収集

## エラー対処

| エラー | 原因 | 対処 |
|--------|------|------|
| API key not found | FIRECRAWL_API_KEY未設定 | `.env`にキーを追加 |
| Rate limit exceeded | クレジット超過 | プランアップグレードまたは待機 |
| Timeout | 大規模クロール | `limit`を小さくする |
| Blocked by robots.txt | サイトのクロール禁止 | 対象サイトの利用規約を確認 |
