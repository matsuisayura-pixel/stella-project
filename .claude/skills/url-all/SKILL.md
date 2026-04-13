---
name: url-all
description: Full URL analysis and extraction
argument-hint: "<URL> [--mode=quick|standard|deep|competitive|seo|audit|links] [--depth=1|2|3]"
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash(curl:*, node:*, chmod:*, cat:*), mcp__playwright__*
model: sonnet
---

# url-all v3: URL完全把握システム（ローカルLLM版）

## ローカル分析原則（最重要）

**このスキルでは、コンテンツ分析・要約・スコアリング・レポート生成を全てローカルOllamaモデルで実行する。**
**Claude自身が分析・要約・スコアリングを行うことは禁止。**
**Claudeの役割は「ツール実行とデータ受け渡し」のオーケストレーターのみ。**

### アーキテクチャ（v3）
```
Claude Code (薄いオーケストレーター - ツール実行のみ)
  │
  ├─ Playwright MCP (データ抽出) ← 変更なし
  │   └─ Scripts 00-12: 構造化JSON取得
  │
  ├─ Ollama API (分析エンジン) ← ローカルLLM
  │   ├─ コンテンツ要約: qwen2.5:32b
  │   ├─ 技術分析: qwen3-coder:30b
  │   ├─ Tier 2/3 軽量要約: qwen3:8b (高速)
  │   └─ レポート生成: qwen2.5:32b
  │
  └─ Bash (curl → Ollama localhost:11434)
```

### Ollama呼び出し手順（全分析で共通）
```
1. Playwright スクリプトの結果JSONを取得
2. JSONをOllamaプロンプトに埋め込む
3. ollama-call.sh または curl で Ollama API を呼ぶ（Bash ツール）
4. Ollama の応答をそのままレポートに反映（Claudeは加工しない）
```

### Ollamaヘルパースクリプト
```bash
# scripts/ollama-call.sh を使用
# Usage: bash scripts/ollama-call.sh <model> <system_prompt> <user_prompt> [json]
SCRIPT_DIR="$HOME/.claude/skills/url-all/scripts"
bash "$SCRIPT_DIR/ollama-call.sh" "qwen2.5:32b" "システムプロンプト" "ユーザープロンプト"
```

### モデル使い分け
| 用途 | モデル | 理由 |
|------|--------|------|
| コンテンツ要約・レポート生成 | `qwen2.5:32b` | 日本語最高品質、128Kコンテキスト |
| 技術スタック分析・スコアリング | `qwen3-coder:30b` | コード/技術理解特化 |
| Tier 2/3 大量ページ軽量要約 | `qwen3:8b` | 高速（深層クロール時の大量処理用） |

---

## コンテンツ理解ファースト原則

**このスキルの第一目的は「ページに何が書いてあるかを正確に理解・記録すること」である。**
技術分析（CSS/パフォーマンス/セキュリティ等）は第二目的。

### スキルの目的（優先順）
1. **コンテンツ理解** - サイトの内容把握。何が書いてあるか、どんなサイトか
2. **情報抽出・記録** - テキスト・画像・動画・コード等すべてを構造化して記録
3. **要約生成** - Ollama qwen2.5:32b による内容の要点まとめ
4. **技術分析** - Ollama qwen3-coder:30b によるCSS/パフォーマンス/セキュリティ等

### 実行順序の鉄則
```
必ず最初に: 00-content-extraction.js → コンテンツ完全把握
次に必要なら: 01〜10 の技術分析スクリプト
最後に: Ollama で分析・要約・レポート生成
```
**コンテンツ抽出を飛ばして技術分析だけ行うことは絶対にしない。**

Playwright MCP + WebFetch + Ollama (localhost) のみ使用。追加APIキー不要。

## 引数パース

```
入力例:
  /url-all https://example.com
  /url-all https://example.com --mode=deep --depth=2
  /url-all https://example.com https://competitor.com --mode=competitive

パース:
  URL = 最初の https?:// で始まる引数（複数可）
  --mode = quick|standard|deep|competitive|seo|audit|links（デフォルト: standard）
  --depth = 1|2|3（デフォルト: 1、deepモードのみ有効）
```

---

## 7分析モード

