---
name: sdd-req100
description: EARS requirements with scoring
argument-hint: "[spec-slug] [target-dir(optional)]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(python3 *)
model: ollama-deepseek-r1
---

# sdd-req100 — Perfect Requirements Generator + Scorer (ultrathink)

## 0. 目的
- 「曖昧さゼロ」「テスト可能」「EARS準拠」「抜け漏れ最小」の requirements.md を作る。
- 必ず点数（0〜100）を算出し、score.jsonとして保存する。
- スコアが目標未満なら、critique.mdを作り、requirements.mdを改善して再採点する（最大5ループ）。

## 1. 入力と出力（ファイル契約）
### 入力
- /sdd-req100 $ARGUMENTS
  - $0 = spec-slug（例: google-ad-report）
  - $1 = target-dir（任意。未指定なら `.kiro/specs/<spec-slug>/` を使う）

### 出力（必須）
- <target-dir>/requirements.md
- <target-dir>/critique.md
- <target-dir>/score.json

### 参照（同梱ファイル）
- requirements.template.md : 生成フォーマット
- rubric.md : 採点ルール（C.U.T.E.）
- banned_words.txt : 曖昧語リスト
- scripts/score_spec.py : 機械採点（必ず実行）

## 2. 重要ルール（絶対）
- 仕様（requirements）以外の設計・実装に踏み込まない（Howは書かない）。
- すべての要件文は EARS パターンに準拠させる。
- 各要件に「受入テスト（GWT）」を必ず付け、Yes/No判定可能にする。
- 曖昧語（banned_words.txt）の使用を禁止。使ったら自分で修正する。
- 未解決事項（Open Questions）が残る限り、100点に到達させない（誠実性のため）。
- **Non-Goals（やらないこと）を必ず明記する**（除外理由とセットで）。
- **Assumption Log（前提・仮定）を必ず明記する**（検証方法・リスク・担当者付き）。
- **要件には必ずトレーサビリティ情報を付ける**（どのステークホルダーのどのニーズに対応するか）。

## 3. 手順（アルゴリズム）
### Pre-Phase: ステークホルダー確認ゲート

実行前に以下を確認する:

1. `<target-dir>/stakeholder-map.md` の存在確認（Glob/Read）
2. `<target-dir>/business-context.md` の存在確認（Glob/Read）

**ファイルが存在しない場合**:
```
⚠️ 警告: ステークホルダーマップが未完成です。

推奨: 先に以下のスキルを実行してください:
  /sdd-stakeholder {spec-slug}   - ステークホルダー分析
  /sdd-context {spec-slug}       - ビジネス目標整合

このまま続けますか？（前提情報が少ないため品質が下がります）
```
ユーザーが「続ける」または「仮置きで進めて」と言った場合は進めるが、スコアの上限を -5 下げる（=トレーサビリティが低いため）。

### Step A: ターゲットディレクトリ決定
- target-dir = $1 があればそれ、なければ `.kiro/specs/$0/`
- 無ければ作成する。

### Step B: コンテキスト収集（最小で十分。ただし抜け漏れは許さない）
- 既存の requirements.md / README / docs / ADR / API仕様 / 運用手順 / 隣接する設計メモがあれば探索して読む（Glob/Grep/Read）。
- ユーザーからの入力が足りない場合は、以下の「意地悪質問」を最大15個だけ提示し、回答を待つ。
  - ただし、ユーザーが「仮置きで進めて」と言ったら、業界標準の仮定で埋める。その場合は requirements.md の「前提/仮定」に明記し、スコアもその分だけ下げる（=100点にはしない）。

#### 意地悪質問（不足時のみ - 最大20個）
1. この機能が「ない」とき、誰が、どう困る？
2. 成功 / 失敗の境界を数字で言うと？
3. エラー時、誰が、どう知る？ リトライは自動？手動？上限は？
4. 同時実行されたらどうなる？
5. 二重実行されたらどうなる？
6. 外部APIが落ちていたらどうする？
7. 部分成功したら全体は成功？失敗？
8. データが巨大（10倍/100倍）だったら？
9. 認証/認可/監査ログはどう扱う？
10. 秘密情報（APIキー等）はどこから？ログに出して良い？
11. この機能を無効化する運用は想定する？
12. 手動でリカバリ/再実行/ロールバックできる？
13. タイムアウトは何秒？超えたらどうなる？
14. テスト環境と本番の違い（レート制限・データ量・権限）は？
15. SLO/SLI/SLA はある？
16. この機能で発生しうるセキュリティ脅威は何？（STRIDE観点）
17. AIエージェントが実行する場合、どこで人間の承認が必要？
18. 障害発生時のエスカレーション先と連絡手段は？
19. この技術選択の代替案は何？なぜ却下した？（ADR観点）
20. 将来の拡張（10倍のユーザー、新機能追加）に耐えられる設計か？

