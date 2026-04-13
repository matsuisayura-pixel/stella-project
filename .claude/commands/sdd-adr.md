---
name: sdd-adr
description: Architecture Decision Recordを生成
---

# /sdd-adr

MADR形式のADR（技術決定記録）を生成します。

## 使い方

```
/sdd-adr "<タイトル>" <spec-slug>
```

## 例

```
/sdd-adr "認証方式としてJWTを採用" google-ad-report
```

## 出力

- `.kiro/specs/<spec-slug>/adr/ADR-XXX-<slug>.md`
