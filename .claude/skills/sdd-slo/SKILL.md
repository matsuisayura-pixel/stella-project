---
name: sdd-slo
description: Google SRE SLO/SLI/SLA definition generator with Error Budget Policy and Prometheus alert rules
argument-hint: "[spec-slug] [target-dir(optional)]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep
model: ollama-qwen25-72b
---

# sdd-slo — SLO/SLI/SLA 定義生成（Google SRE方式）

## 0. 目的

Google SRE原則に基づき、**測定・アラート・意思決定まで一体化した**信頼性目標を定義する。

- SLI（何を測るか）→ SLO（どこまで許容するか）→ SLA（何を約束するか）の階層構造
- Error Budget Policy で「開発速度 vs 信頼性」のトレードオフを自動化する
- Prometheus/Grafana対応のアラートルールをすぐ使える形で生成する
- business-context.md の KPI と SLO を整合させる
- `sdd-guardrails` の運用制限基準を提供する

**世界標準**: Google SRE Book, Google SLO Workbook, Prometheus Alerting Best Practices (Multi-window Multi-burn-rate)

## 1. 入力と出力（ファイル契約）

### 入力
- /sdd-slo $ARGUMENTS
  - $0 = spec-slug（例: google-ad-report）
  - $1 = target-dir（任意。未指定なら `.kiro/specs/<spec-slug>/` を使う）

### 入力ファイル（あれば読む）
- `<target-dir>/requirements.md`（非機能要件からSLO導出）— 必須
- `<target-dir>/business-context.md`（KPI目標値との整合）— 推奨
- `<target-dir>/design.md`（コンポーネント別SLI定義）— 推奨

### 出力（必須）
- `<target-dir>/slo.md`

## 2. 重要ルール（絶対）

- **SLI先行**: まず「何を測定できるか」を確認してから目標値を設定する（計測不能なSLOは禁止）
- **Error Budget必須**: 全SLOにError Budgetと消費率を計算する
- **Prometheus形式**: 全SLIに`rate()`/`histogram_quantile()`クエリを付与する
- **SLA < SLO**: 外部約束（SLA）は内部目標（SLO）より必ず緩く設定する
- **数値必須**: 「高速」「安定」等の曖昧表現は禁止。全て数値・単位で記述する
- **KPI整合**: business-context.md のKPIとSLOが矛盾しないか確認する

## 3. 手順（アルゴリズム）

### Pre-Phase: 前提ファイル確認ゲート

実行前に以下を確認する:

1. `<target-dir>/requirements.md` の存在確認（Glob/Read）

**requirements.md が存在しない場合**:
```
⚠️ 警告: 要件定義が未完成です。非機能要件からSLOを導出できません。

推奨: 先に以下のスキルを実行してください:
  /sdd-req100 {spec-slug}   - 要件定義
  /sdd-design {spec-slug}   - 設計書（コンポーネント別SLI定義のため）

このまま続けますか？（SLO目標値を業界標準で仮置きします）
```

### Step A: ターゲットディレクトリ決定
- target-dir = $1 があればそれ、なければ `.kiro/specs/$0/`
- 無ければ作成する

### Step B: コンテキスト収集
既存ファイルを探索して読む（Glob/Grep/Read）:
```
- <target-dir>/requirements.md    （非機能要件: 可用性・レイテンシ・スループット）
- <target-dir>/business-context.md（KPI目標値）
- <target-dir>/design.md          （コンポーネント構成）
```

情報が不足している場合、以下の質問を提示してユーザーの回答を待つ:

#### SLO確認質問（情報不足時のみ）
1. 許容できるダウンタイムは月何分ですか？（例: 月30分 = 99.93%）
2. 許容できるAPIレスポンス時間の上限は？（P50/P95/P99それぞれ）
3. 許容できるエラー率は？（例: 0.1%）
4. ピーク時の想定リクエスト数（RPS）は？
5. データの鮮度要件はありますか？（例: 最大5分遅延許容）
6. SLAとして外部顧客に約束している内容はありますか？
7. Error Budget消費時の意思決定者は誰ですか？
8. アラート通知先は？（Slack/PagerDuty/メール）

ユーザーが「仮置きで進めて」と言った場合は業界標準の仮定で埋め、「前提/仮定」に明記する。

### Step C: `slo.md` を生成

以下のテンプレートを完全に埋める:

```markdown
# SLO/SLI/SLA 定義書 — {プロジェクト名}

> 生成日: {YYYY-MM-DD}
> スペック: {spec-slug}
> バージョン: 1.0
> 手法: Google SRE Book, Multi-window Multi-burn-rate Alerting

---

## 1. エグゼクティブサマリー

**サービス**: {サービス名}
**オーナー**: {チーム/担当者}
**測定期間**: 30日間ローリングウィンドウ

### SLO サマリー

| SLI名 | SLO目標 | 現在値（推定） | Error Budget（月間） |
|-------|--------|--------------|-------------------|
| 可用性 | {N}% | - | {分/時間}のダウンタイム許容 |
| レイテンシP99 | {N}ms以下 | - | - |
| エラー率 | {N}%以下 | - | - |

---

## 2. SLI 定義（何を測定するか）

### SLI-001: 可用性（Availability）

**定義**: 成功レスポンス（HTTP 2xx/3xx）の割合

```prometheus
# 成功リクエスト率（5分間）
sum(rate(http_requests_total{status=~"2..|3.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

**計測ポイント**: ロードバランサー / アプリケーション
**除外条件**: 計画メンテナンス期間（事前通知済み）

---

### SLI-002: レイテンシ（Latency）

**定義**: リクエストの処理時間分布

```prometheus
# P50レイテンシ
histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# P95レイテンシ
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# P99レイテンシ
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

**良いレイテンシの定義**: {N}ms以下 = "良い"、超過 = "悪い"

```prometheus
# 良いレイテンシ割合
sum(rate(http_request_duration_seconds_bucket{le="{threshold}"}[5m]))
/
sum(rate(http_request_duration_seconds_count[5m]))
```

---

### SLI-003: エラー率（Error Rate）

**定義**: 5xxレスポンスの割合

```prometheus
# エラー率
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

---

### SLI-004: スループット（Throughput）  ※必要な場合のみ

**定義**: 単位時間あたりの処理リクエスト数

```prometheus
sum(rate(http_requests_total[1m]))
```

---

### SLI-005: データ鮮度（Freshness）  ※非同期処理・データパイプラインの場合のみ

**定義**: データの最終更新からの経過時間

```prometheus
time() - max(data_last_updated_timestamp)
```

---

## 3. SLO 定義（どこまで許容するか）

### SLO-001: 可用性

| 項目 | 値 |
|------|---|
| **目標値** | >= {N}%（30日間） |
| **Error Budget** | {100-N}% = 月{分}分のダウンタイム許容 |
| **測定SLI** | SLI-001 |
| **測定期間** | 30日間ローリング |

**Error Budget計算**:
```
月間分数: 30日 × 24時間 × 60分 = 43,200分
Error Budget: 43,200分 × (1 - {SLO目標}/100) = {X}分
```

---

### SLO-002: レイテンシ

| 指標 | 目標値 | 根拠 |
|------|-------|------|
| P50 | <= {N}ms | {根拠: ユーザー体験目標} |
| P95 | <= {N}ms | {根拠: SLA要件} |
| P99 | <= {N}ms | {根拠: 最悪ケース許容} |

**良いレイテンシSLO**: >= {N}%のリクエストが{threshold}ms以内

---

### SLO-003: エラー率

| 項目 | 値 |
|------|---|
| **目標値** | <= {N}%（30日間） |
| **Error Budget** | 月{M}件のエラー許容 |
| **測定SLI** | SLI-003 |

---

## 4. Error Budget Policy

Error Budgetの消費状況に応じた自動的な意思決定ルール。

### 消費率ポリシー

| 消費率 | 状態 | アクション |
|-------|------|-----------|
| 0% - 50% | 🟢 通常 | 通常の開発・デプロイを継続 |
| 50% - 75% | 🟡 注意 | リスクの高い変更を保留。レビュー強化 |
| 75% - 100% | 🔴 警告 | 新機能開発を停止。信頼性改善優先 |
| 100%+ | 🚨 超過 | 緊急インシデント対応。全変更凍結 |

### 月次レビュープロセス

1. 毎月第1週に Error Budget 消費レポートを作成
2. 消費率 > 50% の場合: 根本原因分析（RCA）実施
3. 消費率 > 75% の場合: 次月はリリース凍結

---

## 5. アラートルール（Multi-window Multi-burn-rate）

```yaml
# Prometheus Alerting Rules
groups:
  - name: slo-{spec-slug}
    rules:
      # 1時間以内に Error Budget の 2% を消費するバーンレート（Critical）
      - alert: SLOErrorBudgetCritical
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[1h]))
            /
            sum(rate(http_requests_total[1h]))
          ) > {burnrate_critical}
        for: 2m
        labels:
          severity: critical
          service: {spec-slug}
        annotations:
          summary: "SLO Error Budget 急速消費（Critical）"
          description: "現在のバーンレート: {{ $value | humanizePercentage }}"

      # 6時間以内に Error Budget の 5% を消費するバーンレート（Warning）
      - alert: SLOErrorBudgetWarning
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[6h]))
            /
            sum(rate(http_requests_total[6h]))
          ) > {burnrate_warning}
        for: 15m
        labels:
          severity: warning
          service: {spec-slug}
        annotations:
          summary: "SLO Error Budget 消費ペース上昇（Warning）"

      # レイテンシSLO違反
      - alert: SLOLatencyP99Violation
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > {p99_threshold}
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P99レイテンシがSLO目標を超過"
          description: "P99: {{ $value | humanizeDuration }}"
```

### バーンレート計算

```
目標SLO: {N}%  →  Error Budget: {100-N}%
30日でError Budgetを使い切るバーンレート = 1x

Critical（1時間窓）: 14.4x バーンレート
  = Error Budgetの2%を1時間で消費
  = エラー率閾値: {計算値}

Warning（6時間窓）: 6x バーンレート
  = Error Budgetの5%を6時間で消費
  = エラー率閾値: {計算値}
```

---

## 6. SLA 定義（外部約束）

> SLAはSLOより必ず緩く設定する（SLA < SLO）

| SLI | SLO目標 | SLA約束 | 違反時のペナルティ |
|-----|--------|--------|----------------|
| 可用性 | {SLO}% | {SLA}% | {クレジット/返金ポリシー} |
| レイテンシP99 | {SLO}ms | {SLA}ms | - |

### 除外事項
- 計画メンテナンス（事前72時間通知）
- 第三者サービスの障害（AWS/GCP等）
- 天変地異・不可抗力

---

## 7. Grafana ダッシュボード設計

### ダッシュボードパネル構成

| パネル名 | 種別 | Prometheusクエリ |
|---------|------|---------------|
| 可用性（30日） | Stat | `sum(increase(...success[30d])) / sum(increase(...total[30d]))` |
| Error Budget残量 | Gauge | `{計算式}` |
| P99レイテンシ（1時間） | Time Series | `histogram_quantile(0.99, ...)` |
| エラー率（5分） | Time Series | `rate(...5xx[5m]) / rate(...total[5m])` |
| バーンレート（1h/6h/24h） | Time Series | `rate(...)` |

---

## 8. 前提・仮定・未解決事項

### 前提（確定済み）
- Prometheusでメトリクスを収集している
- HTTPステータスコードでエラーを判定できる

### 仮定（未検証）
- {仮定1}（検証方法: {方法}）

### 未解決事項（Open Questions）
- [ ] Error Budget超過時の意思決定者は誰か（判断期限: {日付}）
- [ ] SLAの違反ペナルティは何か（判断期限: {日付}）

---

## 9. 次のステップ

1. `sdd-guardrails` でError Budget Policy を運用ルールに組み込む
2. Prometheusアラートルールを `config/monitoring/alerts.yml` に追加する
3. Grafanaダッシュボードを設定する
4. 月次SLOレビュー会議を設定する
```

### Step D: 品質チェック（自己検証）

生成後に以下を確認する:
- [ ] 全SLIにPrometheusクエリが記述されているか
- [ ] 全SLOにError Budget（時間/分）が計算されているか
- [ ] Error Budget Policyが4段階（通常/注意/警告/超過）で定義されているか
- [ ] アラートルールがMulti-window Multi-burn-rate形式か
- [ ] SLA < SLO になっているか（数値の大小を確認）
- [ ] 全SLIの除外条件が明記されているか
- [ ] Grafanaダッシュボード設計が含まれているか

## 4. 最終応答（チャットに返す内容）

- SLI数・SLO数
- 主要SLO目標値（可用性・P99・エラー率）
- Error Budget（可用性）= 月{N}分のダウンタイム許容
- アラートルール数（Critical/Warning）
- 生成ファイルパス

## 5. 実行例

```bash
/sdd-slo google-ad-report
```

出力:
```
.kiro/specs/google-ad-report/
└── slo.md   # SLI定義 + SLO目標 + Error Budget Policy + Prometheusアラートルール
```

## 6. 後続スキルへの引き継ぎ

- `sdd-guardrails`: slo.md → Error Budget Policy を運用制限ルールに組み込む
- `sdd-runbook`: slo.md → SLO違反時のランブック手順
- `sdd-tasks`: slo.md → 可観測性実装タスクを生成