| モード | 内容 | 所要時間 |
|--------|------|---------|
| **quick** | WebFetchのみで基本構造解析 | ~30秒 |
| **standard** | Playwright全10スクリプト + Ollama分析 | 2-4分 |
| **deep** | 再帰クロール+全ページOllama分析 | 5-20分 |
| **competitive** | 複数URL比較分析（Ollama） | 4-10分 |
| **seo** | SEOスコアリング+改善提案（Ollama） | 2-4分 |
| **audit** | セキュリティ+アクセシビリティ監査（Ollama） | 2-4分 |
| **links** | リンク抽出+サイトマップ生成 | 1-2分 |

---

## 7層アーキテクチャ

### Layer 0: URL正規化
- UTMパラメータ除去（utm_source, utm_medium, utm_campaign, etc.）
- トレーリングスラッシュ正規化
- プロトコル確認（http→httpsへの自動アップグレード確認）
- URLデコード

### Layer 1: 取得（WebFetch → Playwright 自動切替）
1. まず `WebFetch` でHTML取得を試行
2. SPA検出（空のbody、noscriptタグ、JSフレームワーク痕跡）
3. SPA検出時は `mcp__playwright__browser_navigate` に自動切替
4. Playwright使用時はJSレンダリング完了を待機（`browser_wait_for`）

### Layer 2: 構造解析（HTML/CSS/JS完全解析）
- 10個の解析スクリプトを `browser_run_code` で実行
- 各スクリプトはJSON結果を返す

### Layer 3: 再帰クロール（deepモードのみ）
- BFS（幅優先探索）で内部リンクをクロール
- Script 11（recursive-crawler.js）でリンク収集・フィルタリング
- robots.txt を尊重（curl で事前チェック）
- depth パラメータで深度制御（1=現ページのみ、2=リンク先も、3=リンク先のリンク先も）
- Tier分け: Tier 1（全スクリプト）→ Tier 2（compact抽出）→ Tier 3（軽量要約）
- 上限: depth 2 = max 50ページ、depth 3 = max 70ページ
- セッション永続化: /tmp/url-all-session-{timestamp}.json
- compact モード: Script 00 に `window.__URL_ALL_COMPACT = true` を設定して実行

### Layer 4: Ollama分析（ローカルLLM）
- コンテンツ要約: qwen2.5:32b
- 技術分析・スコアリング: qwen3-coder:30b
- 軽量要約: qwen3:8b

### Layer 5: スコアリング
- Ollamaが4軸×100点スコアリングを実行（Claude自身はスコアリングしない）

### Layer 6: レポート生成
- Ollama qwen2.5:32b が統合レポートを生成
- Markdown形式レポート
- JSON形式データ（機械可読）
- スクリーンショット保存

---

## 前提条件チェック

スキル実行前に必ず以下を確認:

```bash
# 1. Ollama稼働確認
curl -s http://localhost:11434/api/tags | jq '.models[].name'

# 2. 必要モデルの存在確認
# 期待: qwen2.5:32b, qwen3:8b, qwen3-coder:30b のいずれかが存在
```

Ollamaが未起動の場合: `ollama serve &` を実行してから再試行。
モデルが未インストールの場合: `ollama pull qwen2.5:32b` 等を案内。

---

## 実行フロー

### quick モード
```
1. URL正規化（Layer 0）
2. WebFetch で HTML + テキスト取得（Layer 1）
3. 取得したコンテンツをOllamaで要約:
   Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
     "qwen2.5:32b" \
     "あなたはWebページ分析の専門家です。以下のWebページのテキストを分析し、日本語で要約してください。ページ概要、主要コンテンツ、重要リンクを含めてください。" \
     "[WebFetchで取得したテキスト]"
4. Ollamaの応答をそのまま表示
```

