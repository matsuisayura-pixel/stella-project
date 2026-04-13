---
name: keyword-to-gem
description: Auto Gem creation from keywords
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
disable-model-invocation: true
---

# Keyword-to-Gem - 完全自動ナレッジ生成パイプライン

## 概要

```
┌──────────────────────────────────────────────────────────────────┐
│              KEYWORD-TO-GEM PIPELINE v1.0                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  入力: キーワード1つ（例: "AIエージェント"）                     │
│                                                                  │
│  Phase 1: キーワード展開 ─────────────────────────────────────── │
│    ├─ 複合KW（3-5語の組み合わせ）                                │
│    ├─ 急上昇KW（トレンド・バズワード）                           │
│    ├─ 関連KW（類義語・上位/下位概念）                            │
│    ├─ SNS KW（ハッシュタグ・メンション形式）                     │
│    └─ 多言語展開（日本語/英語/中国語）                           │
│                                                                  │
│  Phase 2: SNS横断検索（並列実行）────────────────────────────── │
│    ├─ X(Twitter): 2週間以内 + バイラル投稿                       │
│    ├─ YouTube: 2週間以内 + 字幕取得                              │
│    └─ world-research: 20+プラットフォーム横断                    │
│                                                                  │
│  Phase 3: データ統合・正規化 ─────────────────────────────────── │
│    ├─ 重複排除                                                   │
│    ├─ 関連度スコアリング                                         │
│    └─ 上位50件選択                                               │
│                                                                  │
│  Phase 4: NotebookLM投入 ────────────────────────────────────── │
│    ├─ 新規ノートブック作成                                       │
│    ├─ URL/テキスト/YouTubeソース追加                             │
│    └─ Gemini知識統合                                             │
│                                                                  │
│  Phase 5: Gem作成 ───────────────────────────────────────────── │
│    ├─ カスタム指示でペルソナ設定                                  │
│    ├─ Audio Overview生成                                         │
│    └─ ブリーフィングドキュメント生成                              │
│                                                                  │
│  Phase 6: ログ記録 ──────────────────────────────────────────── │
│    └─ Google Sheets自動記録                                      │
│                                                                  │
│  出力: NotebookLM Gem + Audio Overview + ログ                    │
└──────────────────────────────────────────────────────────────────┘
```

## 使い方

```bash
# 基本（キーワード指定のみ）
/keyword-to-gem AIエージェント

# 複数キーワード
/keyword-to-gem AIエージェント MCP Server

# オプション付き
/keyword-to-gem AIエージェント 期間=1週間 言語=ja,en プラットフォーム=X,YouTube,Reddit

# Gem名指定
/keyword-to-gem AIエージェント gem名=AI_Agent_Expert_2026

# ログのみ（NotebookLM投入なし）
/keyword-to-gem AIエージェント モード=収集のみ
```

---

## Phase 1: キーワード展開

### 展開ルール

入力キーワードから以下の6タイプを自動生成する:

| タイプ | 説明 | 生成数 | 例（入力: AIエージェント） |
|--------|------|--------|--------------------------|
| **複合KW** | 3-5語の組み合わせ | 10-15 | AIエージェント フレームワーク 2026, AIエージェント 開発ツール |
| **急上昇KW** | トレンド・バズワード | 5-8 | MCP Server, Agentic AI, Claude Code Agent |
| **関連KW** | 類義語・概念 | 8-12 | マルチエージェント, 自律AI, AI自動化 |
| **SNS KW** | ハッシュタグ形式 | 5-10 | #AIAgent, #AgenticAI, #MCPServer |
| **英語KW** | 英語翻訳・展開 | 8-12 | AI Agent framework, Agentic AI tools 2026 |
| **中国語KW** | 中国語翻訳・展開 | 5-8 | AI智能体, 多智能体框架, AI Agent |

### プロンプトテンプレート

