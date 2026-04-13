---
name: sdd-tasks
description: Generate Kiro-format task breakdown — 6-phase structure with dependency graph, Gantt chart, and critical path analysis
argument-hint: "[spec-slug] [target-dir(optional)]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep
model: ollama-qwen25-72b
---

# sdd-tasks — Kiro形式タスク分解生成（フェーズ構造・依存グラフ・Ganttチャート）

## 0. 目的

**要件定義と設計書から「今すぐ着手可能な実装タスク」に完全分解する**。

- 1タスク = 1-4時間で完了できる粒度に細分化する
- 6フェーズ構造（Phase 0-5）で実装順序を明確化する
- 依存関係を明示し、並列実行可能なタスクを特定する
- Mermaid Ganttチャートでクリティカルパスを可視化する
- 各タスクが「どのREQ-xxx・どのアーキテクチャコンポーネント」を実現するかのトレーサビリティを確保する

**世界標準**: Kiro Task Format, Getting Things Done (GTD), Critical Path Method (CPM), Shape Up (Basecamp)

## 1. 入力と出力（ファイル契約）

### 入力
- /sdd-tasks $ARGUMENTS
  - $0 = spec-slug（例: google-ad-report）
  - $1 = target-dir（任意。未指定なら `.kiro/specs/<spec-slug>/` を使う）

### 入力ファイル（必須）
- `<target-dir>/requirements.md`（REQ-xxx の機能要件）
- `<target-dir>/design.md`（コンポーネント構成・API・データモデル）

### 入力ファイル（あれば読む）
- `<target-dir>/threats.md`（REQ-SEC-xxx のセキュリティタスク）
- `<target-dir>/slo.md`（SLO達成に必要な監視・計測タスク）
- `<target-dir>/guardrails.md`（ガードレール実装タスク）

### 出力（必須）
- `<target-dir>/tasks.md`

## 2. 重要ルール（絶対）

- **1タスク = 1-4時間**で完了できるサイズに分割する（「〜システムを実装」はNG → 具体的なファイル/関数単位に）
- **各タスクに Acceptance Criteria（完了条件）を必ず3つ以上記載する**（チェックボックス形式）
- **循環依存は絶対禁止**（blockedBy → blocks の有向グラフに閉路がないことを確認）
- **REQトレーサビリティ**: 各タスクに `Implements: REQ-xxx` を必ず紐付ける
- **クリティカルパスを特定する**（Ganttチャートの critical キーワードを使用）
- **Phase 0は環境構築のみ**（ビジネスロジックを含めない）
- Phase 4（Validation）には **全機能要件の統合テスト**と**セキュリティテスト**を含める

## 3. フェーズ構造（6フェーズ）

| Phase | 名称 | 内容 | 並列実行 |
|-------|------|------|---------|
| **0** | Preparation | 環境構築・依存インストール・CI/CD設定 | 部分的 |
| **1** | Foundation | DBスキーマ・基本モデル・認証基盤・APIルーター骨格 | 低 |
| **2** | Core | 主要ビジネスロジック・メインAPI・コアUI | 高 |
| **3** | Extension | 追加機能・最適化・エラーハンドリング強化 | 高 |
| **4** | Validation | 統合テスト・セキュリティテスト・パフォーマンステスト | 中 |
| **5** | Operations | デプロイ・監視設定・Runbook・ドキュメント完成 | 中 |

## 4. 手順（アルゴリズム）

### Pre-Phase: 入力確認ゲート

実行前に以下を確認する（Glob/Read）:

1. `<target-dir>/requirements.md` の存在確認
2. `<target-dir>/design.md` の存在確認

**ファイルが存在しない場合**:
```
⚠️ 警告: requirements.md または design.md が見つかりません。

推奨順序:
  /sdd-req100 {spec-slug}   - 要件定義（先に実行）
  /sdd-design {spec-slug}   - アーキテクチャ設計（先に実行）
  /sdd-tasks {spec-slug}    - タスク分解（本スキル）

このまま続けますか？（不完全なタスクになる可能性があります）
```