### standard モード（デフォルト）
```
==== Step 0: 前提条件チェック ====

0. Ollama稼働確認:
   Bash: curl -s http://localhost:11434/api/tags | jq -r '.models[].name'
   → qwen2.5:32b, qwen3-coder:30b の存在を確認

==== Phase 1: データ抽出（Playwright / ローカル） ====

1. URL正規化（Layer 0）
2. Playwright でページを開く:
   mcp__playwright__browser_navigate url=<URL>
3. ページ読み込み完了を待機:
   mcp__playwright__browser_wait_for time=3

4. Script 00 - コンテンツ完全抽出（必須・最初に実行）:
   mcp__playwright__browser_run_code code=<00-content-extraction.js の内容>
   → 見出し・段落・コード例・リスト・テーブル・画像・動画・リンクを
     構造化JSONとして取得
   → fullText フィールドでプレーンテキスト版も取得
   → 結果を CONTENT_JSON として保持

5. スクリーンショット取得:
   mcp__playwright__browser_take_screenshot type=png filename=url-all-screenshot.png

6. 技術分析スクリプト実行（01-10）:
   Script 01 - ページ構造 (メタタグ・JSON-LD・DOM統計)
   Script 02 - CSS解析 (色・フォント・レイアウト)
   Script 03 - リンクグラフ (リンク分類・外部ドメイン)
   Script 04 - メディア棚卸し (画像・動画・SVG詳細)
   Script 05 - フォーム分析
   Script 06 - 技術検出 (フレームワーク・ライブラリ)
   Script 07 - アクセシビリティ
   Script 08 - セキュリティ
   Script 09 - パフォーマンス
   Script 10 - レスポンシブ
   → 各結果を TECH_JSON として保持

7. HTTP応答ヘッダー取得:
   Bash: curl -sI -L --max-time 10 "<URL>" 2>/dev/null | head -50
   → HEADERS として保持

8. ブラウザを閉じる:
   mcp__playwright__browser_close

==== Phase 2: Ollama分析（ローカルLLM） ====

9. コンテンツ要約（qwen2.5:32b）:
   Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
     "qwen2.5:32b" \
     "あなたはWebページ分析の専門家です。以下のJSON形式で抽出されたWebページのコンテンツデータを分析し、日本語で包括的な要約を作成してください。出力形式: ## ページ概要（3-5文）## 主要コンテンツ（箇条書き）## 画像・メディア ## 重要リンク" \
     "[CONTENT_JSON をここに埋め込む]"
   → 応答を CONTENT_SUMMARY として保存

10. 技術分析・スコアリング（qwen3-coder:30b）:
    Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
      "qwen3-coder:30b" \
      "あなたはWeb技術の専門家です。以下のJSON形式の技術分析データに基づいて、4軸スコアリングと改善提案を行ってください。必ず以下のJSON形式で出力: {\"scores\":{\"seo\":0-100,\"accessibility\":0-100,\"security\":0-100,\"performance\":0-100},\"overall\":0-100,\"grade\":\"A-F\",\"summary\":\"総合サマリー\",\"improvements\":[{\"priority\":\"high/medium/low\",\"category\":\"カテゴリ\",\"description\":\"改善内容\"}]}" \
      "[全TECH_JSON + HEADERS をここに埋め込む]" \
      "json"
    → 応答を TECH_ANALYSIS として保存（JSON形式）

==== Phase 3: レポート生成（qwen2.5:32b） ====

11. 統合レポート生成:
    Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
      "qwen2.5:32b" \
      "以下のコンテンツ要約と技術分析を統合し、Markdown形式の完全なレポートを生成してください。構成: # URL完全把握レポート ## Part 1: コンテンツまとめ ## Part 2: 技術構造 ## Part 3: スコアカード（表形式） ## Part 4: 改善提案（優先度付き）" \
      "対象URL: [URL]\n解析日時: [timestamp]\n\nコンテンツ要約:\n[CONTENT_SUMMARY]\n\n技術分析:\n[TECH_ANALYSIS]"
    → レポートを url-all-report-{domain}-{timestamp}.md として保存

==== Phase 4: 結果表示 ====

12. コンソール出力（Ollamaの応答をそのまま表示）:
    # URL完全把握: {URL}
    [CONTENT_SUMMARY をそのまま表示]
    [TECH_ANALYSIS のスコア部分を表示]
    📄 詳細レポート: url-all-report-{domain}-{timestamp}.md
```

### deep モード（再帰クロール）

**目的**: 起点URLだけでなく、リンク先のリンク先まで再帰的に辿り、サイト全体の内容を把握する。

