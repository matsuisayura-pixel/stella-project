---
name: sdd-runbook
description: Generate incident response runbook with severity definitions, scenario-specific playbooks, rollback procedures, and postmortem templates
argument-hint: "[spec-slug] [target-dir(optional)]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep
model: ollama-qwen25-72b
---

# sdd-runbook — Incident Response Runbook Generator

## 0. 目的

**インシデント発生時に「考えなくても動ける」運用手順書を生成する**。

- Severity定義で初動速度を最大化（パニック状態でも判断できる）
- シナリオ別コピペ実行可能コマンドで対応時間を短縮
- ロールバック手順で復旧の確実性を保証
- ポストモーテムテンプレートで再発防止サイクルを回す
- `sdd-slo` のSLOと連動したアラート→対応トリガーを定義する
- `sdd-threat` の緩和策を運用手順に落とし込む

**世界標準**: Google SRE Book, PagerDuty Incident Response, AWS Well-Architected Reliability Pillar

## 1. 入力と出力（ファイル契約）

### 入力
- /sdd-runbook $ARGUMENTS
  - $0 = spec-slug（例: google-ad-report）
  - $1 = target-dir（任意。未指定なら `.kiro/specs/<spec-slug>/` を使う）

### 入力ファイル（あれば読む）
- `<spec-dir>/design.md`（システム構成・コンポーネント・依存関係）
- `<spec-dir>/slo.md`（SLI/SLO/Error Budget・アラート条件）
- `<spec-dir>/threat-model.md`（セキュリティインシデント対応方針）
- `<spec-dir>/requirements.md`（非機能要件・可用性要件）

### 出力（必須）
- `<target-dir>/runbook.md`

## 2. 重要ルール（絶対）

- **コピペ実行可能**: すべてのコマンドは `<placeholder>` 形式のみで、そのまま実行できる形式
- **Severity明確化**: 各Severityに「初動目標（分）」「解決目標（時間）」「エスカレーション先」を数値で定義
- **チェックリスト形式**: 手順は箇条書き + チェックボックス。見落としを防ぐ
- **ポストモーテム必須**: SEV1/SEV2は必ずRCAプロセスを踏む。テンプレート必備
- **RUNBOOK_VERSION を明記**: バージョン管理して陳腐化を防ぐ

## 3. Pre-Phase: 入力確認ゲート

実行前に以下を確認する:

1. `<spec-dir>/design.md` の存在確認（Glob/Read）
2. `<spec-dir>/slo.md` の存在確認（Glob/Read）

**ファイルが存在しない場合**:
```
⚠️ 警告: design.md / slo.md が見つかりません。

推奨実行順序:
  /sdd-req100 {spec-slug}      - 要件定義
  /sdd-design {spec-slug}      - アーキテクチャ設計
  /sdd-slo {spec-slug}         - SLO/SLI定義
  /sdd-runbook {spec-slug}     - 運用Runbook（本スキル）

このまま続けますか？（インフラ情報なしで汎用テンプレートを生成します）
```

## 4. 手順（アルゴリズム）

### Step A: コンテキスト収集

既存ファイルから以下を読み込む:
1. `design.md` → システム構成・コンポーネント名・依存サービス・インフラ（k8s/ECS/Cloud Run等）
2. `slo.md` → SLI/SLO値・アラート条件・Error Budget Policy
3. `threat-model.md` → セキュリティインシデントの緩和策

情報が不足している場合、以下の質問を提示してユーザーの回答を待つ:

#### Runbook構築質問（情報不足時のみ）
1. インフラはどこで動いていますか？（AWS ECS / k8s / Cloud Run / VPS 等）
2. オンコール体制は？（24/7ローテーション / 平日日中 / オンデマンド等）
3. アラート通知手段は？（PagerDuty / Slack / メール / SMS 等）
4. インシデント中のコミュニケーションチャンネルは？（Slack #incident / Zoom / Discord 等）
5. Statusページはありますか？（URL）
6. ログはどこに集約されていますか？（Datadog / CloudWatch / Grafana Loki 等）
7. メトリクスはどこで確認できますか？（Grafana / Datadog / CloudWatch 等）
8. デプロイ手段は？（GitHub Actions / ArgoCD / Spinnaker / 手動 等）
9. DBはマネージドですか？（RDS / Cloud SQL / Aurora 等）
10. 緊急連絡が必要な外部依存サービスは？（Stripe / SendGrid 等、SLAとサポート連絡先）