### Step A: コンテキスト収集

requirements.md と design.md を読み込み、以下を抽出する:

1. **機能要件一覧**（REQ-xxx ごと）
2. **アーキテクチャコンポーネント**（各コンポーネントの実装サイズ感）
3. **APIエンドポイント一覧**（設計書から）
4. **DBテーブル一覧**（ER図から）
5. **外部インテグレーション**（認証プロバイダー・外部API等）
6. **セキュリティ要件**（REQ-SEC-xxx があれば）
7. **SLO要件**（監視・計測の実装が必要か）

情報が不足している場合、以下の質問を提示する:

#### タスク分解質問（情報不足時のみ）
1. 開発チームの人数と体制（1人/複数人/リモート等）は？
2. 使用する主要フレームワーク/言語は？（TypeScript/Python/Go等）
3. DBはどれを使いますか？（PostgreSQL/MySQL/MongoDB等）
4. 認証はどう実装しますか？（NextAuth/Supabase Auth/カスタム等）
5. インフラはどこに構築しますか？（Vercel/AWS/GCP/オンプレ等）
6. CI/CDは何を使いますか？（GitHub Actions/GitLab CI等）
7. テストフレームワークは？（Jest/Pytest/Go Test等）
8. 既存のコードベースはありますか？（新規/既存システム拡張）
9. Sprint/Iteration の長さは？（1週間/2週間等）
10. 依存関係の外部ライブラリで「手動インストール必要」なものはありますか？

ユーザーが「仮置きで進めて」と言った場合は業界標準の仮定で埋め、「前提/仮定」に明記する。

### Step B: タスク一覧を生成

各REQ-xxxに対して、以下を行う:

1. **分解**: 1REQを複数の実装タスクに分解（1-4時間/タスク）
2. **命名**: `TASK-XXX: [動詞] [目的語]`（例: `TASK-001: DBスキーマにusersテーブルを作成する`）
3. **分類**: どのフェーズに属するか
4. **依存**: どのタスクの完了後に着手できるか

タスク分解の粒度の例:
- ❌ `REQ-001を実装する`（大きすぎ）
- ✅ `TASK-001: Prismaスキーマにusersテーブルを定義する`
- ✅ `TASK-002: POST /api/auth/register エンドポイントを実装する`
- ✅ `TASK-003: ユーザー登録のバリデーションロジックを実装する`
- ✅ `TASK-004: ユーザー登録APIの統合テストを作成する`

### Step C: `tasks.md` を生成

以下のテンプレートを完全に埋める:

```markdown
# タスク分解 — {プロジェクト名}

> 生成日: {YYYY-MM-DD}
> スペック: {spec-slug}
> バージョン: 1.0
> 総タスク数: {N}
> 推定総工数: {N}時間（{N}日）

---

## 1. エグゼクティブサマリー

| 指標 | 数値 |
|------|------|
| 総タスク数 | {N} |
| Phase別タスク数 | P0:{N} / P1:{N} / P2:{N} / P3:{N} / P4:{N} / P5:{N} |
| クリティカルパス長 | {N}時間 |
| 最大並列度 | {N}タスク同時 |
| カバーする要件数 | {N} / {全REQ数} |
| 未カバー要件 | {0件 or リスト} |

**マイルストーン**:
- M1: Phase 1完了（基盤構築） — 推定 {YYYY-MM-DD}
- M2: Phase 2完了（コア機能動作） — 推定 {YYYY-MM-DD}
- M3: Phase 4完了（テスト完了） — 推定 {YYYY-MM-DD}
- M4: Phase 5完了（本番リリース） — 推定 {YYYY-MM-DD}

---

## 2. Ganttチャート（クリティカルパス）

```mermaid
gantt
    title {プロジェクト名} 実装スケジュール
    dateFormat  YYYY-MM-DD
    axisFormat  %m/%d

    section Phase 0: Preparation
    TASK-001 環境構築        :done, t001, {開始日}, {N}h
    TASK-002 CI/CD設定       :done, t002, {開始日}, {N}h

    section Phase 1: Foundation
    TASK-010 DBスキーマ定義  :crit, t010, after t001, {N}h
    TASK-011 認証基盤        :crit, t011, after t010, {N}h
    TASK-012 APIルーター設定 :t012, after t001, {N}h

    section Phase 2: Core
    TASK-020 {機能A}実装     :crit, t020, after t011, {N}h
    TASK-021 {機能B}実装     :t021, after t011, {N}h
    TASK-022 {機能C}実装     :t022, after t021, {N}h

    section Phase 3: Extension
    TASK-030 エラーハンドリング  :t030, after t020, {N}h
    TASK-031 パフォーマンス最適化 :t031, after t022, {N}h

    section Phase 4: Validation
    TASK-040 統合テスト          :crit, t040, after t031, {N}h
    TASK-041 セキュリティテスト  :t041, after t030, {N}h
    TASK-042 負荷テスト          :t042, after t040, {N}h

    section Phase 5: Operations
    TASK-050 本番デプロイ        :crit, t050, after t040, {N}h
    TASK-051 監視ダッシュボード  :t051, after t050, {N}h
    TASK-052 ドキュメント完成    :t052, after t050, {N}h

    section Milestones
    基盤完了                 :milestone, m1, after t012, 0h
    コア機能完了             :milestone, m2, after t022, 0h
    テスト完了               :milestone, m3, after t042, 0h
    リリース                 :milestone, m4, after t052, 0h