### Step C: requirements.md をテンプレに沿って生成
- requirements.template.md を読み、完全にその形式で埋める。
- 要件（REQ-xxx）は「要件文(EARS)」「受入テスト(GWT)」「例外・エラー」「トレーサビリティ（どのステークホルダーID/ニーズに対応するか）」を必須とする。
- 曖昧語禁止。数字/状態/YesNoで判定できるようにする。
- 未解決事項があれば「未解決事項」セクションに列挙（この時点で100点は不可能）。

requirements.md には以下の追加セクションを必ず含める:

#### Non-Goals セクション（本バージョンでは実装しない）
```markdown
## Non-Goals（本バージョンでは実装しない）

| # | やらないこと | 除外理由 | 将来バージョンでの検討 |
|---|------------|---------|-------------------|
| NG-001 | {機能名} | {除外理由（コスト/スコープ/優先度/技術的課題）} | フェーズ2 / 未定 / 対象外 |
```
- business-context.md の Non-Goals と整合させること
- 除外理由が「時間がない」だけは禁止（具体的理由を書く）

#### Assumption Log セクション（前提・仮定・制約）
```markdown
## Assumption Log（前提・仮定）

| ID | 前提/仮定の内容 | 検証方法 | リスク(H/M/L) | 担当者 | 期限 |
|----|--------------|---------|--------------|-------|------|
| ASM-001 | {前提内容} | {検証方法} | H/M/L | | |

## Constraints（制約）

| ID | 制約内容 | 出典/理由 | 影響範囲 |
|----|---------|---------|---------|
| CON-001 | {制約内容（技術/ビジネス/法的）} | {出典} | |
```

### Step D: 機械採点（必須）
- scripts/score_spec.py を python で実行し、score.json と critique.md を出力する。
- 例:
  ```bash
  python3 .claude/skills/sdd-req100/scripts/score_spec.py "<requirements.mdのパス>" --out-json "<score.json>" --out-critique "<critique.md>"
  ```
- スコアは C.U.T.E.拡張スコアリング（105点満点）で評価する:

| 軸 | 配点 | 評価観点 |
|----|------|---------|
| Correct（正確性） | 25点 | ビジネスルール・整合性・矛盾なし |
| Unambiguous（明確性） | 25点 | 曖昧語なし・数値・判定可能 |
| Testable（テスト可能性） | 25点 | GWT付き・Yes/No判定可能 |
| Explicit（明示性） | 25点 | 例外・エラー・非機能要件明示 |
| Traceable（トレーサビリティ） | +5点 | ステークホルダーID・ニーズとの紐付け |
| Stakeholder-Aligned（整合性） | +5点 | stakeholder-map.md / business-context.md との整合 |
| **合計** | **105点** | |

### Step E: 改善ループ（最大5回）
- score.json を読み、score_total が目標(>=103)未満なら改善する。
- 改善は critique.md の指摘をすべて潰すこと。
- 改善後に再度 Step D を実行。
- 5回やっても達しない場合:
  - 103点に必要な追加情報（質問）を「未解決事項」に明記し、現時点の最高品質版を確定する。

## 4. 最終応答（チャットに返す内容）
- 最終スコア（合計点と C/U/T/E/Traceable/Stakeholder-Aligned 内訳）
- 主要な指摘と改善内容（3行以内）
- Non-Goals数・Assumption Log数
- 生成ファイルパス一覧

## 5. EARS パターン（必須）
すべての要件文は以下のいずれかのパターンで記述する：

| パターン | 構文 | 用途 |
|----------|------|------|
| 普遍 | The system shall ... | 常に成り立つ要件 |
| イベント駆動 | When <event>, the system shall ... | イベント発生時の要件 |
| 状態駆動 | While <state>, the system shall ... | 特定状態中の要件 |
| 望ましくない挙動 | If <unwanted>, then the system shall ... | 例外・エラー時の要件 |
| オプション | Where <feature> is enabled, the system shall ... | オプション機能の要件 |

日本語版：
| パターン | 構文 |
|----------|------|
| 普遍 | システムは...しなければならない。 |
| イベント駆動 | ...とき、システムは...しなければならない。 |
| 状態駆動 | ...の間、システムは...しなければならない。 |
| 望ましくない挙動 | ...場合、システムは...しなければならない。 |
| オプション | ...が有効な場合、システムは...しなければならない。 |

## 6. 敵対的レビュー（オプション）
スコアが伸び悩む場合、以下のエージェントを呼び出して追加レビューを受ける：
- `qa-lead`: 曖昧さ/テスト不能/異常系漏れを検出
- `architect`: 整合性/セキュリティ/運用可能性を検証
- `product-owner`: ビジネス価値/スコープを検証

## 7. 実行例
```bash
/sdd-req100 google-ad-report
```

出力:
```
.kiro/specs/google-ad-report/
├── requirements.md   # EARS準拠の要件定義
├── critique.md       # 採点結果の詳細
└── score.json        # 機械採点結果 {score_total: 98, ...}
```
