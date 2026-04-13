# Pins（ピン留め台帳）

「ここを修正して」の"ここ"を固定するピン留め台帳。
作業中の最優先参照として使用する。

---

## 運用ルール

### ピンを作るタイミング
- ユーザーが「ここを修正して」「この部分を直して」と言ったとき
- 特定のファイル/関数/行を指定された修正指示があったとき

### ピンの必須項目
1. **id**: 一意の識別子（PIN-001形式）
2. **scope**: 対象範囲（file/function/line）
3. **symptom**: 現在の問題/症状
4. **expected_behavior**: 期待される挙動
5. **anti_regression_check**: 再発防止チェック項目
6. **expiry_condition**: 解除条件（いつアーカイブするか）

### ピンの解除
- expiry_condition が満たされたらアーカイブセクションに移動
- 解除日時と理由を記録

---

## Active Pins（作業中）

現在アクティブなピンはありません。

<!--
新しいピンのテンプレート:

### PIN-XXX: [短い説明]
- **Created**: YYYY-MM-DD
- **Scope**:
  - File: `path/to/file.ts`
  - Function: `functionName`
  - Line: XX-XX
- **Symptom**: 現在の問題
- **Expected Behavior**: 期待される挙動
- **Anti-Regression Check**:
  - [ ] チェック項目1
  - [ ] チェック項目2
- **Expiry Condition**: この条件が満たされたら解除
- **Related**: task_contract.md, mistakes.md#xxx
-->

---

## Archived Pins（解除済み）

### PIN-000: テンプレート例（サンプル）
- **Created**: 2026-01-07
- **Archived**: 2026-01-07
- **Scope**:
  - File: `example.ts`
  - Function: `exampleFunction`
- **Symptom**: サンプルの問題説明
- **Expected Behavior**: 期待される挙動の説明
- **Resolution**: どのように解決されたか
- **Expiry Reason**: 解除理由

---

## Pin Template（コピー用）

```markdown
### PIN-XXX: [短い説明]
- **Created**: YYYY-MM-DD
- **Scope**:
  - File: `path/to/file.ts`
  - Function: `functionName`
  - Line: XX-XX
- **Symptom**:
- **Expected Behavior**:
- **Anti-Regression Check**:
  - [ ]
- **Expiry Condition**:
- **Related**:
```
