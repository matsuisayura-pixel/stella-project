---
name: gem-research
description: 9-layer research for Marketing AI
  Marketing AI Factory向け9層リサーチシステム。world-research v2.0の6層を基盤に、
  マーケティング特化の3層（競合AI分析/顧客の声/マーケティングパターン）を追加。
  Gem自動生成に必要なキーワード・ペルソナ・トーン・CTA・競合分析をSkillConfig互換JSONで出力。
  トリガー: 「gemリサーチ」「gem調査」「gem-research」「マーケティングリサーチ」
           「競合AI分析」「顧客の声リサーチ」「業界リサーチ」
argument-hint: "[業界/トピック] [--mode=quick|standard|deep|industry] [--preset=beauty-salon|restaurant|coach-consultant|ec-shop]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - Bash
  - Task
  - Skill
model: opus
disable-model-invocation: true
---

# Gem Research - 9層マーケティングリサーチシステム v1.0

## 概要

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    GEM RESEARCH SYSTEM v1.0                                  │
│          9層アーキテクチャ × 4モード × SkillConfig互換出力                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                    Layer 1-6: world-research v2.0 委譲                 │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ ┌────┐ ┌────────┐  │  │
│  │  │L1:学術  │ │L2:キュレ │ │L3:ブログ │ │L4:実装│ │L5: │ │L6:     │  │  │
│  │  │論文     │ │ーション  │ │解説      │ │エコ   │ │SNS │ │コミュニ│  │  │
│  │  │         │ │          │ │          │ │システム│ │    │ │ティ    │  │  │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ └───┬───┘ └─┬──┘ └───┬────┘  │  │
│  │       └───────────┴────────────┴────────────┴───────┴────────┘        │  │
│  └───────────────────────────────┬────────────────────────────────────────┘  │
│                                  │                                           │
│  ┌───────────────────────────────┼────────────────────────────────────────┐  │
│  │              Marketing-Specific Layers (Layer 7-9)                     │  │
│  │                               │                                        │  │
│  │  ┌────────────────┐ ┌────────┴───────┐ ┌──────────────────────────┐   │  │
│  │  │  Layer 7       │ │   Layer 8      │ │  Layer 9                │   │  │
│  │  │  Competitor AI │ │  Customer      │ │  Marketing              │   │  │
│  │  │  Analysis      │ │  Voice         │ │  Pattern                │   │  │
│  │  │  ───────────── │ │  ──────────── │ │  ─────────────────────  │   │  │
│  │  │  ・GPTs Store  │ │  ・レビュー   │ │  ・LP構成分析          │   │  │
│  │  │  ・Gems Gallery│ │  ・口コミ     │ │  ・コピーライティング  │   │  │
│  │  │  ・Claude Proj │ │  ・SNSの声    │ │  ・SEOキーワード       │   │  │
│  │  │  ・Poe/Coze   │ │  ・Yahoo知恵袋│ │  ・ハッシュタグ        │   │  │
│  │  │  ・Dify Apps  │ │  ・教えてgoo  │ │  ・CTAパターン         │   │  │
│  │  │  ・note有料   │ │  ・フォーラム │ │  ・メールマーケ        │   │  │
│  │  └───────┬────────┘ └───────┬────────┘ └───────────┬──────────────┘   │  │
│  │          └──────────────────┼──────────────────────┘                   │  │
│  └─────────────────────────────┼──────────────────────────────────────────┘  │
│                                ▼                                             │
│              ┌───────────────────────────────┐                               │
│              │     Trust Score Engine         │                               │
│              │  DA(0.25) + Fresh(0.2)         │                               │
│              │  + CrossVal(0.3) + Cite(0.15)  │                               │
│              │  + SNS(0.1)                    │                               │
│              └──────────────┬────────────────┘                               │
│                             ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                  SkillConfig互換JSON出力                                │  │
│  │  keywords(25+) / persona / tone / content_types / platforms            │  │
│  │  hashtags / cta_templates / competitor_analysis / customer_voice        │  │
│  │  marketing_patterns / trust_scores                                     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ✅ APIキー不要(quick/standard/industry)  ✅ world-research v2.0委譲        │
│  ✅ 信頼スコア付き                        ✅ SkillConfig互換出力            │
│  ✅ 4業界プリセット内蔵                   ✅ 9層133+ソース                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 使い方

