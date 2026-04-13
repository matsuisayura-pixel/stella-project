---
name: url-deep-analysis
description: Deep URL structure analysis
argument-hint: "<URL> [--depth=1|2|3] [--mode=full|structure|design|content|links]"
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash(curl:*, python3:*, node:*), mcp__playwright__*
model: sonnet
---

# url-deep-analysis - URL完全解析スキル

任意のURLのページ構造（HTML/CSS/デザイン/リンク/コンテンツ）を5層で完全解析し、構造化レポートを生成する。

```
┌─────────────────────────────────────────────────────────────────────┐
│                    URL DEEP ANALYSIS SYSTEM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Layer 1: URL INPUT                                                 │
│  ├─ URL正規化（UTMパラメータ除去、末尾スラッシュ統一）              │
│  ├─ robots.txt / sitemap.xml 確認                                  │
│  └─ ドメイン情報取得                                                │
│                                                                     │
│  Layer 2: PAGE FETCH（3つの取得手法を使い分け）                     │
│  ├─ WebFetch: 静的HTML取得（高速・軽量）                           │
│  ├─ Playwright MCP: JS実行後DOM取得（SPA対応）                     │
│  └─ curl: ヘッダー情報・レスポンス分析                             │
│                                                                     │
│  Layer 3: STRUCTURE ANALYSIS                                        │
│  ├─ HTML構造: DOM階層、セマンティック要素、見出し構造              │
│  ├─ CSS分析: レイアウト手法、配色、タイポグラフィ、レスポンシブ    │
│  ├─ メタデータ: OGP、構造化データ、SEO要素                         │
│  └─ アクセシビリティ: ARIA、alt属性、コントラスト比               │
│                                                                     │
│  Layer 4: DEEP CRAWL（再帰リンク解析）                             │
│  ├─ 内部リンクマップ: サイト構造のツリー表示                       │
│  ├─ 外部リンク: 参照先の分類と信頼度                               │
│  ├─ CTA分析: 導線設計、ボタン配置、コンバージョンポイント         │
│  └─ メディア: 画像/動画/音声の一覧と最適化状況                    │
│                                                                     │
│  Layer 5: REPORT GENERATION                                         │
│  ├─ 構造化レポート（Markdown）                                     │
│  ├─ 改善提案（太陽スタイル連携可能）                               │
│  └─ 競合比較データ（複数URL対応）                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 使い方

```bash
# 基本分析（全5層）
/url-deep-analysis https://example.com

# 構造のみ分析
/url-deep-analysis https://example.com --mode=structure

# デザイン分析
/url-deep-analysis https://example.com --mode=design

# リンク解析（深度2まで再帰）
/url-deep-analysis https://example.com --mode=links --depth=2

# コンテンツ分析
/url-deep-analysis https://example.com --mode=content

# 複数URL比較
/url-deep-analysis https://site-a.com https://site-b.com --mode=full
```

## 分析モード詳細

| モード | 分析内容 | 所要時間目安 |
|--------|---------|-------------|
| **full** | 全5層の完全分析 | 2-5分 |
| **structure** | HTML構造、DOM階層、見出しツリー | 30秒-1分 |
| **design** | CSS、レイアウト、配色、タイポグラフィ | 1-2分 |
| **content** | テキスト、メディア、メタデータ | 1-2分 |
| **links** | 内部/外部リンクマップ、CTA分析 | 1-3分 |

## 実行フロー

### Step 1: URL入力と事前チェック

```
入力: URL（1つまたは複数）
↓
1. URL正規化
   - UTMパラメータ除去（utm_source, utm_medium等）
   - 末尾スラッシュ統一
   - wwwの有無を統一
2. 事前チェック
   - robots.txtの確認（アクセス可否）
   - sitemap.xmlの取得（サイト構造把握）
   - WHOISドメイン情報（任意）
```

### Step 2: ページ取得（3手法の使い分け）

```
判定ロジック:
├─ 静的サイト（HTML/CSS中心）→ WebFetch（高速）
├─ SPA/動的サイト（React/Vue等）→ Playwright MCP（JS実行必要）
└─ ヘッダー/パフォーマンス分析 → curl（詳細ヘッダー取得）

手法選択の自動判定:
1. まずWebFetchで取得を試みる
2. 取得HTMLに <div id="root"></div> 等のSPAマーカーがあれば
   → Playwright MCPで再取得
3. パフォーマンス分析が必要な場合
   → curl -w で応答時間測定