ユーザーが「仮置きで進めて」と言った場合は業界標準の仮定で埋め、「前提/仮定」に明記する。

### Step B: `runbook.md` を生成

以下のテンプレートを完全に埋める:

```markdown
# Incident Response Runbook — {プロジェクト名}

> バージョン: 1.0
> スペック: {spec-slug}
> 最終更新: {YYYY-MM-DD}
> 作成方法: sdd-runbook スキルで自動生成

---

## 1. サービス概要

| 項目 | 内容 |
|------|------|
| サービス名 | {サービス名} |
| 責任者 | {氏名 or チーム名} |
| インフラ | {AWS/GCP/Azure/オンプレ等} |
| コンテキスト | {spec-slug} |
| Statusページ | {URL or 未設定} |

---

## 2. オンコール連絡先

| ロール | 担当者 | 連絡方法 | 対応時間 |
|--------|--------|---------|---------|
| Primary On-Call | {担当者} | {PagerDuty/Slack/電話} | {24/7 or 平日9-18} |
| Secondary On-Call | {担当者} | {連絡方法} | {時間} |
| エスカレーション先 | {マネージャー/CTO} | {連絡方法} | {SEV1のみ} |
| DB管理者 | {担当者} | {連絡方法} | {時間} |
| セキュリティ担当 | {担当者} | {連絡方法} | {セキュリティインシデント時} |

### 重要リンク

| 名前 | URL |
|------|-----|
| 監視ダッシュボード | {URL} |
| ログ集約 | {URL} |
| アラート一覧 | {URL} |
| インシデントチャンネル | {Slack #incident 等} |
| デプロイパイプライン | {URL} |
| コードリポジトリ | {URL} |

---

## 3. Severity定義

| Severity | 定義 | 影響範囲の例 | 初動目標 | 解決目標 | エスカレーション |
|----------|------|-----------|---------|---------|--------------|
| **SEV1** | サービス全停止・データ損失リスク・セキュリティ侵害 | 全ユーザーが利用不可 / DBに不正アクセス | **15分以内** | **4時間以内** | 即座に管理職+CTO |
| **SEV2** | 主要機能停止・大規模影響（>30%ユーザー）| 課金フロー停止 / 認証不可 | **30分以内** | **8時間以内** | 1時間以内に管理職 |
| **SEV3** | 一部機能停止・限定影響（<30%ユーザー） | 特定画面でエラー / 通知遅延 | **1時間以内** | **24時間以内** | 業務時間内にリーダー |
| **SEV4** | 軽微な問題・影響なし | UI表示バグ / ログ警告 | **4時間以内** | **1週間以内** | 通常チケット対応 |

---

## 4. 初動対応フロー（共通）

```
アラート受信
    ↓
[1] Severityを判定（Section 3 参照）
    ↓
[2] インシデントチャンネルに投稿
    「SEV{N} 発生: {症状の概要}
     対応開始: {自分の名前} @ {時刻}
     調査中...」
    ↓
[3] 調査開始（Section 5 の該当シナリオへ）
    ↓
[4] SEV1/SEV2の場合: エスカレーション
    ↓
[5] 定期的に状況をチャンネルへ投稿（SEV1:5分, SEV2:15分, SEV3:1時間ごと）
    ↓
[6] 緩和策を適用（Section 5 の対応手順）
    ↓
[7] 復旧確認（Section 7 チェックリスト）
    ↓
[8] クローズ投稿
    「SEV{N} 解消: {解消内容}
     総対応時間: {分}分
     次: ポストモーテム予定 or 不要」
    ↓
