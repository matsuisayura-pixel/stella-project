---
name: mega-research
description: 6つの検索APIを統合した最強リサーチ
---

# /mega-research

6つの検索API（Tavily/SerpAPI/Brave/NewsAPI/Reddit/Perplexity）を統合したリサーチ。

## 使い方

```
/mega-research <トピック> [--mode=deep|quick|news|trend]
```

## 例

```
/mega-research AIエージェント市場
/mega-research 生成AI規制 --mode=news
/mega-research 仮想通貨 --mode=trend
```

## モード

| モード | 説明 | 使用API |
|--------|------|---------|
| deep | 徹底調査（デフォルト） | 全API |
| quick | 高速検索 | Tavily + Brave |
| news | ニュース特化 | NewsAPI + Perplexity |
| trend | トレンド分析 | Reddit + NewsAPI |