```

**WebFetch使用例:**
```
WebFetch(url, "以下の情報を抽出:
1. ページタイトルとmeta description
2. h1-h6の見出し構造
3. 主要なナビゲーションリンク
4. 外部CSSファイルのURL
5. OGP情報
6. 構造化データ（JSON-LD）")
```

**Playwright MCP使用例（SPA/動的サイト）:**
```
1. browser_navigate → URL表示
2. browser_snapshot → アクセシビリティスナップショット取得
3. browser_evaluate → DOM分析スクリプト実行:
   - document.querySelectorAll('*').length → 要素数
   - getComputedStyle() → CSS解析
   - document.links → 全リンク取得
4. browser_take_screenshot → ビジュアルキャプチャ
```

### Step 3: 構造分析

#### 3a. HTML構造分析

```
Playwright browser_evaluate で実行:

async (page) => {
  // 見出し構造
  const headings = await page.$$eval('h1,h2,h3,h4,h5,h6', els =>
    els.map(el => ({
      tag: el.tagName,
      text: el.textContent.trim().substring(0, 100),
      id: el.id
    }))
  );

  // セマンティック要素
  const semantics = await page.$$eval(
    'header,nav,main,article,section,aside,footer',
    els => els.map(el => ({
      tag: el.tagName,
      children: el.children.length,
      text: el.textContent.trim().substring(0, 50)
    }))
  );

  // メタデータ
  const meta = await page.$$eval('meta', els =>
    els.map(el => ({
      name: el.getAttribute('name') || el.getAttribute('property'),
      content: el.getAttribute('content')?.substring(0, 200)
    })).filter(m => m.name)
  );

  return { headings, semantics, meta };
}
```

#### 3b. CSS/デザイン分析

```
Playwright browser_evaluate で実行:

async (page) => {
  // カラーパレット抽出
  const colors = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const colorSet = new Set();
    allElements.forEach(el => {
      const style = getComputedStyle(el);
      colorSet.add(style.color);
      colorSet.add(style.backgroundColor);
    });
    return [...colorSet].filter(c => c !== 'rgba(0, 0, 0, 0)');
  });

  // フォント情報
  const fonts = await page.evaluate(() => {
    const fontSet = new Set();
    document.querySelectorAll('*').forEach(el => {
      fontSet.add(getComputedStyle(el).fontFamily);
    });
    return [...fontSet];
  });

  // レイアウト手法
  const layout = await page.evaluate(() => {
    const flexCount = document.querySelectorAll('[style*="flex"], .flex').length;
    const gridCount = document.querySelectorAll('[style*="grid"], .grid').length;
    return { flexCount, gridCount, hasFlexbox: flexCount > 0, hasGrid: gridCount > 0 };
  });

  return { colors, fonts, layout };
}
```

#### 3c. レスポンシブ分析

```
Playwright で viewport を変更して分析:

1. browser_resize(1920, 1080) → デスクトップ
2. browser_take_screenshot → デスクトップ版キャプチャ
3. browser_resize(768, 1024)  → タブレット
4. browser_take_screenshot → タブレット版キャプチャ
5. browser_resize(375, 812)   → モバイル
6. browser_take_screenshot → モバイル版キャプチャ
7. 各サイズのレイアウト変化を比較分析
```

### Step 4: リンク解析（Deep Crawl）

```
Playwright browser_evaluate で実行:

async (page) => {
  const currentUrl = new URL(page.url());

  // 全リンク取得
  const links = await page.$$eval('a[href]', (els) => {
    return els.map(el => ({
      href: el.href,
      text: el.textContent.trim().substring(0, 100),
      isButton: el.closest('button') !== null || el.classList.contains('btn'),
      rel: el.getAttribute('rel'),
      target: el.getAttribute('target')
    }));
  });

  // 分類
  const internal = links.filter(l => new URL(l.href).hostname === currentUrl.hostname);
  const external = links.filter(l => new URL(l.href).hostname !== currentUrl.hostname);
  const cta = links.filter(l => l.isButton || l.text.match(/購入|申込|登録|ダウンロード|今すぐ|無料/));

  return {
    total: links.length,
    internal: { count: internal.length, links: internal },
    external: { count: external.length, links: external },
    cta: { count: cta.length, links: cta }
  };
}
```

**depth=2以上の場合の再帰クロール:**
```
1. トップページの内部リンクを取得
2. 各内部リンクに対してWebFetchで構造取得
3. サイトマップツリーを構築:

example.com/
├── /about
├── /products
│   ├── /products/item-1
│   └── /products/item-2
├── /blog
│   ├── /blog/post-1
│   └── /blog/post-2
└── /contact
```

### Step 5: レポート生成

出力先: `./url-analysis-reports/[domain]-[timestamp].md`

## 出力フォーマット

```markdown
# URL Deep Analysis Report

**対象URL**: https://example.com
**分析日時**: 2026-02-08 15:30:00
**分析モード**: full
**解析深度**: 1

---

## 1. サイト概要

| 項目 | 値 |
|------|-----|
| ページタイトル | Example Site |
| meta description | ... |
| 技術スタック | React, Tailwind CSS, Next.js |
| ページサイズ | 1.2MB |
| 読み込み時間 | 2.3秒 |
| 総要素数 | 1,234 |

## 2. HTML構造

### 見出しツリー
```
H1: メインタイトル
├── H2: セクション1
│   ├── H3: サブセクション1-1
│   └── H3: サブセクション1-2
├── H2: セクション2
└── H2: セクション3
```