[9] SEV1/SEV2: ポストモーテム実施（Section 8）
```

### 緊急診断コマンド集

```bash
# === サービス状態確認 ===

# k8s: Podの状態確認
kubectl get pods -n <namespace> -o wide

# k8s: 直近のイベント確認
kubectl get events -n <namespace> --sort-by=.metadata.creationTimestamp | tail -20

# k8s: Podのログ確認（直近100行）
kubectl logs -n <namespace> <pod-name> --tail=100

# k8s: Podのログ確認（前のコンテナのクラッシュログ）
kubectl logs -n <namespace> <pod-name> --previous --tail=100

# k8s: コンテナへの接続
kubectl exec -it -n <namespace> <pod-name> -- sh

# === リソース使用状況 ===

# k8s: CPUとメモリ使用量
kubectl top pods -n <namespace>
kubectl top nodes

# AWS ECS: サービス状態
aws ecs describe-services --cluster <cluster-name> --services <service-name>

# AWS ECS: タスク一覧
aws ecs list-tasks --cluster <cluster-name> --service-name <service-name>

# === データベース ===

# PostgreSQL: 接続テスト
psql -h <db-host> -U <db-user> -d <db-name> -c "SELECT 1;"

# PostgreSQL: アクティブな接続数
psql -h <db-host> -U <db-user> -d <db-name> -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# PostgreSQL: 長時間実行クエリ
psql -h <db-host> -U <db-user> -d <db-name> -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC LIMIT 10;"

# PostgreSQL: ロック確認
psql -h <db-host> -U <db-user> -d <db-name> -c "SELECT * FROM pg_locks WHERE NOT granted;"

# === ネットワーク・外部依存 ===

# HTTPエンドポイントの応答確認
curl -I -o /dev/null -w "%{http_code} %{time_total}s" https://<api-endpoint>/health

# DNS確認
nslookup <hostname>
dig <hostname>

# ポート疎通確認
nc -zv <host> <port>
```

---

## 5. シナリオ別対応手順

---

### シナリオA: 高レイテンシ（応答時間劣化）

**症状**: P99レイテンシが {SLO閾値}ms を超えている / タイムアウトエラーが増加

**確認手順**:

```bash
# 1. 現在のエラー率とレイテンシを確認（Grafana / Datadog）
# ダッシュボード: {URL}

# 2. Pod のリソース使用量確認
kubectl top pods -n <namespace>

# 3. DBのスロークエリを確認
psql -h <db-host> -U <db-user> -d <db-name> \
  -c "SELECT pid, now() - query_start AS duration, query \
      FROM pg_stat_activity \
      WHERE state = 'active' AND (now() - query_start) > interval '5 seconds' \
      ORDER BY duration DESC;"

# 4. 外部API依存の確認（Stripe, SendGrid等）
curl -I -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" \
  https://<external-api-endpoint>/health

# 5. ログからエラーパターンを確認
kubectl logs -n <namespace> -l app=<app-name> --tail=200 | grep -E "(ERROR|WARN|timeout)"
```

**緩和策（優先順位順）**:

- [ ] **1. スケールアウト**（即効性あり）
  ```bash
  # k8s: レプリカ数を増やす
  kubectl scale deployment <deployment-name> -n <namespace> --replicas=<N>

  # HPA上限を一時的に引き上げる（緊急時）
  kubectl patch hpa <hpa-name> -n <namespace> \
    -p '{"spec":{"maxReplicas":<N>}}'
  ```

- [ ] **2. スロークエリへのインデックス追加**（DBが原因の場合）
  ```sql
  -- 実行計画を確認
  EXPLAIN ANALYZE <slow-query>;

  -- インデックス作成（非同期・本番影響なし）
  CREATE INDEX CONCURRENTLY idx_<table>_<column> ON <table>(<column>);
  ```

- [ ] **3. サーキットブレーカーの有効化**（外部API依存の場合）
  ```bash
  # 機能フラグで外部API依存を無効化
  # {機能フラグの変更方法をここに記載}
  ```

- [ ] **4. キャッシュのウォームアップ**
  ```bash
  # Redisのメモリ使用状況確認
  redis-cli -h <redis-host> info memory

  # キャッシュのクリアと再生成
  redis-cli -h <redis-host> FLUSHDB
  ```

---

### シナリオB: 高エラー率（5xx エラー増加）

**症状**: HTTP 5xx エラー率が {SLO閾値}% を超えている

**確認手順**:

```bash
# 1. エラーが発生しているPodを特定
kubectl get pods -n <namespace> -o wide
kubectl describe pod <pod-name> -n <namespace>