```bash
# クイックリサーチ（30-60秒）
/gem-research 美容サロン --mode=quick

# 標準リサーチ（2-5分）
/gem-research パーソナルトレーニング --mode=standard

# 深層リサーチ（10-20分、APIキー推奨）
/gem-research オンライン英会話 --mode=deep

# 業界プリセット（1-3分）
/gem-research --preset=beauty-salon
/gem-research --preset=restaurant
/gem-research --preset=coach-consultant
/gem-research --preset=ec-shop

# カスタム業界 + 標準モード
/gem-research 不動産投資 --mode=standard

# 特定レイヤーのみ
/gem-research 整体院 --layers=7,8,9
```

---

## 4つのモード

### quick（30-60秒 / 10-15ソース / APIキー不要）

概要把握向け。Layer 7-9のみ実行。

```
実行内容:
├── Layer 7: 競合AI検索（WebSearch x2）
├── Layer 8: 顧客の声検索（WebSearch x2）
├── Layer 9: マーケティングパターン（WebSearch x2）
└── 統合: SkillConfig JSON生成
```

### standard（2-5分 / 30-50ソース / APIキー不要）

標準リサーチ。Layer 5-9を実行。

```
実行内容:
├── Layer 5: SNS検索（X/Instagram/YouTube/note）
├── Layer 6: コミュニティ検索（Yahoo知恵袋/教えてgoo/Reddit）
├── Layer 7: 競合AI分析（GPTs/Gems/Claude Projects/Poe/Dify）
├── Layer 8: 顧客の声（レビュー/口コミ/SNS声）
├── Layer 9: マーケティングパターン（LP/コピー/SEO/ハッシュタグ）
└── 統合: SkillConfig JSON + レポート生成
```

### deep（10-20分 / 80-150ソース / APIキー推奨）

徹底調査。全9層を実行。world-researchスキルに委譲。

```
実行内容:
├── Layer 1-6: /world-research キーワード={topic} モード=standard に委譲
├── Layer 7: 競合AI分析（詳細版）
├── Layer 8: 顧客の声（詳細版 + note-research委譲）
├── Layer 9: マーケティングパターン（詳細版）
└── 統合: SkillConfig JSON + 詳細レポート生成
```

### industry（1-3分 / プリセット依存 / APIキー不要）

業界プリセットを使用。プリセットのシードデータ + Layer 7-9の最新検索を統合。

```
実行内容:
├── プリセット読み込み（.claude/skills/gem-research/presets/{preset}.yaml）
├── Layer 7: プリセット競合リスト + 最新検索
├── Layer 8: プリセットペルソナ + 最新声
├── Layer 9: プリセットマーケティングパターン + 最新トレンド
└── 統合: プリセット + 最新データのマージ → SkillConfig JSON
```

---

## Layer 7: Competitor AI Analysis（競合AI分析）

### 検索対象

| プラットフォーム | 検索方法 | URL/クエリ |
|----------------|----------|------------|
| **GPTs Store** | WebSearch | `site:chatgpt.com/gpts "{業界}" OR "{キーワード}"` |
| **Google Gems** | WebSearch | `Google Gem "{業界}" AI アシスタント` |
| **Claude Projects** | WebSearch | `Claude Projects "{業界}" 活用 設定` |
| **Poe** | WebSearch | `site:poe.com "{業界}" bot` |
| **Coze** | WebSearch | `site:coze.com "{業界}" bot AI` |
| **Dify** | WebSearch | `Dify "{業界}" テンプレート ワークフロー` |
| **note有料記事** | WebSearch | `site:note.com "{業界}" AI ChatGPT プロンプト 有料` |
| **Brain/Tips** | WebSearch | `site:brain-market.com OR site:tips.jp "{業界}" AI` |

### 分析項目

```yaml
competitor_analysis:
  gpts:
    - name: "GPT名"
      description: "説明"
      rating: 4.5
      conversations: "10K+"
      features: ["機能1", "機能2"]
      pricing: "free|plus"
      url: "https://..."
  gems:
    - name: "Gem名"
      description: "説明"
      features: ["機能1", "機能2"]
  claude_projects:
    - name: "プロジェクト名"
      description: "説明"
      system_prompt_summary: "概要"
  other_platforms:
    - platform: "Poe|Coze|Dify"
      name: "Bot名"
      description: "説明"
  note_products:
    - title: "記事タイトル"
      author: "著者"
      price: 1980
      likes: 150
      url: "https://..."
  gap_analysis:
    underserved_needs: ["ニーズ1", "ニーズ2"]
    differentiation_opportunities: ["差別化ポイント1"]
    pricing_insights: "価格帯分析"
```

### 検索クエリテンプレート（Layer 7）