```

---

## 3. 依存関係グラフ

```mermaid
graph LR
    subgraph "Phase 0: Preparation"
        T001[TASK-001\n環境構築]
        T002[TASK-002\nCI/CD設定]
    end

    subgraph "Phase 1: Foundation"
        T010[TASK-010\nDBスキーマ]
        T011[TASK-011\n認証基盤]
        T012[TASK-012\nAPIルーター]
    end

    subgraph "Phase 2: Core"
        T020[TASK-020\n{機能A}]
        T021[TASK-021\n{機能B}]
    end

    subgraph "Phase 4: Validation"
        T040[TASK-040\n統合テスト]
    end

    T001 --> T010
    T001 --> T012
    T010 --> T011
    T011 --> T020
    T012 --> T020
    T011 --> T021
    T020 --> T040
    T021 --> T040

    style T010 fill:#ff9999
    style T011 fill:#ff9999
    style T020 fill:#ff9999
    style T040 fill:#ff9999
```

クリティカルパス（赤）: T001 → T010 → T011 → T020 → T040 → T050

---

## 4. Phase 0: Preparation（環境構築）

### TASK-001: 開発環境をセットアップする

- **Phase**: 0 - Preparation
- **Implements**: (インフラ基盤)
- **blockedBy**: (none)
- **blocks**: TASK-010, TASK-012
- **推定工数**: 2時間
- **担当**: 全員

**Description**:
プロジェクトのローカル開発環境とリポジトリを構築する。

**Acceptance Criteria**:
- [ ] `git clone` 後に `npm install`（または相当コマンド）が成功する
- [ ] `npm run dev` でローカルサーバーが起動する（http://localhost:3000 等）
- [ ] `.env.example` が存在し、必要な環境変数が全て記載されている
- [ ] `README.md` にセットアップ手順が記載されている

**実装メモ**:
```bash
# プロジェクト初期化
{技術スタックに応じたコマンド例}
```

---

### TASK-002: CI/CD パイプラインを設定する

- **Phase**: 0 - Preparation
- **Implements**: (非機能要件 - 開発効率)
- **blockedBy**: TASK-001
- **blocks**: (none)
- **推定工数**: 2時間
- **担当**: インフラ担当

**Description**:
GitHub Actions（または相当）でCI/CDパイプラインを構築する。

**Acceptance Criteria**:
- [ ] `main` ブランチへのプッシュでテストが自動実行される
- [ ] テスト失敗時にマージがブロックされる
- [ ] `release` タグで本番デプロイが自動実行される

---

## 5. Phase 1: Foundation（基盤構築）

### TASK-010: DBスキーマを定義する

- **Phase**: 1 - Foundation
- **Implements**: REQ-{xxx}（全データ要件の基盤）
- **blockedBy**: TASK-001
- **blocks**: TASK-011, TASK-020, TASK-021
- **推定工数**: 3時間
- **担当**: バックエンド

**Description**:
設計書（design.md）のER図に基づき、DBスキーマをマイグレーションファイルとして実装する。

**Acceptance Criteria**:
- [ ] `schema.prisma`（または相当）が `design.md` のER図と完全に一致する
- [ ] `npx prisma migrate dev`（または相当）がエラーなく実行できる
- [ ] 全テーブルに `created_at`, `updated_at` カラムが存在する
- [ ] 外部キー制約と必要なインデックスが設定されている

---

### TASK-011: 認証基盤を実装する

- **Phase**: 1 - Foundation
- **Implements**: REQ-{SEC-xxx}（認証要件）
- **blockedBy**: TASK-010
- **blocks**: TASK-020, TASK-021
- **推定工数**: 4時間
- **担当**: バックエンド

**Description**:
JWT/OAuth2/Sessionベースの認証システムを実装する。

**Acceptance Criteria**:
- [ ] `POST /api/auth/register` が成功し、JWTトークンを返す
- [ ] `POST /api/auth/login` が成功し、JWTトークンを返す
- [ ] 認証が必要なエンドポイントにアクセスすると401を返す
- [ ] パスワードはbcryptでハッシュ化されDBに保存される
- [ ] JWTの有効期限が設定されており、期限切れで401を返す

---

## 6. Phase 2: Core（コア機能）

{各機能のタスクを以下の形式で記載}

### TASK-020: {機能名}を実装する

- **Phase**: 2 - Core
- **Implements**: REQ-{xxx}
- **blockedBy**: TASK-011
- **blocks**: TASK-{xxx}
- **推定工数**: {N}時間
- **担当**: {担当ロール}

**Description**:
{具体的な実装内容}

**Acceptance Criteria**:
- [ ] {完了条件1}
- [ ] {完了条件2}
- [ ] {完了条件3}

**実装メモ**:
```
{技術的な注意点や参照ファイル}
```

---

## 7. Phase 3: Extension（拡張・最適化）

{追加機能・エラーハンドリング強化・パフォーマンス最適化}

---

## 8. Phase 4: Validation（テスト・検証）

### TASK-040: 統合テストスイートを実装する

- **Phase**: 4 - Validation
- **Implements**: REQ-xxx（全機能要件の検証）
- **blockedBy**: Phase 2全タスク完了
- **blocks**: TASK-050
- **推定工数**: 4時間
- **担当**: QA/全員

**Description**:
全主要フローの統合テストを実装し、CI/CDで自動実行する。

**Acceptance Criteria**:
- [ ] 全APIエンドポイントに対してハッピーパステストが存在する
- [ ] 主要な異常系（認証エラー・バリデーションエラー等）のテストが存在する
- [ ] `npm run test` でテスト全件がパスする
- [ ] テストカバレッジが80%以上である

---

### TASK-041: セキュリティテストを実施する

- **Phase**: 4 - Validation
- **Implements**: REQ-SEC-xxx
- **blockedBy**: Phase 2全タスク完了
- **blocks**: TASK-050
- **推定工数**: 3時間
- **担当**: セキュリティ担当

**Acceptance Criteria**:
- [ ] OWASPトップ10の各項目をチェックし、全てに対応していることを確認する
- [ ] SQLインジェクション・XSSのテストがパスする
- [ ] 認証バイパスの試みが失敗する
- [ ] セキュリティテスト結果レポートが存在する

---

## 9. Phase 5: Operations（運用準備）

### TASK-050: 本番環境にデプロイする

- **Phase**: 5 - Operations
- **Implements**: (非機能要件 - 可用性)
- **blockedBy**: TASK-040, TASK-041
- **blocks**: TASK-051
- **推定工数**: 3時間
- **担当**: インフラ担当

**Acceptance Criteria**:
- [ ] 本番URLにアクセスし、ステータスコード200が返る
- [ ] ヘルスチェックエンドポイント `GET /health` が正常応答する
- [ ] SSL証明書が有効である
- [ ] 環境変数が本番環境に正しく設定されている

---

### TASK-051: 監視・アラートを設定する

- **Phase**: 5 - Operations
- **Implements**: SLO要件
- **blockedBy**: TASK-050
- **blocks**: (none)
- **推定工数**: 2時間

**Acceptance Criteria**:
- [ ] エラー率が1%を超えるとアラートが発火する（Alertmanager/PagerDuty等）
- [ ] レイテンシ p99 が500msを超えるとアラートが発火する
- [ ] Grafanaダッシュボードで主要メトリクスが可視化されている

---

## 10. REQ → TASK トレーサビリティマトリックス

| 要件ID | 要件概要 | 実装タスク | Phase | 状態 |
|--------|---------|-----------|-------|------|
| REQ-001 | {要件概要} | TASK-{xxx} | {N} | pending |
| REQ-002 | {要件概要} | TASK-{xxx}, TASK-{yyy} | {N} | pending |
| REQ-SEC-001 | {セキュリティ要件} | TASK-{xxx} | 4 | pending |

**未カバー要件**: {なし or リスト}

---

## 11. 並列実行可能タスクマップ

同一フェーズ内で並列実行できるタスクを整理:

| フェーズ | 並列グループA | 並列グループB | 並列グループC |
|---------|-------------|-------------|-------------|
| Phase 2 | TASK-020 | TASK-021 | TASK-022 |
| Phase 3 | TASK-030 | TASK-031 | - |
| Phase 4 | TASK-040 | TASK-041 | TASK-042 |
| Phase 5 | TASK-051 | TASK-052 | - |

---

## 12. 前提・仮定・未解決事項

### 前提（確定済み）
- {前提1: 使用技術スタック等}

### 仮定（未検証）
- {仮定1}（検証方法: {方法}）

### 未解決事項（Open Questions）
- [ ] {質問1}（判断期限: {日付}）

---

## 13. 次のステップ

1. **Phase 0 から着手**: TASK-001（環境構築）を開始
2. **クリティカルパスを優先**: 赤タスクを先に消化する
3. **並列実行を活用**: フロント・バックエンド担当が同時並行で作業
4. `sdd-runbook` でインシデント対応手順を整備する
```