# 2. エラーログを確認
kubectl logs -n <namespace> <pod-name> --tail=200 | grep -E "ERROR|FATAL|panic|exception"

# 3. 最近のデプロイを確認（直近3件）
kubectl rollout history deployment/<deployment-name> -n <namespace>

# 4. 環境変数・Secret確認
kubectl get secret -n <namespace>
kubectl describe configmap -n <namespace>

# 5. アプリケーションのヘルスチェック
curl -v https://<app-url>/health
```

**緩和策（優先順位順）**:

- [ ] **1. 直近デプロイへのロールバック**（最有力原因）
  ```bash
  # ロールバック実行（Section 6 参照）
  kubectl rollout undo deployment/<deployment-name> -n <namespace>

  # ロールバック状態確認
  kubectl rollout status deployment/<deployment-name> -n <namespace>
  ```

- [ ] **2. Podの再起動**
  ```bash
  kubectl rollout restart deployment/<deployment-name> -n <namespace>
  ```

- [ ] **3. 環境変数・Secretの確認・修正**
  ```bash
  kubectl edit secret <secret-name> -n <namespace>
  ```

---

### シナリオC: DB接続障害

**症状**: "connection refused" / "too many connections" / DBへの接続が断続的に失敗

**確認手順**:

```bash
# 1. DB接続確認
psql -h <db-host> -U <db-user> -d <db-name> -c "SELECT 1;"

# 2. 接続数確認（max_connectionsとの比較）
psql -h <db-host> -U <db-user> -d <db-name> \
  -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# 3. max_connections確認
psql -h <db-host> -U <db-user> -d <db-name> \
  -c "SHOW max_connections;"

# 4. 長時間アイドル接続を確認
psql -h <db-host> -U <db-user> -d <db-name> \
  -c "SELECT pid, application_name, state, state_change \
      FROM pg_stat_activity \
      WHERE state = 'idle' AND state_change < now() - interval '10 minutes' \
      ORDER BY state_change;"

# 5. RDS/Cloud SQL の場合: マネージドコンソールで接続数グラフを確認
```

**緩和策（優先順位順）**:

- [ ] **1. アイドル接続の強制切断**
  ```sql
  -- アイドル接続を強制終了（注意: 切断される接続を確認してから実行）
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
    AND state_change < now() - interval '5 minutes'
    AND pid != pg_backend_pid();
  ```

- [ ] **2. アプリケーションのコネクションプール調整**
  ```bash
  # 環境変数でプールサイズを一時的に削減
  # DB_POOL_MAX を現在の半分に設定してデプロイ
  ```

- [ ] **3. PgBouncer / Connection Pooler の導入検討**
  > 中長期対応: ADR として記録し実装タスクへ

---

### シナリオD: メモリ/CPU枯渇

**症状**: Podが OOMKilled / CPU throttling が多発

**確認手順**:

```bash
# 1. リソース使用量確認
kubectl top pods -n <namespace>
kubectl top nodes

# 2. OOMKilled の確認
kubectl describe pod <pod-name> -n <namespace> | grep -A 3 "OOMKilled"

# 3. リソースリミット確認
kubectl describe deployment <deployment-name> -n <namespace> | grep -A 10 "Limits"

