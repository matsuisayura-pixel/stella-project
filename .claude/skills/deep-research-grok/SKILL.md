---
name: deep-research-grok
description: "Grok-4 Live Search を使った高精度ディープリサーチ。xAI のリアルタイムWeb検索で最新情報を収集し、多段階リサーチ+統合レポートを生成。市場調査・競合分析・技術調査に最適。"
argument-hint: "[リサーチトピック] [--quick] [--output ./出力ディレクトリ]"
allowed-tools: Read, Write, Bash(python3:*, pip:*)
model: sonnet
---

# Deep Research with Grok-4 Live Search

xAI Grok-4 のリアルタイムWeb検索を活用した高精度ディープリサーチ。
多段階調査（計画→セクション別調査→統合）で包括的なレポートを生成。

## 特徴

| 機能 | 詳細 |
|------|------|
| モデル | Grok-4 (grok-4-0709) + Live Search |
| 計画 | Grok-3-mini でコスト効率良く計画 |
| 調査 | Grok-4 × 複数セクション × Web検索 |
| 出力 | 構造化Markdownレポート + 引用リスト |
| 所要時間 | 1-3分（4セクション） |

## 必要な環境変数

```
XAI_API_KEY=xai-...（.env に設定済み）
```

## 使い方

```
/deep-research-grok AIエージェント市場の現状と将来
/deep-research-grok "Claude Code vs Cursor 比較分析" --quick
/deep-research-grok 日本のSaaS市場トレンド --output ./reports
```

## 手順

### 1. 環境確認

```bash
cd $HOME/taisun_agent
python3 -c "import openai; print('OK')" 2>/dev/null || pip install openai python-dotenv -q
```

### 2. 実行

ARGUMENTSからトピックと追加オプションを解析する。

```bash
cd $HOME/taisun_agent

# デフォルト（4セクション、研究ディレクトリに保存）
python3 ~/.claude/skills/deep-research-grok/scripts/research.py \
  "[TOPIC]" \
  --output research/runs/$(date +%Y%m%d)__grok-deep-research

# クイックモード（2セクション）
python3 ~/.claude/skills/deep-research-grok/scripts/research.py \
  "[TOPIC]" --quick \
  --output research/runs/$(date +%Y%m%d)__grok-quick-research
```

### 3. 出力確認と表示

実行後、生成されたMarkdownファイルを Read ツールで読み込み、要約をユーザーに提示する。

```
research/runs/YYYYMMDD__grok-deep-research/
├── grok_research_YYYYMMDD_HHMMSS.md   ← メインレポート
└── grok_research_YYYYMMDD_HHMMSS.json ← 構造化データ
```

### 4. 結果提示フォーマット

```markdown
## 🔬 Deep Research Report - [トピック]
**モデル**: Grok-4 + Live Search
**所要時間**: XX秒

### エグゼクティブサマリー
[サマリー内容]

### 主要な発見
- [発見1]
- [発見2]
...

### 📄 全レポート
`research/runs/YYYYMMDD__grok-deep-research/grok_research_*.md`
```

## エラー対処

- **XAI_API_KEY not set**: `.env` に `XAI_API_KEY=xai-...` を確認
- **openai not found**: `pip install openai python-dotenv` を実行
- **Rate limit**: 自動的に1秒間隔でリトライ済み
- **Search unavailable**: `--quick` モードで2セクションに削減して再試行
