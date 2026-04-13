---
name: sdd-full-pipeline
description: SDD（Spec-Driven Development）フルパイプライン - 要件定義から運用手順まで一括生成
---

# SDD Full Pipeline

プロダクト仕様を完全にドキュメント化するフルパイプライン。

## 使用方法

```
/sdd-full-pipeline <spec-slug>
```

例:
```
/sdd-full-pipeline google-ad-report
/sdd-full-pipeline user-authentication
```

## パイプライン構成

### Phase 1: 要件定義（REQ100）
- 100点満点スコアリング付き要件定義書
- EARS形式 + 受け入れテスト
- スキル: `/sdd-req100`

### Phase 2: アーキテクチャ設計（Design）
- C4モデル（Context, Container, Component）
- 技術スタック決定
- スキル: `/sdd-design`

### Phase 3: タスク分解（Tasks）
- Kiro形式のタスク分解
- 依存関係、優先度、見積もり
- スキル: `/sdd-tasks`

### Phase 4: 脅威分析（Threat）
- STRIDEモデルによる脅威分析
- セキュリティ対策の明確化
- スキル: `/sdd-threat`

### Phase 5: SLO/SLI定義（SLO）
- サービスレベル目標・指標の定義
- 可用性、レイテンシ、エラー率
- スキル: `/sdd-slo`

### Phase 6: 運用手順書（Runbook）
- インシデント対応手順
- デプロイ、ロールバック手順
- スキル: `/sdd-runbook`

### Phase 7: ADR（Architecture Decision Record）
- アーキテクチャ決定の記録
- 代替案、トレードオフの明文化
- スキル: `/sdd-adr`

### Phase 8: ガードレール（Guardrails）
- AI安全性制約
- 入力検証、出力フィルタリング
- スキル: `/sdd-guardrails`

## 出力構造

```
.kiro/specs/<spec-slug>/
├── requirements.md              # 100点要件定義書
├── design.md                    # C4アーキテクチャ
├── tasks.md                     # Kiroタスク分解
├── threats.md                   # STRIDE脅威分析
├── slos.md                      # SLO/SLI定義
├── runbook.md                   # 運用手順書
├── adr.md                       # アーキテクチャ決定記録
├── guardrails.md                # AI安全性ガードレール
└── _meta.json                   # メタデータ（生成日時、スコア等）
```

## 実行手順

1. spec-slugを指定して実行
2. Phase 1で要件をヒアリング（対話形式）
3. Phase 2-8を順次実行（各フェーズで確認あり）
4. `.kiro/specs/<spec-slug>/` に全成果物が出力
5. 最終スコアとサマリーを表示

## オプション

- `--auto`: 確認なしで全フェーズを自動実行
- `--skip <phase>`: 特定フェーズをスキップ（例: `--skip threat,slo`）
- `--only <phase>`: 特定フェーズのみ実行
- `--output <dir>`: 出力ディレクトリを指定

## 品質スコア

各フェーズで品質スコアを計算：

| フェーズ | 基準 | 目標スコア |
|---------|------|-----------|
| Requirements | EARS準拠、テスト可能性 | 90/100 |
| Design | C4完全性、一貫性 | 85/100 |
| Tasks | 分解粒度、依存関係明確性 | 80/100 |
| Threat | STRIDE網羅性 | 85/100 |
| SLO | 測定可能性、現実性 | 80/100 |
| Runbook | 手順明確性、復旧時間 | 85/100 |
| ADR | 決定根拠の明確性 | 80/100 |
| Guardrails | 安全性網羅性 | 90/100 |

**総合スコア目標: 85/100以上**

## 関連スキル

- `/sdd-req100` - 要件定義（100点スコアリング）
- `/sdd-design` - C4アーキテクチャ設計
- `/sdd-tasks` - Kiroタスク分解
- `/sdd-threat` - STRIDE脅威分析
- `/sdd-slo` - SLO/SLI定義
- `/sdd-runbook` - 運用手順書
- `/sdd-adr` - ADR作成
- `/sdd-guardrails` - AI安全性ガードレール

## コスト

- 全フェーズ: **無料**（ローカルスキルのみ）
