---
name: sdd-design
description: C4モデル設計書を生成
---

# /sdd-design

C4モデルに基づく設計ドキュメントを生成します。

## 使い方

```
/sdd-design <spec-slug>
```

## 例

```
/sdd-design google-ad-report
```

## 前提条件

- `.kiro/specs/<spec-slug>/requirements.md` が存在すること

## 出力

- `.kiro/specs/<spec-slug>/design.md`
