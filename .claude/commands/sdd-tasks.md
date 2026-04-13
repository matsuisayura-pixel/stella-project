---
name: sdd-tasks
description: Kiro形式タスク分解を生成
---

# /sdd-tasks

要件と設計からタスクを分解し、実行計画を生成します。

## 使い方

```
/sdd-tasks <spec-slug>
```

## 例

```
/sdd-tasks google-ad-report
```

## 前提条件

- `.kiro/specs/<spec-slug>/requirements.md` が存在すること
- `.kiro/specs/<spec-slug>/design.md` が存在すること

## 出力

- `.kiro/specs/<spec-slug>/tasks.md`
