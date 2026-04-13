---
name: sdd-runbook
description: インシデント対応Runbookを生成
---

# /sdd-runbook

インシデント対応手順書を生成します。

## 使い方

```
/sdd-runbook <spec-slug>
```

## 例

```
/sdd-runbook google-ad-report
```

## 前提条件

- `.kiro/specs/<spec-slug>/design.md` が存在すること
- `.kiro/specs/<spec-slug>/slo.md` が存在すること

## 出力

- `.kiro/specs/<spec-slug>/runbook.md`