```
# GPTs Store検索
"{業界}" GPT ChatGPT Plus カスタムGPT 人気
"{業界}" GPTs おすすめ ランキング 2026

# Google Gems検索
"{業界}" Google Gemini Gem AI アシスタント 活用
Google Gems "{業界}" 設定 使い方

# Claude Projects検索
"{業界}" Claude Projects 活用事例
Claude "{業界}" プロンプト system instructions

# 横断比較
"{業界}" AI ツール 比較 ChatGPT Claude Gemini
"{業界}" AI 自動化 おすすめ 2026

# note有料コンテンツ
site:note.com "{業界}" ChatGPT プロンプト 有料
site:note.com "{業界}" AI 活用 テンプレート
```

---

## Layer 8: Customer Voice（顧客の声）

### 検索対象

| ソース | 検索方法 | 取得内容 |
|--------|----------|----------|
| **Yahoo知恵袋** | WebSearch | 悩み・質問・不満 |
| **教えてgoo** | WebSearch | 悩み・質問 |
| **Google レビュー** | WebSearch | 店舗/サービスレビュー |
| **X (Twitter)** | WebSearch | リアルタイムの声 |
| **Instagram** | WebSearch | ビジュアル + キャプション |
| **note.com** | WebSearch/note-research委譲 | 体験談・レビュー記事 |
| **Reddit** | WebSearch | 英語圏の声 |
| **Amazon レビュー** | WebSearch | 関連商品レビュー |
| **みん評/価格.com** | WebSearch | サービス口コミ |
| **Google Maps** | WebSearch | ローカルビジネスレビュー |

### 分析項目

```yaml
customer_voice:
  concerns:          # 悩み・不安
    - concern: "悩みの内容"
      frequency: "high|medium|low"
      source: "Yahoo知恵袋"
      example_quote: "実際の声"
  motivations:       # 動機・欲求
    - motivation: "動機の内容"
      frequency: "high|medium|low"
      source: "X"
      example_quote: "実際の声"
  barriers:          # 購入障壁
    - barrier: "障壁の内容"
      frequency: "high|medium|low"
      source: "Google レビュー"
      example_quote: "実際の声"
  pain_points:       # ペインポイント
    - pain: "ペインの内容"
      severity: "critical|high|medium|low"
      source: "みん評"
  desires:           # 願望・理想
    - desire: "願望の内容"
      frequency: "high|medium|low"
      source: "Instagram"
  objections:        # 反論・反対意見
    - objection: "反論の内容"
      frequency: "high|medium|low"
      rebuttal_hint: "反論への対処ヒント"
  language_patterns:  # 実際に使われる言葉
    - phrase: "よく使われるフレーズ"
      context: "使用文脈"
      frequency: "high|medium|low"
```

### 検索クエリテンプレート（Layer 8）

```
# Yahoo知恵袋
site:detail.chiebukuro.yahoo.co.jp "{業界}" 悩み
site:detail.chiebukuro.yahoo.co.jp "{業界}" おすすめ
site:detail.chiebukuro.yahoo.co.jp "{業界}" 失敗 後悔

# 教えてgoo
site:oshiete.goo.ne.jp "{業界}" 相談
site:oshiete.goo.ne.jp "{業界}" 選び方

# レビュー・口コミ
"{業界}" 口コミ 評判 体験談
"{業界}" レビュー メリット デメリット
site:minhyo.jp "{業界}"

# SNSの声
"{業界}" 感想 site:twitter.com OR site:x.com
"{業界}" 体験 #(業界ハッシュタグ)

# note体験談
site:note.com "{業界}" 体験談 感想

# 英語圏
"{industry_en}" reddit review experience
"{industry_en}" honest review pros cons
```

---

## Layer 9: Marketing Pattern（マーケティングパターン）

### 検索対象

| カテゴリ | 検索方法 | 取得内容 |
|----------|----------|----------|
| **LP構成** | WebSearch + WebFetch | ヘッドライン/CTA/構成パターン |
| **コピーライティング** | WebSearch | キャッチコピー/ベネフィット表現 |
| **SEOキーワード** | WebSearch | 検索ボリューム/関連KW |
| **ハッシュタグ** | WebSearch | プラットフォーム別タグ |
| **CTAパターン** | WebSearch | ボタン文言/申込みフロー |
| **メールマーケティング** | WebSearch | 件名パターン/配信構成 |
| **広告コピー** | WebSearch | リスティング/SNS広告文 |

### 分析項目

