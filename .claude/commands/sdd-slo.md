---
name: sdd-slo
description: SLO/SLI/SLA定義を生成
---

# /sdd-slo

Google SREに基づくSLO/SLI/SLA定義を生成します。

## 使い方

```
/sdd-slo <spec-slug>
```

## 例

```
/sdd-slo google-ad-report
```

## 前提条件

- `.kiro/specs/<spec-slug>/requirements.md` が存在すること

## 出力

- `.kiro/specs/<spec-slug>/slo.md`
