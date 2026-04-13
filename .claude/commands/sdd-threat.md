---
name: sdd-threat
description: STRIDE脅威モデルを生成
---

# /sdd-threat

STRIDE分析に基づく脅威モデルを生成します。

## 使い方

```
/sdd-threat <spec-slug>
```

## 例

```
/sdd-threat google-ad-report
```

## 前提条件

- `.kiro/specs/<spec-slug>/requirements.md` が存在すること
- `.kiro/specs/<spec-slug>/design.md` が存在すること

## 出力

- `.kiro/specs/<spec-slug>/threat-model.md`