#### Tier分け（分析深度）
| Tier | 対象 | 実行スクリプト | Ollamaモデル | 所要時間/ページ |
|------|------|--------------|-------------|----------------|
| Tier 1 | 起点URL | 00(full) + 01-10 全スクリプト | qwen2.5:32b + qwen3-coder:30b | 60-120秒 |
| Tier 2 | Depth 2 リンク先 | 00(compact) + 11(crawler) | qwen3:8b（高速要約） | 10-20秒 |
| Tier 3 | Depth 3 リンク先 | 12(summarizer)のみ | qwen3:8b（超軽量要約） | 5-10秒 |

#### URL管理ルール
- **同一ドメイン優先**: 外部リンクはリスト記録のみ、再帰対象外（サブドメインは含む）
- **URL正規化**: UTMパラメータ除去、trailing slash統一、fragment除去
- **訪問済みSet**: 重複訪問を防止
- **上限**: depth 2 = max 50ページ、depth 3 = max 70ページ
- **robots.txt**: `/robots.txt` を最初に `curl` で取得しチェック
- **除外パターン**: `/login`, `/signup`, `/admin`, `/api/`, `.pdf`, `.zip` 等

#### セッション永続化
- クロール状態を `/tmp/url-all-session-{timestamp}.json` に保存
- 各ページ分析結果も同ファイルに追記
- クラッシュ時に再開可能（訪問済みURLをスキップ）

#### 実行フロー
```
==== Step 0: 前提条件チェック ====
Ollama稼働確認 + モデル存在確認（standard と同じ）

==== Step 1-8: 起点URL の Tier 1 完全分析 ====

1. URL正規化（Layer 0）
2. robots.txt チェック:
   Bash: curl -s "https://{domain}/robots.txt" | head -30
3. Playwright でページを開く:
   mcp__playwright__browser_navigate url=<URL>
4. Script 00（コンテンツ完全抽出 / full mode）実行
5. Script 11（recursive-crawler）実行:
   → 同一ドメインの内部リンク一覧を取得（max 50件）
6. 技術スクリプト 01-10 実行（起点URLのみ）
7. ブラウザを閉じる
8. Ollama分析（standard モードの Phase 2-3 と同じ手順）:
   - qwen2.5:32b でコンテンツ要約
   - qwen3-coder:30b で技術分析・スコアリング
9. セッションファイル作成: /tmp/url-all-session-{timestamp}.json
   内容: { visitedUrls: [...], queue: [...], results: [...] }

==== Step 9-10: Depth 2 - リンク先の内容把握（qwen3:8b） ====

10. 内部リンク一覧から、以下の順で最大50件を選択:
    (a) content セクションのリンク優先
    (b) sidebar セクション
    (c) navigation セクション
    (d) header/footer は後回し

11. 各リンクに対してバッチ処理（10件ずつ）:
    (a) mcp__playwright__browser_navigate url=<リンク先URL>
    (b) compact モード有効化:
        mcp__playwright__browser_evaluate function="() => { window.__URL_ALL_COMPACT = true }"
    (c) Script 00（compact mode）実行
    (d) Script 11（recursive-crawler）実行（depth 3 用のリンク収集）
    (e) Ollama軽量要約（qwen3:8b）:
        Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
          "qwen3:8b" \
          "あなたはWebページの要約を作成する専門家です。簡潔かつ正確に要約してください。" \
          "以下のWebページデータを100文字以内で日本語要約してください。タイトル、主要内容、ページの目的を含めてください。\n\n[compact JSON]"
    (f) 結果をセッションファイルに追記
    (g) 10件処理ごとにユーザーに進捗報告

==== Step 11-12: Depth 3（qwen3:8b 超軽量要約） ====

12. --depth=3 が指定された場合のみ実行
13. Depth 2 で発見された新規リンク（未訪問）から最大20件を選択
14. 各リンクに対して:
    (a) mcp__playwright__browser_navigate url=<リンク先URL>
    (b) Script 12（page-summarizer）実行
    (c) Ollama超軽量要約（qwen3:8b）:
        Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
          "qwen3:8b" \
          "50文字以内で簡潔にWebページを要約してください。" \
          "以下のページデータを50文字で要約（タイトルと概要のみ）:\n\n[summarizer JSON]"
    (d) 結果をセッションファイルに追記

==== Step 13: 統合レポート生成（qwen2.5:32b） ====

15. 全Tier結果を統合:
    Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
      "qwen2.5:32b" \
      "あなたはWebサイトの深層分析レポート作成の専門家です。起点ページとクロールで発見された全ページの情報を統合し、Markdown形式の完全なレポートを生成してください。構成: # 深層クロールレポート ## サイト概要 ## 起点ページ詳細 ## 発見ページ一覧 ## コンテンツ全体の傾向 ## サイトマップ" \
      "起点URL: [URL]\n起点ページ分析: [Tier1結果]\nTier2要約: [各ページ要約一覧]\nTier3要約: [各ページ要約一覧]\nサイトマップ: [リンクグラフ]\n外部リンク: [外部リンク一覧]"
16. レポートを保存:
    url-all-deep-{domain}-{timestamp}.md
17. mcp__playwright__browser_close
```