### Step D: 品質チェック（自己検証）

生成後に以下を確認する:
- [ ] 全 REQ-xxx が少なくとも1つのタスクにマッピングされているか
- [ ] 全タスクに `Acceptance Criteria` が3つ以上あるか
- [ ] タスクの粒度が1-4時間に収まっているか（大きすぎるものはないか）
- [ ] 循環依存がないか（グラフに閉路がないか）
- [ ] Ganttチャートにクリティカルパス（`:crit`）が含まれているか
- [ ] REQ → TASK トレーサビリティマトリックスが完成しているか
- [ ] Phase 4に統合テストとセキュリティテストが含まれているか

## 5. 最終応答（チャットに返す内容）

- 総タスク数（Phase別内訳）
- 推定総工数
- クリティカルパス（主要タスク列）
- カバーした要件数（未カバー要件があれば警告）
- 生成ファイルパス

## 6. 実行例

```bash
/sdd-tasks google-ad-report
```

前提:
- `.kiro/specs/google-ad-report/requirements.md`
- `.kiro/specs/google-ad-report/design.md`

出力:
- `.kiro/specs/google-ad-report/tasks.md`

## 7. 後続スキルへの引き継ぎ

- `sdd-runbook`: tasks.md の Phase 5 タスク → Runbook実装の入力
- `sdd-adr`: 技術選択タスク（TASK-001等）→ ADRで設計決定を記録
- `sdd-guardrails`: Phase 4/5 のセキュリティタスク → ガードレール実装
- `sdd-slo`: Phase 5 の監視タスク → SLO/アラート設定の具体化