```
あなたはSEO・SNSキーワード展開の専門家です。
以下のベースキーワードから、SNS最新情報検索に最適なキーワードセットを生成してください。

ベースキーワード: {input_keyword}
対象期間: 直近2週間
対象プラットフォーム: X(Twitter), YouTube, Reddit, note.com, Medium

生成するキーワード:
1. 複合キーワード（10-15個）: 3-5語の具体的な組み合わせ
2. 急上昇キーワード（5-8個）: 最新トレンド・バズワード
3. 関連キーワード（8-12個）: 類義語・上位概念・下位概念
4. SNSキーワード（5-10個）: ハッシュタグ形式（#付き）
5. 英語キーワード（8-12個）: 英語圏SNS用
6. 中国語キーワード（5-8個）: 中国語圏SNS用

各キーワードは検索ボリューム・バイラル可能性が高いものを優先してください。
JSON形式で出力してください。
```

### 出力形式

```json
{
  "base_keyword": "AIエージェント",
  "generated_at": "2026-02-08T15:30:00Z",
  "keywords": {
    "compound": ["AIエージェント フレームワーク 2026", "..."],
    "trending": ["MCP Server", "Agentic AI", "..."],
    "related": ["マルチエージェント", "自律AI", "..."],
    "sns_hashtags": ["#AIAgent", "#AgenticAI", "..."],
    "english": ["AI Agent framework 2026", "..."],
    "chinese": ["AI智能体", "多智能体框架", "..."]
  },
  "total_count": 45
}
```

---

## Phase 2: SNS横断検索

### 2.1 X(Twitter) 検索

**方法A: twitter-client MCP（推奨、Cookie認証・無料）**

```bash
# MCP Server: agent-twitter-client-mcp（.mcp.json に設定済み）
# 認証: Cookie認証（TWITTER_COOKIES環境変数）
# コスト: 無料（APIキー不要）

# 利用可能ツール:
# - getTweets: ユーザーのツイート取得
# - searchTweets: キーワード検索（検索演算子対応）
# - getTweetById: 特定ツイートID取得
# - getProfile: ユーザープロフィール取得
# - getFollowers/getFollowing: フォロワー・フォロイー取得
# - sendTweet: ツイート投稿（リサーチ後の発信にも利用可能）

# 検索例:
# searchTweets("{keyword}" lang:ja min_faves:50)
# searchTweets("{keyword}" lang:en min_faves:200 -filter:replies)
# searchTweets("#{keyword}" since:2026-01-25)

# 実行フロー:
# 1. twitter-client MCP の searchTweets でキーワード検索
# 2. 結果をエンゲージメント順にソート
# 3. 上位投稿の詳細を getTweetById で取得
# 4. 投稿者のプロフィールを getProfile で補完
```

**方法B: WebSearch経由（フォールバック）**

```
# twitter-client MCPが利用できない場合のフォールバック
検索クエリ:
site:x.com "{keyword}" since:2026-01-25
site:twitter.com "{keyword}" min_faves:50
"{keyword}" twitter バイラル 2026
```

**方法C: Apify Twitter Scraper（大量取得時）**

```bash
# Apify MCP Server インストール:
claude mcp add apify -- npx -y @apify/mcp-server

# 利用可能アクター:
# - apify/scrapers/twitter: $0.40/1kツイート、キーワード/ハッシュタグ検索
# - altimis/scweet: $0.30/1kツイート、30-80ツイート/秒の高速処理
# - apidojo/tweet-scraper: キーワード検索、タイムライン、フォロワーリスト
# 全アクターMCP対応、JSON/CSV/Excel/XML/HTML出力

# → Apify To NotebookLM (flamboyant_leaf/apify-to-notebooklm) で
#   自動的にGoogle Drive経由でNotebookLMに投入可能
```

**方法D: X API v2 MCP（要APIキー）**

```bash
# MCP Server: NexusX-MCP/x-v2-server or mbelinky/x-mcp-server
# インストール:
claude mcp add x-api -- npx @nexusx/x-v2-server

# 検索パラメータ:
query: "{keyword}" lang:ja -is:retweet
start_time: {2週間前のISO8601}
max_results: 100
sort_order: relevancy
tweet.fields: created_at,public_metrics,author_id
```

### 2.2 YouTube 検索

**方法A: WebSearch経由（APIキー不要）**