# 4. Podのメモリ推移（Grafana/Datadog で確認）
# ダッシュボード: {URL}
```

**緩和策（優先順位順）**:

- [ ] **1. リソースリミットの一時的な引き上げ**
  ```bash
  kubectl patch deployment <deployment-name> -n <namespace> \
    -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"limits":{"memory":"<NEW_LIMIT>","cpu":"<NEW_CPU>"}}}]}}}}'
  ```

- [ ] **2. スケールアウト**
  ```bash
  kubectl scale deployment <deployment-name> -n <namespace> --replicas=<N>
  ```

- [ ] **3. メモリリークの調査**
  ```bash
  # heap dump 取得（Node.jsの場合）
  kill -USR2 <pid>

  # プロファイリングの有効化（アプリ再起動が必要な場合あり）
  ```

---

### シナリオE: 外部API障害

**症状**: {外部サービス名}（Stripe / SendGrid 等）への呼び出しが失敗

**確認手順**:

```bash
# 1. ステータスページ確認
# - Stripe: https://status.stripe.com/
# - SendGrid: https://status.sendgrid.com/
# - AWS: https://health.aws.amazon.com/

# 2. 自分の側からの疎通確認
curl -I https://<external-api-endpoint>

# 3. エラーログの確認
kubectl logs -n <namespace> -l app=<app-name> --tail=200 \
  | grep -E "(stripe|sendgrid|external)"
```

**緩和策（優先順位順）**:

- [ ] **1. サーキットブレーカーの有効化 / フォールバック処理**
  ```bash
  # 機能フラグで外部依存処理を無効化
  # {フィーチャーフラグの設定方法をここに記載}
  ```

- [ ] **2. リトライ間隔の調整**（一時的な障害の場合）

- [ ] **3. 外部サービスのサポートに連絡**
  > {Stripe: https://support.stripe.com/contact}
  > {SendGrid: https://support.sendgrid.com/}

---

### シナリオF: セキュリティインシデント

**症状**: 不正アクセスの疑い / 異常なAPI呼び出し / データ漏洩の可能性

**⚠️ 最優先: SEV1として扱い、即座にセキュリティ担当を呼ぶ**

**確認手順**:

```bash
# 1. 疑わしいIPアドレスの特定
# ログから異常なアクセスパターンを探す
kubectl logs -n <namespace> -l app=<app-name> --tail=1000 \
  | grep -E "(401|403|429)" | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# 2. 現在のアクティブセッション確認
# DB の場合:
psql -h <db-host> -U <db-user> -d <db-name> \
  -c "SELECT * FROM active_sessions ORDER BY created_at DESC LIMIT 50;"

# 3. 最近の管理者操作ログ確認
# {監査ログの確認方法をここに記載}
```

**緩和策（優先順位順）**:

- [ ] **1. 疑わしいIPをブロック**（WAF / セキュリティグループ）
  ```bash
  # AWS WAF の場合
  aws wafv2 update-ip-set --scope REGIONAL \
    --id <ip-set-id> \
    --addresses <suspicious-ip>/32 \
    --lock-token <token>
  ```

- [ ] **2. 影響を受けたアカウントのセッション無効化**
  ```bash
  # {セッション無効化のコマンド or 手順をここに記載}
  ```

- [ ] **3. APIキー・Secretの緊急ローテーション**
  ```bash
  # {Secret rotation の手順をここに記載}
  ```

- [ ] **4. 関係機関への報告**（データ漏洩が確定した場合）
  > - 社内: 法務・経営層へ即報告
  > - 外部: 個人情報保護委員会（72時間以内）
  > - ユーザー通知の検討

---

## 6. ロールバック手順

### 6-1. アプリケーションロールバック

```bash
# 方法1: k8s ロールバック（直前のバージョンへ）
kubectl rollout undo deployment/<deployment-name> -n <namespace>

# ロールバック確認
kubectl rollout status deployment/<deployment-name> -n <namespace>

# 特定バージョンへのロールバック
kubectl rollout history deployment/<deployment-name> -n <namespace>
kubectl rollout undo deployment/<deployment-name> -n <namespace> --to-revision=<N>

