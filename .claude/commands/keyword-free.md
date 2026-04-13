---
name: keyword-free
description: APIキー不要のキーワード抽出
---

# /keyword-free

APIキー不要のキーワード抽出。WebSearchのみ使用。他人に配布してもそのまま動作。

## 使い方

```
/keyword-free <シードキーワード> [--type=all|longtail|niche|trending|buying]
```

## 例

```
/keyword-free 投資信託
/keyword-free プログラミング --type=longtail
/keyword-free 転職 --type=buying
```

## タイプ

| タイプ | 説明 | 用途 |
|--------|------|------|
| all | 全種類 | 総合分析 |
| longtail | 3語以上 | SEO |
| niche | 低競合 | 穴場狙い |
| trending | 急上昇 | トレンド |
| buying | 購買意図高 | アフィリエイト |