```
検索クエリ:
site:youtube.com "{keyword}" 2026
"{keyword}" YouTube 最新 解説
```

**方法B: YouTube Data API v3 + Transcript MCP（推奨）**

```bash
# YouTube検索:
GET /youtube/v3/search
  q: "{keyword}"
  publishedAfter: {2週間前のISO8601}
  type: video
  order: viewCount
  maxResults: 25
  relevanceLanguage: ja

# 字幕取得 MCP:
# kimtaeyoon83/mcp-server-youtube-transcript
# jkawamoto/mcp-youtube-transcript
claude mcp add youtube-transcript -- npx mcp-server-youtube-transcript
```

### 2.3 world-research 横断検索

```bash
# world-research スキルを呼び出し
/world-research キーワード={keyword} モード=standard

# 検索対象:
# - Reddit (r/MachineLearning, r/ClaudeAI, r/LocalLLaMA等)
# - note.com (非公式API経由)
# - Medium
# - Hacker News (hn.algolia.com)
# - Qiita
# - Zenn
# - Bilibili
# - 知乎 (Zhihu)
```

### 2.4 Apify統合パイプライン（オプション）

Apifyアクターを使用する場合の追加検索:

```bash
# Reddit Scraper Lite（認証不要、無料枠対応）
# apify.com/trudax/reddit-scraper-lite
# → キーワード検索、サブレディット指定、日付フィルタ

# YouTube Search Scraper
# apify.com/streamers/youtube-scraper ($5/1k動画)
# → キーワード検索、Shorts/フル動画フィルタ

# Instagram Hashtag Scraper
# apify.com/apify/instagram-hashtag-scraper ($2.60/1k結果)

# TikTok Keywords Discovery
# apify.com/easyapi/tiktok-keywords-discovery-tool

# Apify → NotebookLM自動投入:
# apify.com/flamboyant_leaf/apify-to-notebooklm
# → Google Drive経由でNotebookLMに直接投入
```

### 2.5 並列実行パターン

```
Phase 2は以下を並列で実行:

Task Agent 1: X検索（twitter-client MCP → WebSearchフォールバック）
Task Agent 2: YouTube検索 + 字幕取得（+ Apify YouTube Scraper）
Task Agent 3: world-research（Reddit/note/Medium等）
Task Agent 4: Apify統合（Reddit Lite + Instagram + TikTok）[オプション]

→ 全エージェントの結果を統合
```

---

## Phase 3: データ統合・正規化

### 統合ルール

```python
# 1. 全結果を統一フォーマットに変換
unified_format = {
    "title": str,          # 投稿タイトル/ツイート冒頭
    "url": str,            # 元URL
    "platform": str,       # X/YouTube/Reddit/note等
    "published_at": str,   # 投稿日時（ISO8601）
    "engagement": int,     # いいね+RT+コメント等
    "language": str,       # ja/en/zh
    "content_summary": str, # 要約（200文字以内）
    "full_text": str,      # 全文（字幕含む）
    "author": str,         # 投稿者名
    "source_type": str     # url/text/youtube
}

# 2. 重複排除（URL + タイトル類似度70%以上）
# 3. 関連度スコアリング（キーワードマッチ + エンゲージメント）
# 4. 上位50件を選択（URL30件 + テキスト15件 + YouTube5件）
```

### フィルタリング基準

| 基準 | 閾値 | 理由 |
|------|------|------|
| 投稿日 | 2週間以内 | 最新情報に限定 |
| エンゲージメント | X: 50+いいね, YouTube: 1000+再生 | 品質保証 |
| 言語 | ja, en, zh | 3言語カバー |
| コンテンツ長 | 最低100文字 | 実質的な内容を持つもの |

---

## Phase 4: NotebookLM投入

### MCP Server経由（推奨）

```bash
# notebooklm-mcp インストール
claude mcp add notebooklm -- npx notebooklm-mcp@latest

# 初回のみ: ブラウザでGoogle認証
# → 認証情報はローカルに永続保存
```

### 操作フロー