```yaml
marketing_patterns:
  lp_analysis:
    headlines:
      - headline: "ヘッドラインテキスト"
        type: "問題提起|ベネフィット|数字|権威|緊急性"
        source_url: "https://..."
    structures:
      - pattern: "構成パターン名"
        sections: ["ヘッドライン", "問題提起", "解決策", "証拠", "CTA"]
        effectiveness: "high|medium"
    cta_buttons:
      - text: "ボタンテキスト"
        context: "使用場面"
        frequency: "high|medium|low"
  copywriting:
    power_words:       # パワーワード
      - word: "無料"
        category: "価格訴求"
        effectiveness: "high"
    benefit_phrases:   # ベネフィット表現
      - phrase: "たった3分で"
        category: "時間短縮"
    emotional_triggers: # 感情トリガー
      - trigger: "限定"
        emotion: "希少性"
        usage: "申込みCTA周辺"
  seo:
    primary_keywords:
      - keyword: "メインキーワード"
        volume_estimate: "high|medium|low"
        difficulty_estimate: "high|medium|low"
        intent: "informational|commercial|transactional|navigational"
    long_tail_keywords:
      - keyword: "ロングテールKW"
        intent: "transactional"
    related_keywords:
      - keyword: "関連KW"
        relation: "synonym|broader|narrower"
  hashtags:
    instagram:
      mega: ["#大規模タグ(100万+)"]
      large: ["#大タグ(10万+)"]
      medium: ["#中タグ(1万+)"]
      niche: ["#ニッチタグ(1000+)"]
    x_twitter:
      trending: ["トレンドタグ"]
      evergreen: ["定番タグ"]
    tiktok:
      viral: ["バイラルタグ"]
      niche: ["ニッチタグ"]
    youtube:
      search: ["検索用タグ"]
      trending: ["トレンドタグ"]
  cta_templates:
    - text: "CTAテキスト"
      type: "申込み|相談|資料請求|無料体験|LINE登録"
      urgency: "high|medium|low"
      context: "使用場面"
  email_patterns:
    subject_lines:
      - subject: "件名パターン"
        open_rate_hint: "high|medium"
        type: "curiosity|benefit|urgency|personal"
    sequences:
      - name: "シーケンス名"
        steps: ["ステップ1概要", "ステップ2概要"]
        goal: "目標"
```

### 検索クエリテンプレート（Layer 9）

```
# LP分析
"{業界}" ランディングページ デザイン 構成
"{業界}" LP 成約率 改善
"{業界}" 集客 ページ おすすめ

# コピーライティング
"{業界}" キャッチコピー 集客
"{業界}" 広告 文言 コピー
"{業界}" セールスレター テンプレート

# SEOキーワード
"{業界}" 検索 キーワード おすすめ
"{業界}" SEO 対策 方法
"{業界}" サジェスト 関連キーワード

# ハッシュタグ
"{業界}" Instagram ハッシュタグ おすすめ
"{業界}" TikTok ハッシュタグ バズ
"{業界}" X Twitter ハッシュタグ

# CTAパターン
"{業界}" 申込み ボタン テキスト
"{業界}" LINE登録 特典 無料
"{業界}" 無料体験 申込み

# メールマーケティング
"{業界}" メルマガ 件名 開封率
"{業界}" ステップメール 構成
```

---

## 信頼スコアエンジン (Trust Score)

全ソースに対して0-100の信頼スコアを算出。

### スコア計算式

```
Trust Score = DA(0.25) + Freshness(0.2) + CrossValidation(0.3) + Citations(0.15) + SNS(0.1)
```

| 指標 | 重み | 算出方法 |
|------|------|----------|
| **Domain Authority (DA)** | 0.25 | ドメインの信頼性（公式サイト=高, 個人ブログ=中, SNS=低） |
| **Freshness** | 0.20 | 情報の新しさ（1ヶ月以内=100, 3ヶ月=80, 6ヶ月=60, 1年=40, それ以上=20） |
| **Cross Validation** | 0.30 | 複数ソースでの裏付け（3+ソース=100, 2=70, 1=40） |
| **Citations** | 0.15 | 引用・参照の有無と質 |
| **SNS Engagement** | 0.10 | いいね/RT/コメント数 |

### DAランク

| ランク | スコア | 例 |
|--------|--------|-----|
| S | 90-100 | 官公庁、大手メディア、学術機関 |
| A | 70-89 | 業界大手サイト、専門メディア |
| B | 50-69 | 中規模メディア、専門ブログ |
| C | 30-49 | 個人ブログ、SNS投稿 |
| D | 10-29 | 匿名掲示板、未検証情報 |

