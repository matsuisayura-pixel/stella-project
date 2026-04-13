# Requirements: <spec-slug>

> このドキュメントは Agentic SDD の requirements.md テンプレートです。
> すべての要件はEARS準拠、すべての受入テストはGWT形式で記述してください。

## 1. 概要（Executive Summary）
- 1〜3文で要約
- Who / What / Why を明確に

## 2. 背景 & Context
- （現状の課題、既存運用、制約）

## 3. スコープ
### 3.1 In Scope
- ...

### 3.2 Out of Scope（重要）
- ...

## 4. 用語集 / Glossary
| 用語 | 定義 |
|------|------|
| ... | ... |

## 5. ステークホルダー & 役割
| Role | 権限/責務 |
|------|----------|
| ... | ... |

## 6. 前提/仮定（Assumptions）
- （仮置きは必ずここに明記。仮置きがある限り100点にはしない。）

## 7. 制約（Constraints）
- 技術・法務・運用・コスト
- 例: 実行環境、利用可能な外部API、レート制限、リージョン、など

## 8. 成功条件（Success Metrics）
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| ... | ... | ... |

## 9. 機能要件（Functional Requirements）
> すべて EARS 準拠。各要件に受入テスト(GWT)と例外・エラーを必須。

### REQ-001: <タイトル>
- 種別: EARS-普遍 | EARS-イベント駆動 | EARS-状態駆動 | EARS-望ましくない挙動 | EARS-オプション
- 優先度: MUST | SHOULD | COULD | WONT
- 要件文(EARS): <EARS構文で1文。曖昧語禁止。>
- 根拠/目的: <なぜこの要件が必要か>
- 受入テスト(GWT):
  - AT-001: Given <前提条件> When <操作/イベント> Then <期待結果（数値/状態/YesNoで判定可能）>
- 例外・エラー:
  - EH-001: If <異常条件> then the system shall <対応>
- 補足:
  - 関連: REQ-xxx
  - 備考: ...

### REQ-002: <タイトル>
...

## 10. 非機能要件（Non-Functional Requirements）
> NFRもEARSで書く。数値・状態で判定可能にする。

### REQ-900: <タイトル>
- 種別: EARS-普遍
- 優先度: MUST
- 要件文(EARS): The system shall ...
- 根拠/目的:
- 受入テスト(GWT):
  - AT-900: Given ... When ... Then ...
- 例外・エラー:
  - EH-900: If ... then ...
- 補足:

## 11. セキュリティ/プライバシー要件
- 認証/認可、秘密情報、監査、ログマスキング、など（EARSで要件化しても良い）

## 12. ログ/監視/運用要件
- アラート、再実行、手動介入点、SLO、など（EARSで要件化しても良い）

## 13. 未解決事項（Open Questions）
- （空なら最高。ここに1つでも残れば100点にしない）

## 14. SLO/SLI/SLA（信頼性目標）
> 詳細は slo.md で定義。ここは概要のみ。

| Metric | Target | Measurement |
|--------|--------|-------------|
| 可用性 | >= 99.5% (30日) | success_requests / total_requests |
| P99レイテンシ | < 500ms | histogram_quantile(0.99, ...) |
| エラー率 | < 0.1% | error_requests / total_requests |

## 15. 関連ADR（技術決定記録）
> 本仕様に関連する技術決定。詳細は .kiro/specs/<slug>/adr/ で管理。

| ADR ID | 決定内容 | Status |
|--------|---------|--------|
| ADR-001 | - | Proposed |

## 16. セキュリティ脅威と対策
> 詳細は threat-model.md で定義。STRIDE分析の概要。

| 脅威 | リスク | 緩和策 | 対応要件 |
|------|--------|--------|---------|
| - | - | - | REQ-SEC-xxx |

## 17. ガードレール（AI制約）
> 詳細は guardrails.md で定義。AIエージェント向け。

- 許可パス: `src/`, `tests/`, `.kiro/`
- 禁止パス: `.env*`, `secrets/`, `~/.ssh/`
- 必須承認: 本番デプロイ、DB書き込み、外部認証情報アクセス

## 18. 運用手順書参照
> 詳細は runbook.md で定義。

- オンコール連絡先: -
- インシデント対応: runbook.md#5
- ロールバック手順: runbook.md#7

## 19. 成熟度レベル
> L1-L5の5段階。各レベルの達成条件。

| Level | 名称 | 達成条件 | 現在 |
|-------|------|---------|------|
| L1 | Draft | requirements.md作成 | ✅ |
| L2 | Review Ready | C.U.T.E. >= 90 | - |
| L3 | Implementation Ready | C.U.T.E. >= 98, レビュー承認 | - |
| L4 | Production Ready | 実装完了, テスト完了, セキュリティレビュー | - |
| L5 | Enterprise Ready | SLO達成, 監視設定, Runbook完備 | - |
