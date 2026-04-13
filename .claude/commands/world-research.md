---
name: world-research
description: 全世界総合リサーチ - 6層アーキテクチャ + 5API統合（論文からSNSまで完全網羅）
---

# /world-research

6層アーキテクチャ + 5API統合の全世界総合リサーチシステム。論文からSNSまで完全網羅。

## 使い方

```
/world-research <トピック> [--mode=standard|quick|deep|academic|survey|ecosystem|api-quick|api-deep|api-news|api-trend]
```

## 例

```
/world-research AIエージェント最新動向
/world-research LLM推論最適化 --mode=academic
/world-research 生成AI市場 --mode=api-deep
/world-research AI規制ニュース --mode=api-news
```

## 6層構造

| Layer | カバー範囲 |
|-------|-----------|
| 1 | 学術論文（Arxiv/PwC/OpenReview/Scholar/S2/Connected Papers/DBLP/ACL） |
| 2 | ペーパーキュレーション（HF Daily Papers/Alpha Signal/ニュースレター） |
| 3 | テックブログ（Lil'Log/Distill/Karpathy/Raschka/Chip Huyen/企業研究ブログ） |
| 4 | 実装エコシステム（HF Hub/awesome-*/LangChain/CrewAI/AutoGPT/MLOps） |
| 5 | SNS（X/Reddit/YouTube/note/Medium/Qiita/Zenn） |
| 6 | コミュニティ（Discord/Slack/GitHub Discussions/Stack Overflow/HN） |

## モード

| モード | 説明 | 用途 |
|--------|------|------|
| quick | 高速検索 | 簡単な確認 |
| standard | 標準調査（デフォルト） | 通常リサーチ |
| deep | 徹底調査 | 深層分析 |
| academic | 学術論文特化 | 論文調査 |
| survey | サーベイ論文風 | 分野全体の俯瞰 |
| ecosystem | 実装エコシステム | ツール・ライブラリ調査 |
| api-quick | API高速検索 | 5API統合の高速版 |
| api-deep | API徹底調査 | 5API統合の深層版 |
| api-news | APIニュース特化 | 最新ニュース収集 |
| api-trend | APIトレンド分析 | トレンド把握 |

## 統合API（5API）

Tavily / SerpAPI / Brave Search / NewsAPI / Perplexity