---

## 実行フロー詳細

### quick モード

```
入力: /gem-research 美容サロン --mode=quick

Step 1: キーワード準備
  美容サロン → 美容室, エステ, ヘアサロン, beauty salon
  業界特化KW → 予約, 集客, リピート, 単価アップ

Step 2: Layer 7 競合AI検索（バッチ1: WebSearch x3）
  ├── "美容サロン GPTs ChatGPT おすすめ 2026"
  ├── "美容サロン AI ツール 自動化"
  └── "美容サロン Claude Gemini 活用"

Step 3: Layer 8 顧客の声（バッチ2: WebSearch x3）
  ├── site:detail.chiebukuro.yahoo.co.jp "美容サロン" 悩み
  ├── "美容サロン 口コミ 不満 改善"
  └── "美容サロン 選び方 ポイント"

Step 4: Layer 9 マーケティングパターン（バッチ3: WebSearch x3）
  ├── "美容サロン 集客 方法 2026"
  ├── "美容サロン Instagram ハッシュタグ"
  └── "美容サロン LP ランディングページ"

Step 5: 統合 → SkillConfig JSON出力
```

### standard モード

```
入力: /gem-research パーソナルトレーニング --mode=standard

Step 1: キーワード展開
  パーソナルトレーニング → パーソナルジム, PT, 筋トレ, ダイエット, personal training
  業界特化KW → 体験, 入会, 料金, 効果, ビフォーアフター

Step 2: Layer 5 SNS検索（バッチ1: WebSearch x3）
  ├── "パーソナルトレーニング" site:x.com OR site:twitter.com 人気
  ├── "パーソナルジム" Instagram おすすめ ハッシュタグ
  └── "パーソナルトレーニング" YouTube おすすめ チャンネル

Step 3: Layer 6 コミュニティ検索（バッチ2: WebSearch x3）
  ├── site:detail.chiebukuro.yahoo.co.jp "パーソナルトレーニング"
  ├── site:oshiete.goo.ne.jp "パーソナルジム" 選び方
  └── "パーソナルトレーニング" Reddit review

Step 4: Layer 7 競合AI分析（バッチ3: WebSearch x3）
  ├── "パーソナルトレーニング" GPTs ChatGPT 食事管理 AI
  ├── "パーソナルトレーナー" AI ツール 顧客管理
  └── site:note.com "パーソナルトレーニング" AI プロンプト 有料

Step 5: Layer 8 顧客の声（バッチ4: WebSearch x3）
  ├── "パーソナルジム" 口コミ 体験談 効果
  ├── "パーソナルトレーニング" 失敗 後悔 やめた
  └── "パーソナルジム" 料金 高い 安い 比較

Step 6: Layer 9 マーケティングパターン（バッチ5: WebSearch x3）
  ├── "パーソナルジム" LP 集客 ランディングページ
  ├── "パーソナルトレーニング" SEO キーワード
  └── "パーソナルジム" 広告 コピー CTA 入会

Step 7: 重要URLのWebFetch（バッチ6: WebFetch x2-3）
  → 上位LP、競合GPTsの詳細ページなど

Step 8: 信頼スコア算出 + 統合

Step 9: SkillConfig JSON + レポート出力
```

### deep モード

```
入力: /gem-research オンライン英会話 --mode=deep

Step 1: Layer 1-6 → world-researchスキルに委譲
  /world-research キーワード=オンライン英会話 モード=standard
  → 学術/キュレーション/ブログ/エコシステム/SNS/コミュニティのデータ取得

Step 2: Layer 7 競合AI分析（詳細版）
  バッチ1: WebSearch x3
  ├── "オンライン英会話" GPTs ChatGPT 英語学習 AI
  ├── "英会話" Google Gem Gemini AI 学習
  └── "English conversation" GPTs popular 2026
  バッチ2: WebSearch x3
  ├── site:note.com "オンライン英会話" AI プロンプト 有料
  ├── "英語学習" Poe Coze Dify bot AI
  └── "オンライン英会話" AI 比較 おすすめ ランキング
  バッチ3: WebFetch x2-3（競合GPTs/Gemsの詳細ページ）

Step 3: Layer 8 顧客の声（詳細版）
  バッチ4: WebSearch x3
  ├── site:detail.chiebukuro.yahoo.co.jp "オンライン英会話" 効果 悩み
  ├── "オンライン英会話" 口コミ 比較 体験談
  └── "オンライン英会話" 続かない 挫折 理由
  バッチ5: WebSearch x3
  ├── "online English" reddit review honest
  ├── "オンライン英会話" Twitter 感想 体験
  └── site:minhyo.jp "オンライン英会話"
  + note-researchスキルに委譲
  /note-research キーワード=オンライン英会話

Step 4: Layer 9 マーケティングパターン（詳細版）
  バッチ6: WebSearch x3
  ├── "オンライン英会話" LP ランディングページ 構成
  ├── "オンライン英会話" SEO キーワード ロングテール
  └── "オンライン英会話" 広告 Facebook Instagram 事例
  バッチ7: WebSearch x3
  ├── "英会話" ステップメール 構成 テンプレート
  ├── "オンライン英会話" CTA 無料体験 申込み
  └── "英語学習" ハッシュタグ Instagram TikTok YouTube
  バッチ8: WebFetch x2-3（上位LPの詳細取得）

Step 5: 全データ統合 + 信頼スコア算出

Step 6: SkillConfig JSON + 詳細レポート出力
```

