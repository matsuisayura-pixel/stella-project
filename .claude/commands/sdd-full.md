---
name: sdd-full
description: SDD全成果物を一括生成
---

# /sdd-full

完全なSpec-Driven Developmentパイプラインを実行し、全成果物を一括生成します。

## 使い方

```
/sdd-full <spec-slug>
```

## 例

```
/sdd-full google-ad-report
```

## 生成される成果物

```
.kiro/specs/<spec-slug>/
├── requirements.md      # EARS準拠要件定義 (C.U.T.E. >= 98)
├── design.md            # C4モデル設計書
├── tasks.md             # Kiro形式タスク分解
├── threat-model.md      # STRIDE脅威モデル
├── slo.md               # SLO/SLI/SLA定義
├── runbook.md           # インシデント対応手順
├── guardrails.md        # AIガードレール
├── critique.md          # 採点結果詳細
├── score.json           # 機械採点結果
└── adr/
    └── README.md        # ADR一覧
```

## 成熟度レベル

このスキルは **L3 (Implementation Ready)** を目指します：
- C.U.T.E.スコア >= 98
- 全成果物完備
- レビュー準備完了