### competitive モード
```
1. 各URLに対して standard モードの Phase 1-2 を実行（データ抽出 + Ollama分析）
2. 全サイトの結果を統合して比較分析:
   Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
     "qwen2.5:32b" \
     "あなたはWebサイト競合分析の専門家です。複数サイトの分析データを比較し、日本語で詳細な比較レポートを生成してください。構成: ## 横並び比較（表形式）## 強み・弱み分析 ## 改善提案" \
     "サイト1: [URL1]\n要約: [要約1]\nスコア: [スコア1]\n\nサイト2: [URL2]\n要約: [要約2]\nスコア: [スコア2]"
3. Ollamaの比較レポートをそのまま表示
```

### seo モード
```
1. standard モードの Script 01, 03, 06, 09 を実行
2. HTTP応答ヘッダー取得
3. Ollama SEO分析（qwen3-coder:30b）:
   Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
     "qwen3-coder:30b" \
     "あなたはSEOの専門家です。以下のWebページ技術データを分析し、SEO最適化の観点から詳細な評価と改善ロードマップを提供してください。チェック項目: タイトルタグ(30-60文字), メタディスクリプション(120-160文字), H1ユニーク性, 画像alt属性, 内部リンク構造, canonical, robots.txt/sitemap.xml, OG/Twitter Card, JSON-LD, モバイルフレンドリネス" \
     "[Script 01,03,06,09 の結果 + ヘッダー]" \
     "json"
4. Ollamaの分析結果をそのまま表示
```

### audit モード
```
1. standard モードの Script 07, 08 を実行
2. セキュリティ追加チェック:
   Bash: curl -sI -L --max-time 10 "<URL>" 2>/dev/null | head -50
3. Ollama監査分析（qwen3-coder:30b）:
   Bash: bash "$HOME/.claude/skills/url-all/scripts/ollama-call.sh" \
     "qwen3-coder:30b" \
     "あなたはWebセキュリティとアクセシビリティの監査専門家です。以下のデータに基づいて、セキュリティヘッダー評価、WCAG準拠チェック、修正優先度リストを日本語で作成してください。" \
     "[Script 07,08 の結果 + ヘッダー]"
4. Ollamaの監査レポートをそのまま表示
```

### links モード
```
1. Playwright でページを開く
2. Script 03（リンクグラフ）を実行
3. 全リンクを以下に分類:
   - 内部リンク（パス別グループ化）
   - 外部リンク（ドメイン別グループ化）
   - CTA・ナビゲーション・フッター・ソーシャル
4. サイトマップ構造をツリー表示
5. リンク切れチェック（上位20件をWebFetchで検証）
```

---

## 解析スクリプト仕様

各スクリプトは `.claude/skills/url-all/scripts/` に配置。
`browser_run_code` で実行可能な `async (page) => { ... }` 形式。