### industry モード

```
入力: /gem-research --preset=beauty-salon

Step 1: プリセット読み込み
  Read(.claude/skills/gem-research/presets/beauty-salon.yaml)
  → シードキーワード、ペルソナ、競合リスト、基本パターン取得

Step 2: プリセットのシードデータで Layer 7-9 を最新化
  バッチ1: WebSearch x3（Layer 7 最新競合）
  バッチ2: WebSearch x3（Layer 8 最新の声）
  バッチ3: WebSearch x3（Layer 9 最新パターン）

Step 3: プリセットデータ + 最新検索データをマージ

Step 4: SkillConfig JSON + レポート出力
```

---

## 委譲パターン

### world-research への委譲（deep モード時）

```
# Layer 1-6 を world-research に委譲
Skill("world-research", args="{topic} --mode=standard")

# world-research の出力を取得し、Layer 7-9 のデータと統合
```

### note-research への委譲（deep モード時）

```
# note.com のデータ取得を note-research に委譲
Skill("note-research", args="キーワード={topic}")

# note-research の出力を Layer 8 (Customer Voice) に統合
```

---

## SkillConfig互換 出力スキーマ

gem-researchの出力は、Marketing AI Factory の `system_instructions.py` でそのまま利用可能。

### 出力JSONの構造

