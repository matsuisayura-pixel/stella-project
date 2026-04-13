# Directives Ledger（指示台帳）

このファイルはユーザーの指示を構造化して記録する台帳です。
各タスクの開始時に、指示を以下のカテゴリで分解して追記します。

---

## 2026-01-07 Task: Master Prompt Framework Setup
- **Goal**: 指示忠実性と再発防止のフレームワークを確立
- **Constraints**:
  - ユーザーの指示は契約として扱う
  - 推測や自己流で上書きしない
  - デフォルト言語は日本語
- **Never Do**:
  - 勝手にリファクタしない
  - 出力を肥大化させない
  - 秘密情報をログに書かない
- **DoD**:
  - directives.md 作成
  - mistakes.md 作成
  - task_contract.md 作成
  - running_summary.md 作成
  - memory.md 更新
- **Notes**: 以後のタスクはこのフレームワークに従って実行する

---

## 2026-01-07 Task: Memory Enhancement（記憶強化）
- **Goal**: 記憶システムをさらに強化し、セッション間の継続性を向上
- **Deliverables**:
  - MCP Memory統合スクリプト
  - セッション開始ブリーフィング機能
  - 関連ドキュメント更新
- **Constraints**:
  - 既存のmemory.md, mistakes.md等を破壊しない
  - 無料で実装（追加コストなし）
  - 既存のMCPツール（memory_add, memory_search）を活用
- **Never Do**:
  - 外部サービス契約
  - 既存ファイル構造の大幅変更
- **DoD**:
  - [ ] MCP Memory統合実装
  - [ ] セッション開始ブリーフィング実装
  - [ ] テスト通過
  - [ ] ドキュメント更新
- **Notes**: 高優先度2項目を先に実装
- **Status**: ✅ 完了

---

## 2026-01-07 Task: Memory++ アップグレード
- **Goal**: 指示取り込み強化 / 再発ミス撲滅 / トレーサビリティ&自動ゲート
- **Deliverables**:
  - pins.md（ピン留め台帳）
  - traceability.yml（DoD→変更→テスト→証跡対応表）
  - contract-lint.ts（契約/ルール違反検知）
  - mistake-to-test.ts（回帰テスト生成）
  - docs/quality/memory-and-regression.md（説明ドキュメント）
- **Constraints**:
  - 既存の設計方針（proxy-only、遅延ロード、出力外部化）を破壊しない
  - 変更は最小差分
  - secrets非露出を維持
- **Never Do**:
  - 秘密情報をlogs/issues/artifacts/traceabilityに書かない
  - 大規模リファクタ（別PR/別Issueに分離）
- **DoD**:
  - [ ] pins.md 作成・運用開始
  - [ ] traceability.yml 作成
  - [ ] contract-lint.ts 実装・CIゲート化
  - [ ] mistake-to-test.ts 実装
  - [ ] package.json にコマンド追加
  - [ ] ドキュメント作成
  - [ ] テスト通過
- **Directive Diff（既存契約との差分）**:
  - added: pins.md, traceability.yml, contract-lint, mistake-to-test
  - modified: directives.md（差分セクション追加）, task_contract.md（pins/traceability参照追加）
  - removed: なし
  - assumptions_changed: なし
- **Notes**: Memory v1.0 → v1.1 へのアップグレード

---

# Directive Diff Template（指示差分テンプレート）

新しい指示が来たら、以下の形式で既存契約との差分を明示すること:

```yaml
directive_diff:
  added:        # 新たに追加される指示
    - "..."
  modified:     # 既存指示の変更
    - "..."
  removed:      # 撤回される指示
    - "..."
  assumptions_changed:  # 前提条件の変更
    - "..."
```

**重要**: 差分が未記録なら作業を開始しない