| # | ファイル | 抽出内容 |
|---|---------|---------|
| **00** | **content-extraction.js** | **全文テキスト, 見出し, 段落, コード例, リスト, テーブル, 画像(文脈付き), 動画, 引用, リンク(文脈付き), 推定読了時間** |
| 01 | page-structure.js | タイトル, メタタグ, 見出しツリー, セマンティック要素, JSON-LD, OG/Twitter, DOM統計 |
| 02 | css-design-analysis.js | カラーパレット, フォント, タイポグラフィスケール, Flexbox/Grid, CSS変数, アニメーション, メディアクエリ |
| 03 | link-graph.js | 全リンク分類（内部/外部/CTA/ナビ/フッター/ソーシャル）, リンクテキスト, rel属性, 外部ドメイン |
| 04 | media-inventory.js | 画像（src/alt/サイズ/loading）, 動画, SVG, iframe, アイコン, 背景画像 |
| 05 | form-analysis.js | フォーム要素, 入力タイプ, バリデーション, action URL |
| 06 | tech-detection.js | SPA検出, フレームワーク+バージョン, CDN, アナリティクス, タグマネージャー |
| 07 | accessibility-audit.js | alt属性漏れ, ARIA使用, コントラスト比, フォーカス管理, lang属性, WCAG準拠 |
| 08 | security-check.js | HTTPS, CSP, HSTS, X-Frame-Options, 混合コンテンツ, SRI |
| 09 | performance-metrics.js | Navigation Timing, リソース内訳, DOM要素数, ブロッキングリソース |
| 10 | responsive-check.js | viewport meta, メディアクエリブレークポイント, タッチターゲットサイズ |
| **11** | **recursive-crawler.js** | **BFS再帰クロール用リンク収集, 同一ドメインフィルタ, 除外パターン, セクション分類** |
| **12** | **page-summarizer.js** | **Tier 3超軽量抽出: タイトル, 見出し(top5), 要約(top3段落), リンク数** |
| **--** | **ollama-call.sh** | **Ollama API 呼び出しヘルパー（curl wrapper）** |

### スクリプト実行方法

**重要**: スクリプトファイルを Read ツールで読み取り、その内容を `browser_run_code` の `code` パラメータに渡す。

```
手順:
1. Read tool で scripts/01-page-structure.js を読む
2. 読み取った内容を browser_run_code の code パラメータに設定
3. 返されたJSONを変数として保持
4. 次のスクリプトで繰り返す
5. 全データ収集後、Ollama に渡して分析
```

---

## スコアリングシステム（4軸×100点）

**重要: スコアリングは全て Ollama qwen3-coder:30b が実行する。Claudeはスコアを算出しない。**

Ollamaに渡すスコアリング基準:

### SEO スコア（0-100）
| 項目 | 配点 | 評価基準 |
|------|------|---------|
| メタタグ | 25% | title(10), description(10), canonical(5) |
| 見出し構造 | 20% | H1存在(10), 階層順序(5), セマンティック(5) |
| パフォーマンス | 20% | TTFB(10), ページサイズ(10) |
| モバイル対応 | 15% | viewport(5), レスポンシブ(5), タッチ(5) |
| コンテンツ | 10% | alt属性(5), 構造化データ(5) |
| 内部リンク | 10% | リンク数(5), アンカーテキスト(5) |

### Accessibility スコア（0-100）
| 項目 | 配点 | 評価基準 |
|------|------|---------|
| WCAG準拠 | 40% | 重大問題(-15/件), 深刻(-8), 中(-3), 軽微(-1) |
| ARIA | 25% | ランドマーク(10), role使用(10), aria属性(5) |
| キーボード操作 | 20% | フォーカス管理(10), スキップリンク(5), タブ順序(5) |
| コントラスト | 15% | AA準拠率 |

### Security スコア（0-100）
| 項目 | 配点 | 評価基準 |
|------|------|---------|
| HTTPS+ヘッダー | 40% | HTTPS(20), HSTS(10), X-Frame(10) |
| CSP | 30% | CSP存在(15), 適切なポリシー(15) |
| XSS防止 | 20% | インラインスクリプト(10), SRI(10) |
| プライバシー | 10% | Cookie(5), 混合コンテンツ(5) |

### Performance スコア（0-100）
| 項目 | 配点 | 評価基準 |
|------|------|---------|
| TTFB | 25% | <200ms(25), <600ms(15), <1000ms(5) |
| DOM完了 | 25% | <1s(25), <3s(15), <5s(5) |
| リソース最適化 | 25% | ページサイズ(10), 画像最適化(10), ブロッキング(5) |
| DOM要素数 | 25% | <800(25), <1500(15), <3000(5) |