```
Step 1: ノートブック作成
  → タイトル: "{keyword}_{YYYYMMDD}"
  → 例: "AIエージェント_20260208"

Step 2: URLソース追加（最大30件）
  → X投稿URL、YouTube URL、記事URL
  → 1秒間隔でレート制限遵守

Step 3: テキストソース追加（最大15件）
  → ツイート全文、記事要約、YouTube字幕
  → Markdown形式で整形

Step 4: YouTubeソース追加（最大5件）
  → YouTube URL直接追加
  → NotebookLMが自動で字幕を解析

Step 5: 確認
  → ソース総数を確認（最大50件）
  → エラーがあればリトライ
```

### Apify→NotebookLM 直接パイプライン（オプション）

Phase 2でApifyを使用した場合、Apifyの出力を直接NotebookLMに投入可能:

```bash
# Apify To NotebookLM アクター:
# apify.com/flamboyant_leaf/apify-to-notebooklm
#
# フロー:
# 1. Phase 2のApifyアクター出力 → Apifyデータセット
# 2. Apify To NotebookLM → Google Drive にファイルエクスポート
# 3. NotebookLM MCP → Google Driveからソース追加
#
# メリット:
# - Phase 2の結果を直接NotebookLMに流せる
# - 手動変換不要（JSON→Google Drive→NotebookLM自動化）
# - Apify Starter ($49/月) で全自動化可能
```

### Playwright フォールバック

NotebookLM MCPが利用できない場合:

```bash
# Playwright MCP経由でブラウザ自動化
# 1. NotebookLMページを開く
# 2. 「新規ノートブック」をクリック
# 3. ソースを1件ずつ追加
# 4. UI操作で完了確認
```

---

## Phase 5: Gem作成

### Gem設定

```
Gem名: "{keyword}_Expert_{YYYYMMDD}"
例: "AIエージェント_Expert_20260208"

カスタム指示:
「あなたは{keyword}に関する最新情報に精通した専門家です。
ノートブック内のソースに基づいて、引用付きで正確に回答してください。
回答は日本語で、具体的なデータや事例を含めてください。
推測や不確かな情報には必ず注記を付けてください。」
```

### Studio出力

```
1. Audio Overview（ポッドキャスト形式）
   → 2人の対話形式で知識を要約
   → 10-15分の音声生成

2. ブリーフィングドキュメント
   → 主要ポイントの構造化された要約
   → 引用付き

3. FAQ
   → よくある質問と回答の自動生成
   → ソースからの引用付き
```

---

## Phase 6: ログ記録

### Google Sheets MCP経由

```bash
# Google Sheets MCP インストール
claude mcp add google-sheets -- npx mcp-google-sheets

# スプレッドシートID指定（初回作成後は固定）
SPREADSHEET_ID="xxxxxxxxxxxxx"
```

### 記録項目

| シート | 列 | 内容 |
|--------|-----|------|
| **実行ログ** | A | 実行ID (exec_YYYYMMDD_NNN) |
| | B | 実行日時 |
| | C | 入力キーワード |
| | D | 展開KW数 |
| | E | 検索プラットフォーム |
| | F | 取得記事数 |
| | G | フィルタ後件数 |
| | H | NotebookLM URL |
| | I | Gem名 |
| | J | Audio Overview有無 |
| | K | ステータス（成功/失敗） |
| | L | 所要時間 |
| | M | エラー内容 |
| **キーワード** | A | 実行ID |
| | B | タイプ（複合/急上昇/関連/SNS/英語/中国語） |
| | C | キーワード |
| | D | 検索結果数 |
| **収集データ** | A | 実行ID |
| | B | プラットフォーム |
| | C | タイトル |
| | D | URL |
| | E | エンゲージメント |
| | F | 投稿日 |
| | G | NotebookLMに追加したか |

---

## 必要なMCP Servers