### セマンティック構造
- header: 1個（ナビゲーション含む）
- nav: 2個（グローバル + フッター）
- main: 1個
- article: 3個
- section: 8個
- aside: 1個（サイドバー）
- footer: 1個

## 3. デザイン分析

### カラーパレット
| 用途 | カラー | HEX |
|------|--------|-----|
| Primary | ■ | #3B82F6 |
| Secondary | ■ | #10B981 |
| Background | ■ | #FFFFFF |
| Text | ■ | #1F2937 |

### タイポグラフィ
| 用途 | フォント | サイズ |
|------|---------|--------|
| 見出し | Inter Bold | 32-48px |
| 本文 | Inter Regular | 16px |
| キャプション | Inter Light | 14px |

### レイアウト手法
- Flexbox使用: 45箇所
- CSS Grid使用: 12箇所
- レスポンシブ: ブレークポイント3つ（768px, 1024px, 1280px）

## 4. リンクマップ

### 内部リンク（24個）
| リンクテキスト | URL | 種別 |
|---------------|-----|------|
| ホーム | / | ナビゲーション |
| 製品一覧 | /products | ナビゲーション |
| お問い合わせ | /contact | CTA |

### 外部リンク（8個）
| リンクテキスト | URL | 種別 |
|---------------|-----|------|
| Twitter | https://twitter.com/... | SNS |
| GitHub | https://github.com/... | SNS |

### CTA分析
| CTA | テキスト | 位置 | スタイル |
|-----|---------|------|---------|
| 1 | 今すぐ無料で始める | ヒーロー | Primary Button |
| 2 | お問い合わせ | フッター | Secondary Button |

## 5. SEO/メタデータ

### OGP
| プロパティ | 値 |
|-----------|-----|
| og:title | ... |
| og:description | ... |
| og:image | ... |

### 構造化データ
- JSON-LD: Organization, WebPage
- Schema.org: BreadcrumbList

## 6. パフォーマンス指標

| 指標 | 値 | 評価 |
|------|-----|------|
| DOM要素数 | 1,234 | 良好 |
| 画像数 | 15 | 普通 |
| 外部スクリプト | 8 | 要改善 |
| CSS ファイル数 | 3 | 良好 |

## 7. 改善提案

1. **画像最適化**: WebP未使用の画像が5枚 → WebP変換で30%軽量化見込み
2. **CTA配置**: スクロール後のCTAが不足 → 中間セクションにCTA追加推奨
3. **構造化データ**: FAQPageスキーマ未設定 → 検索結果リッチスニペット対応可能
```

## 複数URL比較モード

2つ以上のURLが指定された場合、比較テーブルを生成:

```markdown
## 比較分析

| 項目 | Site A | Site B |
|------|--------|--------|
| ページサイズ | 1.2MB | 2.5MB |
| 読み込み速度 | 2.3s | 4.1s |
| DOM要素数 | 1,234 | 3,456 |
| CTA数 | 3 | 1 |
| 見出し階層 | 適切 | H2不足 |
| レスポンシブ | 対応 | 部分対応 |
| OGP | 完備 | 不足 |
```

## 関連スキル連携

| 連携先 | 用途 |
|--------|------|
| **lp-analysis** | LP分析結果を太陽スタイル基準で評価 |
| **agentic-vision** | スクリーンショットの視覚的分析 |
| **mega-research** | 競合サイトの市場調査と組み合わせ |
| **nanobanana-pro** | 改善後のデザイン提案画像生成 |

## MCP サーバー要件

### 必須（既にTAISUNに搭載）
- **Playwright MCP**: DOM解析、スクリーンショット、JS実行
- **WebFetch**: 静的HTML取得、メタデータ抽出
- **WebSearch**: 競合調査、技術スタック検出

### 推奨（オプション拡張）
- **Firecrawl MCP**: 高速クロール（7秒/ページ）、Markdown変換
  - `claude mcp add firecrawl -e FIRECRAWL_API_KEY=xxx -- npx -y firecrawl-mcp`
- **Crawl4AI MCP**: 無料自己ホスト、BFS/DFS再帰クロール
  - Docker: `docker run -p 11235:11235 unclecode/crawl4ai`
- **Apify MCP**: 3000+アクター、高度なスクレイピング
  - `claude mcp add apify -e APIFY_TOKEN=xxx -- npx -y @nicekid1/apify-mcp-server`

## 技術ノート

### SPA検出ヒューリスティック
以下のパターンでSPAを自動検出し、Playwright MCPに切り替え:
- `<div id="root"></div>` (React)
- `<div id="app"></div>` (Vue)
- `<div id="__next"></div>` (Next.js)
- `<script src="...chunk...">`
- `noscript` 要素の存在

### robots.txt尊重
- クロール前に必ずrobots.txtを確認
- Disallowされたパスはスキップ
- Crawl-Delayを尊重

### レート制限
- 同一ドメインへの連続リクエスト: 最低1秒間隔
- depth=2以上: 最大50ページまで
- depth=3: 最大200ページまで