```json
{
  "meta": {
    "skill": "gem-research",
    "version": "1.0",
    "mode": "standard",
    "topic": "美容サロン",
    "preset": null,
    "timestamp": "2026-02-09T12:00:00Z",
    "sources_count": 35,
    "layers_used": [5, 6, 7, 8, 9],
    "execution_time_seconds": 180
  },
  "keywords": {
    "primary": ["美容サロン", "ヘアサロン", "美容室"],
    "secondary": ["カット", "カラー", "パーマ", "トリートメント", "ヘッドスパ"],
    "long_tail": ["美容サロン 予約 当日", "美容室 おすすめ 近く"],
    "pain_point": ["美容室 失敗", "カラー 色落ち", "パーマ 傷む"],
    "benefit": ["美容サロン 仕上がり満足", "似合う髪型 提案"],
    "competitor": ["ホットペッパービューティー", "minimo", "楽天ビューティ"],
    "action": ["美容室 予約", "ヘアサロン 相談", "カウンセリング 無料"]
  },
  "persona": {
    "primary": {
      "age_range": "25-45",
      "gender": "女性中心",
      "concerns": ["髪の悩み", "似合う髪型がわからない", "サロン選びに失敗したくない"],
      "motivations": ["キレイになりたい", "自分に自信を持ちたい", "特別な日に備えたい"],
      "barriers": ["価格が高い", "予約が取りにくい", "担当者との相性"],
      "information_sources": ["Instagram", "ホットペッパービューティー", "友人の紹介"],
      "decision_factors": ["口コミ", "価格", "立地", "スタイリストの技術"]
    },
    "secondary": {
      "age_range": "20-30",
      "gender": "男性",
      "concerns": ["薄毛", "清潔感", "ビジネスヘア"],
      "motivations": ["清潔感を出したい", "モテたい"],
      "barriers": ["メンズサロンが少ない", "恥ずかしい"]
    }
  },
  "tone": {
    "voice": "親しみやすくプロフェッショナル",
    "formality": "medium",
    "emotion": "温かみ・安心感",
    "keywords_to_use": ["お似合い", "なりたい自分", "プロの技術"],
    "keywords_to_avoid": ["安い", "激安", "素人"]
  },
  "content_types": [
    "ビフォーアフター写真",
    "スタイリスト紹介",
    "ヘアケアTips",
    "お客様の声",
    "トレンドヘア紹介",
    "Q&A（よくある質問）"
  ],
  "platforms": {
    "primary": ["Instagram", "ホットペッパービューティー", "Google Maps"],
    "secondary": ["TikTok", "YouTube", "LINE公式"],
    "emerging": ["Threads", "note"]
  },
  "hashtags": {
    "instagram": {
      "mega": ["#美容室", "#ヘアスタイル", "#ヘアカラー"],
      "large": ["#ヘアアレンジ", "#トリートメント", "#ヘッドスパ"],
      "medium": ["#似合わせカット", "#透明感カラー", "#韓国ヘア"],
      "niche": ["#地名+美容室", "#スタイリスト名"]
    },
    "tiktok": ["#美容室", "#ヘアチェンジ", "#ビフォーアフター", "#韓国ヘア"],
    "youtube": ["#ヘアカット", "#セルフヘアケア", "#美容師"],
    "x_twitter": ["#美容室", "#髪型", "#ヘアスタイル"]
  },
  "cta_templates": [
    {
      "text": "無料カウンセリングを予約する",
      "type": "相談",
      "urgency": "medium",
      "context": "LP下部・サービス紹介後"
    },
    {
      "text": "LINE登録で初回20%OFF",
      "type": "LINE登録",
      "urgency": "high",
      "context": "ポップアップ・ヘッダー"
    },
    {
      "text": "あなたに似合うスタイルを見つける",
      "type": "診断",
      "urgency": "low",
      "context": "コンテンツ内CTA"
    }
  ],
  "competitor_analysis": {
    "ai_competitors": [
      {
        "platform": "GPTs",
        "name": "Hair Style Advisor",
        "features": ["顔型分析", "スタイル提案", "カラー診断"],
        "gap": "日本語対応が不十分"
      }
    ],
    "market_competitors": [
      {
        "name": "ホットペッパービューティー",
        "strength": "圧倒的な集客力",
        "weakness": "手数料が高い"
      }
    ],
    "differentiation_opportunities": [
      "パーソナルカラー×AI診断の組み合わせ",
      "LINEでのアフターケア自動化",
      "顔型×骨格診断の統合提案"
    ]
  },
  "customer_voice": {
    "top_concerns": [
      {"concern": "イメージ通りにならない", "frequency": "high", "source": "Yahoo知恵袋"},
      {"concern": "料金が不透明", "frequency": "high", "source": "Google レビュー"},
      {"concern": "予約が取れない", "frequency": "medium", "source": "X"}
    ],
    "top_motivations": [
      {"motivation": "特別な日に綺麗になりたい", "frequency": "high"},
      {"motivation": "定期的なメンテナンス", "frequency": "high"}
    ],
    "top_barriers": [
      {"barrier": "価格が高い", "frequency": "high"},
      {"barrier": "担当者との相性", "frequency": "medium"}
    ],
    "raw_quotes": [
      {"quote": "毎回違う人に担当されるのが不安...", "source": "Yahoo知恵袋"},
      {"quote": "写真見せたのに全然違う仕上がりに...", "source": "X"}
    ]
  },
  "marketing_patterns": {
    "effective_headlines": [
      "あなた史上最高の髪に出会う",
      "もう美容室選びで失敗しない"
    ],
    "effective_cta_contexts": [
      "ビフォーアフター写真の直後",
      "お客様の声セクションの後"
    ],
    "content_calendar_hints": [
      "季節の変わり目にスタイルチェンジ訴求",
      "卒業/入学シーズンの特別プラン",
      "梅雨時期のヘアケア特集"
    ],
    "pricing_insights": {
      "market_range": "3,000-15,000円",
      "sweet_spot": "5,000-8,000円",
      "premium_trigger": "パーソナル診断付き"
    }
  },
  "trust_scores": {
    "overall": 72,
    "by_layer": {
      "layer_7_competitor": 65,
      "layer_8_customer_voice": 78,
      "layer_9_marketing": 73
    },
    "high_confidence_findings": [
      "Instagram が最重要集客チャネル（複数ソース裏付け）",
      "口コミ・レビューが来店決定要因No.1"
    ],
    "low_confidence_findings": [
      "TikTok集客の効果（データ不足）"
    ]
  }
}
```

---

## バッチ制限ルール