# 方法2: 特定のイメージタグへ戻す（GitHub Actions等からの情報が必要）
kubectl set image deployment/<deployment-name> \
  <container-name>=<registry>/<image>:<previous-tag> \
  -n <namespace>
```

### 6-2. DBマイグレーションロールバック

```bash
# Prisma の場合
npx prisma migrate resolve --rolled-back <migration-name>

# Flyway の場合
flyway -url=<db-url> -user=<user> -password=<password> repair

# カスタムマイグレーションの場合
# {ロールバックスクリプトのパスと実行方法をここに記載}
```

> ⚠️ **注意**: マイグレーションのロールバックはデータ損失のリスクがある。
> 必ずDBバックアップの存在を確認してから実行する。

### 6-3. 設定変更ロールバック

```bash
# k8s ConfigMap のロールバック
# (ConfigMapのバージョン管理をしている場合)
kubectl apply -f <previous-configmap.yaml>

# Secrets のロールバック
kubectl create secret generic <secret-name> \
  --from-literal=<key>=<previous-value> \
  --dry-run=client -o yaml | kubectl apply -f -

# 機能フラグのロールバック
# {フィーチャーフラグ管理ツールの操作方法をここに記載}
```

### 6-4. DBバックアップからの復旧（最終手段）

```bash
# RDS の場合: スナップショットから復元
# AWSコンソール → RDS → Snapshots → Restore
# 注意: 新しいエンドポイントになるため、アプリの接続先変更が必要

# pg_dump バックアップからの復元
pg_restore -h <db-host> -U <db-user> -d <db-name> \
  --clean --if-exists <backup-file.dump>
```

---

## 7. 復旧確認チェックリスト

### 7-1. 即時確認（緩和策適用直後）

- [ ] ヘルスチェックエンドポイントが 200 を返している
  ```bash
  curl -f https://<app-url>/health && echo "OK" || echo "FAIL"
  ```
- [ ] エラー率が SLO閾値（{エラー率 SLO}%）を下回っている
- [ ] P99レイテンシが SLO閾値（{レイテンシ SLO}ms）を下回っている
- [ ] 全 Pod が Running 状態である
  ```bash
  kubectl get pods -n <namespace> | grep -v Running
  ```
- [ ] DBへの接続が正常である
- [ ] 外部依存サービスへの接続が正常である

### 7-2. インシデントクローズ確認（10〜30分後）

- [ ] 上記の指標が安定して10分以上継続している
- [ ] アラートが解消されている（PagerDuty / Alertmanager）
- [ ] Error Budget の消費が収束している
- [ ] インシデントチャンネルにクローズ報告を投稿した
- [ ] SEV1/SEV2の場合: ポストモーテム実施日を設定した（24〜48時間後）
- [ ] チケット/Issueを作成した（ポストモーテム実施 or 恒久対応追跡のため）

---

## 8. ポストモーテムテンプレート

> **実施対象**: SEV1・SEV2インシデント（SEV3は任意）
> **実施タイミング**: インシデント解消から24〜48時間以内
> **所要時間**: 60〜90分

```markdown
# ポストモーテム: {インシデント概要}

> 日時: {YYYY-MM-DD HH:MM} 〜 {HH:MM}（{N}時間{M}分）
> Severity: SEV{N}
> 対応者: {名前}
> 承認: {マネージャー名}（{日付}）

---

## 1. インシデントサマリー

{3〜5文でインシデントの全体像を記述。技術的背景のない人にも伝わるように。}

**影響範囲**:
- 影響ユーザー数: {N} 人（全体の {N}%）
- 影響機能: {機能名}
- 金銭的影響: {売上損失の推定 or 不明}
- ダウンタイム: {N}分間

---

## 2. タイムライン

| 時刻 | イベント |
|------|---------|
| {HH:MM} | {アラート発火} |
| {HH:MM} | {最初の対応開始} |
| {HH:MM} | {原因特定} |
| {HH:MM} | {緩和策適用} |
| {HH:MM} | {サービス回復確認} |
| {HH:MM} | {インシデントクローズ} |