### 総合スコア・グレード
```
総合 = (SEO × 0.25) + (Accessibility × 0.25) + (Security × 0.25) + (Performance × 0.25)
```

| スコア | グレード |
|--------|---------|
| 90-100 | A |
| 75-89 | B |
| 60-74 | C |
| 40-59 | D |
| 0-39 | F |

---

## 出力フォーマット

### Markdownレポート
- Ollamaが生成したレポートをそのまま保存
- ユーザーの作業ディレクトリに `url-all-report-{domain}-{timestamp}.md` として保存

### コンソール出力（常に表示）
```
# URL完全把握: {URL}（v3 ローカルLLM分析）

## このページの内容（Ollama qwen2.5:32b 分析）
{Ollamaのコンテンツ要約をそのまま表示}

## 技術スコア（Ollama qwen3-coder:30b 分析）
SEO: {N}/100 | A11y: {N}/100 | Security: {N}/100 | Performance: {N}/100

📄 詳細レポート: url-all-report-{domain}-{timestamp}.md
```

---

## HTTP応答ヘッダー取得（audit/standardモード）

セキュリティヘッダーの完全チェックにはHTTP応答ヘッダーが必要。
`browser_run_code` ではアクセスできないため、Bashの `curl` を使用：

```bash
curl -sI -L --max-time 10 "{{URL}}" 2>/dev/null | head -50
```

確認するヘッダー:
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP)
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-XSS-Protection`（レガシーだが確認）

---

## エラーハンドリング

| エラー | 対処 |
|--------|------|
| Ollama未起動 | `ollama serve &` の実行を案内 |
| モデル未インストール | `ollama pull <model>` を案内 |
| Ollama応答タイムアウト | 5分タイムアウト、qwen3:8b にフォールバック |
| Playwrightブラウザ未インストール | `browser_install` を実行してリトライ |
| ページ読み込みタイムアウト | WebFetchにフォールバック、quickモードで実行 |
| cross-originスタイルシート | CSS解析でスキップ、注記をレポートに追加 |
| JavaScript無効ページ | WebFetchの結果をそのまま使用 |
| robots.txt でブロック | ユーザーに通知、クロールを中止 |
| 認証が必要なページ | ユーザーに通知、Playwrightでログイン操作を案内 |
| Ollamaの応答がJSON不正 | リトライ1回、それでも失敗ならテキスト出力に切替 |

---

## 使用例

### 基本使用
```
/url-all https://example.com
→ standard モードで全10スクリプト実行
→ qwen2.5:32b でコンテンツ要約
→ qwen3-coder:30b で技術スコアリング
→ qwen2.5:32b で統合レポート生成
```

### 高速チェック
```
/url-all https://example.com --mode=quick
→ WebFetchのみで基本情報を素早く取得
→ qwen2.5:32b で要約
```

### 深層クロール（depth 2）
```
/url-all https://example.com --mode=deep --depth=2
→ 起点ページ: qwen2.5:32b + qwen3-coder:30b で完全分析
→ リンク先(max 50): qwen3:8b で高速要約
→ qwen2.5:32b で統合レポート生成
```

### 深層クロール（depth 3）
```
/url-all https://example.com --mode=deep --depth=3
→ 起点: 完全分析
→ リンク先: qwen3:8b で要約
→ リンク先のリンク先: qwen3:8b で超軽量要約
→ qwen2.5:32b で統合レポート生成
```

### 競合比較
```
/url-all https://mysite.com https://competitor.com --mode=competitive
→ 各サイトをOllama分析後、qwen2.5:32b で比較レポート
```

### SEO最適化
```
/url-all https://example.com --mode=seo
→ qwen3-coder:30b によるSEO特化分析と改善ロードマップ
```

### セキュリティ・アクセシビリティ監査
```
/url-all https://example.com --mode=audit
→ qwen3-coder:30b によるセキュリティヘッダー + WCAG準拠チェック
```

### リンク解析
```
/url-all https://example.com --mode=links
→ 全リンク抽出・分類・サイトマップ生成（Playwright のみ、Ollama不使用）
```
