---
name: sdd-guardrails
description: AIガードレール定義を生成
---

# /sdd-guardrails

AIエージェント向けガードレール定義を生成します。

## 使い方

```
/sdd-guardrails <spec-slug>
```

## 例

```
/sdd-guardrails google-ad-report
```

## 前提条件

- `.kiro/specs/<spec-slug>/requirements.md` が存在すること
- `.kiro/specs/<spec-slug>/threat-model.md` が存在すること

## 出力

- `.kiro/specs/<spec-slug>/guardrails.md`