| MCP | コマンド | 必須度 |
|-----|---------|--------|
| **twitter-client** | `.mcp.json に設定済み（Cookie認証）` | 推奨 |
| **notebooklm-mcp** | `claude mcp add notebooklm -- npx notebooklm-mcp@latest` | 必須 |
| **mcp-google-sheets** | `claude mcp add google-sheets -- npx mcp-google-sheets` | 必須 |
| **playwright** | 既にインストール済み | 必須 |
| **apify** | `claude mcp add apify -- npx -y @apify/mcp-server` | 推奨 |
| youtube-transcript | `claude mcp add yt-transcript -- npx mcp-server-youtube-transcript` | オプション |

## 必要なSkills

| Skill | パス | 必須度 |
|-------|------|--------|
| **world-research** | `.claude/skills/world-research` | 必須 |
| **keyword-free** | `.claude/skills/keyword-free` | 推奨 |
| **keyword-mega-extractor** | `.claude/skills/keyword-mega-extractor` | 推奨 |
| **research-free** | `.claude/skills/research-free` | 推奨 |

---

## エラーハンドリング

| エラー | 対策 |
|--------|------|
| NotebookLM認証切れ | ブラウザで再ログイン→認証永続化 |
| X API レート制限 | WebSearch にフォールバック |
| YouTube API 割り当て超過 | Apify YouTube Scraper にフォールバック |
| ソース追加失敗 | 3回リトライ → スキップしてログ記録 |
| ネットワークエラー | 30秒待機 → リトライ |

---

## セキュリティ

- NotebookLM認証: ローカル保存のみ、専用Googleアカウント推奨
- X API Token: 環境変数管理（.envファイル、gitignore済み）
- Google Sheets OAuth: 最小権限（Sheets APIのみ）
- スクレイピング: 1秒間隔のレート制限遵守
- データ: 公開情報のみ収集、個人情報は自動除外

---

## コスト

| 構成 | 月額 | 説明 |
|------|------|------|
| **最小構成** | $0追加 | WebSearch + NotebookLM MCP + Sheets MCP |
| **Apify構成** | $5追加 | + Apify Free ($5/月、Twitter/Reddit/YouTube) |
| **推奨構成** | $54追加 | + Apify Starter ($49) + Apify→NotebookLM自動連携 |
| **フル構成** | $149追加 | + X API v2 Basic ($100) + Apify Starter ($49) |

※ Claude Code Pro ($20/月) は別途必要
※ Apify Free: $5/月クレジット、30日データ保持、10アクター同時実行

---

## 出力ディレクトリ

```
research/keyword-to-gem/<timestamp>__<keyword>/
├── input.json           # 入力パラメータ
├── keywords.json        # 展開されたキーワード
├── raw_data/
│   ├── x_results.json   # X検索結果
│   ├── youtube_results.json  # YouTube検索結果
│   └── world_research.json   # world-research結果
├── filtered_data.json   # フィルタ後データ
├── notebooklm_log.json  # NotebookLM操作ログ
├── gem_info.json        # Gem情報
└── report.md            # 実行レポート
```

---

## 関連スキル

- `world-research` - 全世界SNS横断検索
- `keyword-free` - APIキー不要キーワード抽出
- `keyword-mega-extractor` - 多角的キーワード展開
- `research-free` - APIキー不要リサーチ
- `gpt-researcher` - 深層調査エンジン
- `note-research` - note.com特化リサーチ

## ソース

- [PleasePrompto/notebooklm-mcp](https://github.com/PleasePrompto/notebooklm-mcp)
- [xing5/mcp-google-sheets](https://github.com/xing5/mcp-google-sheets)
- [NexusX-MCP/x-v2-server](https://github.com/NexusX-MCP/x-v2-server)
- [kimtaeyoon83/mcp-server-youtube-transcript](https://github.com/kimtaeyoon83/mcp-server-youtube-transcript)
- [DataNath/notebooklm_source_automation](https://github.com/DataNath/notebooklm_source_automation)
- [Apify MCP Server](https://github.com/apify/actors-mcp-server)
- [Apify To NotebookLM](https://apify.com/flamboyant_leaf/apify-to-notebooklm)
- [Apify Twitter Scraper](https://apify.com/apify/scrapers/twitter)
- [SkillsMP](https://skillsmp.com/)
- [MCPMarket](https://mcpmarket.com/)