### 並列WebSearch/WebFetch呼び出し制限

```
CRITICAL: 1バッチあたり最大3件の並列呼び出し

# GOOD: 3件以下のバッチ
バッチ1: WebSearch x3 → 完了待ち
バッチ2: WebSearch x3 → 完了待ち
バッチ3: WebFetch x2 → 完了待ち

# BAD: 4件以上の並列呼び出し
WebSearch x6 → カスケード障害リスク
```

### モード別バッチ計画

| モード | バッチ数 | WebSearch | WebFetch | 合計呼出し |
|--------|----------|-----------|----------|-----------|
| quick | 3 | 9 | 0 | 9 |
| standard | 6-7 | 15-18 | 2-3 | 17-21 |
| deep | 10-12 | 24-30 | 6-9 | 30-39 |
| industry | 3-4 | 9-12 | 0-2 | 9-14 |

---

## 出力ディレクトリ

```
research/gem/<timestamp>__<topic>/
├── input.yaml           # 入力パラメータ
├── skill_config.json    # SkillConfig互換JSON（メイン出力）
├── report.md            # マークダウンレポート
├── raw_data/
│   ├── layer7_competitors.json
│   ├── layer8_voices.json
│   └── layer9_patterns.json
└── trust_scores.json    # 信頼スコア詳細
```

---

## 出力テンプレート（レポート）

テンプレートファイル: `.claude/skills/gem-research/templates/gem_research_report.md`

```markdown
# {topic} Gemリサーチレポート

**調査日**: {date}
**モード**: {mode}
**ソース数**: {sources_count}
**使用レイヤー**: {layers_used}
**信頼スコア**: {overall_trust_score}/100

---

## エグゼクティブサマリー

{executive_summary}

---

## 1. キーワード分析

### メインキーワード
{primary_keywords}

### ロングテールキーワード
{long_tail_keywords}

### ペインポイントキーワード
{pain_point_keywords}

---

## 2. ペルソナ

### プライマリペルソナ
- **年齢層**: {age_range}
- **主な悩み**: {concerns}
- **動機**: {motivations}
- **障壁**: {barriers}

### セカンダリペルソナ
{secondary_persona}

---

## 3. 競合AI分析（Layer 7）

### 既存AI製品
| プラットフォーム | 名前 | 特徴 | ギャップ |
|----------------|------|------|---------|
{competitor_table}

### 差別化機会
{differentiation_opportunities}

---

## 4. 顧客の声（Layer 8）

### トップ悩み
{top_concerns}

### 実際の声（引用）
{raw_quotes}

### 購入障壁
{barriers_list}

---

## 5. マーケティングパターン（Layer 9）

### 効果的なヘッドライン
{effective_headlines}

### CTA推奨
{cta_recommendations}

### ハッシュタグ戦略
{hashtag_strategy}

### コンテンツカレンダーヒント
{content_calendar}

---

## 6. 信頼スコア

| レイヤー | スコア | 備考 |
|---------|--------|------|
{trust_score_table}

### 高信頼度の発見
{high_confidence}

### 要追加調査
{low_confidence}

---

## 7. 推奨アクション

{recommended_actions}

---

## ソース一覧

{sources_list}
```

---

## 制限事項

1. **バッチ制限**: 並列WebSearch/WebFetch は最大3件/バッチ（カスケード障害防止）
2. **レート制限**: 各プラットフォームのAPI制限を遵守（1秒間隔）
3. **認証**: ログイン必須データ（Instagram DM等）は取得不可
4. **deep モード**: world-research/note-research スキルの利用可能性に依存
5. **プリセット**: 4業界のみ内蔵（追加はYAML作成で可能）
6. **信頼スコア**: 推定値であり、正確なDA/検索ボリュームではない
7. **中国SNS**: 一部はアプリ内検索のみ（API非公開）
8. **Google Maps レビュー**: スクレイピング制限あり

## 関連スキル

- `world-research` - 6層総合リサーチ（Layer 1-6委譲先）
- `note-research` - note.com特化リサーチ（Layer 8委譲先）
- `research-free` - APIキー不要汎用リサーチ
- `keyword-free` - APIキー不要キーワード抽出
- `keyword-mega-extractor` - 多角的キーワード展開
- `taiyo-analyzer` - 太陽スタイル分析エンジン
- `lp-analysis` - LP分析スキル
- `sns-marketing` - SNSマーケティング運用
- `taiyo-style-sales-letter` - セールスレター作成
- `taiyo-style-headline` - ヘッドライン生成
