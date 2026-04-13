# URL Deep Analysis - MCP Server Setup Guide

## 必須MCP（既にTAISUNに搭載済み）

以下のMCPは TAISUN v2 に標準搭載されているため、追加設定不要:

| MCP | 用途 | 状態 |
|-----|------|------|
| **Playwright** | DOM解析、スクリーンショット、JS実行 | 搭載済み |
| **WebFetch** | 静的HTML取得（組み込みツール） | 搭載済み |
| **WebSearch** | Web検索（組み込みツール） | 搭載済み |

---

## 推奨MCP（オプション拡張）

### 1. Firecrawl MCP（推奨度: 高）

**特徴**: 最速のWebクロール（7秒/ページ）、Markdown変換、JavaScript実行対応

```bash
# セットアップ
claude mcp add firecrawl \
  -e FIRECRAWL_API_KEY=fc-YOUR_API_KEY \
  -- npx -y firecrawl-mcp
```

**APIキー取得**:
1. https://firecrawl.dev にアクセス
2. アカウント作成（GitHub SSO対応）
3. Dashboard → API Keys でキー生成
4. 無料プラン: 500クレジット/月

**主要ツール**:
| ツール名 | 機能 |
|---------|------|
| `firecrawl_scrape` | 単一URL取得（Markdown変換） |
| `firecrawl_crawl` | サイト全体クロール |
| `firecrawl_map` | サイトマップ生成 |
| `firecrawl_extract` | 構造化データ抽出 |

**使用例**:
```
# 単一ページ取得
firecrawl_scrape({ url: "https://example.com", formats: ["markdown", "html"] })

# サイトクロール（最大100ページ）
firecrawl_crawl({ url: "https://example.com", limit: 100 })

# サイトマップ生成
firecrawl_map({ url: "https://example.com" })
```

---

### 2. Crawl4AI MCP（推奨度: 中〜高）

**特徴**: 完全無料・自己ホスト、BFS/DFS/BestFirst再帰クロール、LLM抽出対応

#### Option A: Docker（推奨）

```bash
# Dockerで起動
docker run -d -p 11235:11235 unclecode/crawl4ai:latest

# Claude Code に MCP 追加
claude mcp add crawl4ai -- npx -y crawl4ai-mcp@latest
```

#### Option B: Python venv

```bash
# venv作成
python3 -m venv ~/.crawl4ai-env
source ~/.crawl4ai-env/bin/activate
pip install crawl4ai

# サーバー起動
crawl4ai-server --port 11235

# 別ターミナルで Claude Code に MCP 追加
claude mcp add crawl4ai -- npx -y crawl4ai-mcp@latest
```

**主要ツール**:
| ツール名 | 機能 |
|---------|------|
| `crawl4ai_scrape` | 単一URL取得（Markdown/構造化） |
| `crawl4ai_crawl` | 再帰クロール（BFS/DFS/BestFirst） |

**使用例**:
```
# 単一ページ（LLM用Markdown）
crawl4ai_scrape({ url: "https://example.com" })

# 再帰クロール（深度2）
crawl4ai_crawl({
  url: "https://example.com",
  max_depth: 2,
  strategy: "bfs",
  max_pages: 50
})
```

---

### 3. Apify MCP（推奨度: 中）

**特徴**: 3000+アクター（既製スクレイパー）、動的発見、高度なプロキシ対応

```bash
# セットアップ
claude mcp add apify \
  -e APIFY_TOKEN=apify_api_YOUR_TOKEN \
  -- npx -y @nicekid1/apify-mcp-server
```

**APIキー取得**:
1. https://apify.com にアクセス
2. アカウント作成
3. Settings → Integrations → API Token
4. 無料プラン: $5/月のクレジット

**主要ツール**:
| ツール名 | 機能 |
|---------|------|
| `apify_search_actors` | アクター検索 |
| `apify_run_actor` | アクター実行 |
| `apify_get_dataset` | 結果取得 |

**よく使うアクター**:
| アクター | 用途 |
|---------|------|
| `apify/website-content-crawler` | 汎用Webクローラー |
| `apify/cheerio-scraper` | 軽量HTMLスクレイパー |
| `apify/puppeteer-scraper` | 動的サイトスクレイパー |

---

### 4. Jina Reader MCP（推奨度: 低〜中）

**特徴**: URLをLLM最適化Markdownに変換、無料API

```bash
# セットアップ（APIキー不要で基本利用可能）
claude mcp add jina-reader -- npx -y jina-reader-mcp
```

**使用例**:
```
# シンプルな変換
jina_read({ url: "https://example.com" })

# 検索
jina_search({ query: "Claude Code MCP servers" })
```

---

## 設定確認

### 現在のMCP一覧を確認

```bash
claude mcp list
```

### MCP動作テスト

```bash
# Playwright MCPのテスト（既存）
# → browser_navigate + browser_snapshot で任意のURLにアクセス

# Firecrawl MCPのテスト（追加後）
# → firecrawl_scrape で任意のURLを取得

# Crawl4AI MCPのテスト（追加後）
# → crawl4ai_scrape で任意のURLを取得
```

---

## MCP パフォーマンス比較（ベンチマーク）

| MCP | 速度 | 精度 | コスト | SPA対応 | 再帰クロール |
|-----|------|------|--------|---------|-------------|
| **Playwright** | 中 | 高 | 無料 | 完全 | 手動 |
| **Firecrawl** | 最速（7秒） | 83% | 有料 | 対応 | 対応 |
| **Crawl4AI** | 速い | 高 | 無料 | 対応 | BFS/DFS |
| **Apify** | 中（32秒） | 78% | 有料 | 対応 | 対応 |
| **Jina Reader** | 速い | 中 | 基本無料 | 部分 | 非対応 |
| **WebFetch** | 最速 | 中 | 無料 | 非対応 | 非対応 |

### 推奨構成パターン

**パターン1: 無料最大化**
- Playwright MCP + WebFetch + Crawl4AI MCP（Docker）

**パターン2: 速度重視**
- Firecrawl MCP + Playwright MCP（フォールバック）

**パターン3: 最大カバレッジ**
- Firecrawl MCP + Apify MCP + Playwright MCP

---

## トラブルシューティング

### Firecrawl MCP が動かない
```bash
# APIキーの確認
echo $FIRECRAWL_API_KEY

# npx キャッシュクリア
npx clear-npx-cache
npx -y firecrawl-mcp
```

### Crawl4AI Docker が起動しない
```bash
# ポート競合確認
lsof -i :11235

# Docker再起動
docker restart $(docker ps -q --filter ancestor=unclecode/crawl4ai)
```

### Playwright MCP のブラウザがインストールされていない
```bash
# browser_install ツールを呼び出す
# または手動:
npx playwright install chromium
```
