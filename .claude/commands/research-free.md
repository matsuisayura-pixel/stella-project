---
name: research-free
description: APIキー不要のリサーチ
---

# /research-free

APIキー不要の統合リサーチ。WebSearch/WebFetchのみ使用。他人に配布してもそのまま動作。

## 使い方

```
/research-free <トピック> [--depth=quick|standard|deep]
```

## 例

```
/research-free AIエージェントの最新動向
/research-free Next.js 15 新機能 --depth=quick
/research-free 生成AI市場 --depth=standard
/research-free 量子コンピューティング投資 --depth=deep
```

## 深度

| 深度 | 検索数 | 用途 |
|------|--------|------|
| quick | 5件程度 | 簡単な確認 |
| standard | 10-15件 | 通常リサーチ |
| deep | 20件以上 | 深層調査 |