---

## 3. 根本原因分析（RCA）

### 直接原因
{何が直接的なトリガーだったか}

### 根本原因（5-Whys）

1. **なぜ** {症状}が発生したか → {原因1}
2. **なぜ** {原因1}が発生したか → {原因2}
3. **なぜ** {原因2}が発生したか → {原因3}
4. **なぜ** {原因3}が発生したか → {原因4}
5. **なぜ** {原因4}が発生したか → {根本原因}

### 寄与要因
- {寄与要因1}（コード品質 / プロセス / 知識不足 等）
- {寄与要因2}

---

## 4. 良かった点（Blameless）

- {対応が素早かった点}
- {早期発見できた仕組み}
- {うまく機能した手順}

---

## 5. 改善アクション

| ID | アクション | 種別 | 担当者 | 期限 | 完了 |
|----|-----------|------|--------|------|------|
| PA-001 | {再発防止策1} | Prevention | {担当者} | {日付} | [ ] |
| PA-002 | {検知改善策} | Detection | {担当者} | {日付} | [ ] |
| PA-003 | {Runbook更新} | Mitigation | {担当者} | {日付} | [ ] |

種別:
- **Prevention**: 再発防止（根本原因の排除）
- **Detection**: 早期発見の改善（アラート精度向上等）
- **Mitigation**: 緩和策の改善（対応手順の自動化等）

---

## 6. 前提・学習

{このインシデントから得た技術的・組織的な教訓}

---

## 付録: 引用ログ・グラフ

{関連するログ抜粋、エラーグラフのスクリーンショット等}
```

---

## 9. 前提・仮定

| ID | 内容 | 検証方法 | リスク |
|----|------|---------|--------|
| ASM-001 | {前提内容} | {検証方法} | H/M/L |

---

## 10. 次のステップ

1. このRunbookを実際のインシデント対応演習（Gameday）でテストする
2. SLO未達アラートとシナリオの対応関係を整備する（`sdd-slo` 参照）
3. 新しいコンポーネントが追加されたらシナリオを追記する
4. 四半期ごとにRunbookをレビューし陳腐化を防ぐ
```

### Step C: 品質チェック（自己検証）

生成後に以下を確認する:
- [ ] すべてのコマンドに `<placeholder>` 形式のプレースホルダーが使用されているか
- [ ] Severity定義に「初動目標（分）」「解決目標（時間）」「エスカレーション先」が数値で記載されているか
- [ ] シナリオが最低5つ記載されているか（高レイテンシ / 高エラー率 / DB障害 / リソース枯渇 / 外部API障害）
- [ ] ロールバック手順にコマンド例が含まれているか
- [ ] ポストモーテムテンプレートに「5-Whys」と「改善アクション表」が含まれているか
- [ ] 復旧確認チェックリストが記載されているか
- [ ] SLO値（エラー率閾値・レイテンシ閾値）が slo.md の値と整合しているか

## 5. 最終応答（チャットに返す内容）

- 生成したRunbookのパス
- Severity定義の概要（SEV1〜SEV4の初動目標）
- 含まれるシナリオ数
- ロールバック手順数
- 次のアクション（演習・Gameday実施推奨）

## 6. 実行例

```bash
/sdd-runbook google-ad-report
```

前提:
- `.kiro/specs/google-ad-report/design.md`
- `.kiro/specs/google-ad-report/slo.md`

出力:
```
.kiro/specs/google-ad-report/
└── runbook.md
```

## 7. 後続スキルへの引き継ぎ

- `sdd-full`: 全成果物の一括生成時にRunbookも含まれる
- `sdd-slo`: SLO未達アラートとRunbookのシナリオを整合させる
- `sdd-tasks`: ポストモーテムの改善アクションをタスクに変換する（`/sdd-tasks` で実装タスク化）
- `sdd-threat`: セキュリティインシデント（シナリオF）の緩和策を脅威モデルと整合させる
