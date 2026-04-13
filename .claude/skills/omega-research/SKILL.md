---
name: omega-research
description: "最高精度統合リサーチ。Grok-4 Agent Tools Live Search + Exa セマンティック検索 + Tavily + Brave + NewsAPI + intelligence-research(GIS 31ソース経済指標・SNS・ニュース) + world-research(学術論文) を統合した最強スキル。市場調査・競合分析・学術研究・技術調査・経済分析に対応。トリガー: 「最高精度リサーチ」「全力リサーチ」「omega-research」「完全調査」「最強リサーチ」"
argument-hint: "[トピック] [--mode=deep|grok|api|intel|quick|academic]"
allowed-tools: Read, Write, Bash(python3:*, pip:*, npx:*, cd:*)
model: opus
---

# Omega Research - 最高精度統合リサーチシステム

Grok-4 + 全API + GIS 31ソースを統合した最強リサーチスキル。

## アーキテクチャ

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      OMEGA RESEARCH SYSTEM                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  LAYER 1: LIVE WEB SEARCH (Grok-4 Agent Tools)                               │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │  grok-4-0709 + tools=[{"type":"web_search"}] + Exa semantic search  │     │
│  │  → 多段階リサーチ: 計画(grok-3-mini) → セクション調査 → 統合         │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  LAYER 2: API SEARCH (並列)                                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Tavily  │  │ Brave   │  │ NewsAPI │  │ SerpAPI │  │Perplexity│           │
│  │AI検索   │  │広範囲Web│  │最新News │  │Google  │  │AI要約   │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                               │
│  LAYER 3: INTELLIGENCE (GIS 31ソース)                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │  RSS + HN + GitHub + FRED経済指標 + X/Twitter + Reddit + World Bank  │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  LAYER 4: ACADEMIC (deep/academic モードのみ)                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │  Arxiv + Papers with Code + HF Daily + Lil'Log + Karpathy et al.    │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │              SYNTHESIS ENGINE (Grok-4 final synthesis)               │     │
│  │  重複排除 → クロス検証 → スコアリング → 統合レポート                   │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 使い方

```
/omega-research AIエージェント市場の2026年最新動向
/omega-research "Claude Code vs Cursor vs Windsurf 徹底比較" --mode=deep
/omega-research 日本のSaaS市場 投資機会 --mode=api
/omega-research 量子コンピューティング 最新研究 --mode=academic
/omega-research 生成AI規制動向 --mode=intel
/omega-research Next.js 15の新機能 --mode=quick
```

## モード一覧

| モード | 使用レイヤー | 所要時間 | 適した用途 |
|--------|------------|---------|----------|
| `deep` (デフォルト) | 全4レイヤー | 3-5分 | 市場調査・競合分析・意思決定 |
| `grok` | Layer 1のみ | 1-2分 | 最新情報・技術調査・速報 |
| `api` | Layer 1+2 | 1-3分 | ファクト確認・クロス検証 |
| `intel` | Layer 1+3 | 2-4分 | 市場動向・経済指標・SNSトレンド |
| `academic` | Layer 1+4 | 3-5分 | 学術研究・論文調査・技術深掘り |
| `quick` | Layer 1 (2セクション) | 30-60秒 | 素早い概要確認 |

## 手順

### Step 1: 環境確認

```bash
cd $HOME/taisun_agent
python3 -c "import openai; print('OK')" 2>/dev/null || pip install openai python-dotenv -q
```

### Step 2: ARGUMENTSを解析

- `[トピック]` → リサーチテーマ
- `--mode=XXX` → モード（省略時: deep）

### Step 3: intelligence-research を並行起動（intel/deep モード）

`--mode=intel` または `--mode=deep` の場合:

```bash
cd $HOME/taisun_agent
npx ts-node src/intelligence/index.ts &
INTEL_PID=$!
```

### Step 4: Omega Research メインスクリプト実行

```bash
cd $HOME/taisun_agent

python3 ~/.claude/skills/omega-research/scripts/research.py \
  "[TOPIC]" \
  --mode [MODE] \
  --output research/runs/$(date +%Y%m%d-%H%M%S)__omega-research
```

### Step 5: intelligence-research 結果の統合（intel/deep モード）

intelligence-research が完了している場合、最新の結果ファイルを取得:

```bash
INTEL_REPORT=$(ls -t $HOME/taisun_agent/research/runs/*/intelligence-*.md 2>/dev/null | head -1)
```

### Step 6: 結果確認と提示

生成されたMarkdownファイルを Read ツールで読み込み、以下の形式でユーザーに提示:

```markdown
## 🔬 Omega Research Report - [トピック]
**モデル**: Grok-4 Agent Tools + [使用API]
**調査レイヤー**: [使用レイヤー]
**所要時間**: XX秒
**引用数**: XX件

### 📊 エグゼクティブサマリー
[サマリー内容]

### 🔑 主要な発見（Top 5）
- [発見1]
- [発見2]
- [発見3]
- [発見4]
- [発見5]

### 📈 データ・統計
[具体的数値]

### 🔗 全レポート
`research/runs/YYYYMMDD-HHMMSS__omega-research/omega_research_*.md`
```

## 各ソースの特徴

### Grok-4 Agent Tools（核心）
- xAI Grok-4 (grok-4-0709) のリアルタイムWeb検索
- `tools=[{"type": "web_search"}]` でAgent Tools APIを使用
- 検索→推論→再検索の多段階ループ
- 引用付き回答を生成
- 長文コンテキスト (131k tokens)
- Exa セマンティック検索で事前コンテキストを補強

### intelligence-research (GIS)
- 31ソース並列収集: RSS 7件, HackerNews, GitHub Trending
- FRED経済指標 7系列（FFレート/CPI/失業率/GDP等）
- X/Twitter 著名人13名 + 監視アカウント340件
- World Bank 4指標
- Reddit コミュニティ

### Tavily API
- AI検索特化、最高精度のセマンティック検索
- 生のHTMLを解析して事実を抽出
- advanced検索でより深い結果

### Brave Search
- プライバシー重視の広範囲Web検索
- インデックスが広く、ニッチなページも発見

### NewsAPI
- 7万以上のニュースソースから最新記事
- 24時間以内の最新情報に強い

## エラー対処

- **XAI_API_KEY not set**: `taisun_agentv2/.env` を確認
- **openai not found**: `pip install openai python-dotenv` を実行
- **intelligence-research タイムアウト**: Step 3をスキップして継続
- **Tavily/Brave/NewsAPI エラー**: 自動でスキップ、Grok-4のみで継続
