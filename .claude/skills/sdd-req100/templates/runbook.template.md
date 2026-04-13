# Runbook: <spec-slug>

> インシデント対応手順書。障害発生時に迅速かつ正確に対応するための手順を定義。

## 1. 概要

| 項目 | 値 |
|------|-----|
| 対象サービス | <サービス名> |
| オンコール | @team-oncall |
| エスカレーション | @team-lead → @engineering-manager |
| 最終更新 | YYYY-MM-DD |

## 2. 連絡先

| 役割 | 担当 | 連絡先 | 備考 |
|------|------|--------|------|
| Primary On-call | - | Slack: #oncall | 24/7 |
| Secondary On-call | - | Slack: #oncall | バックアップ |
| Engineering Manager | - | 電話: xxx-xxxx | SEV1のみ |
| SRE Lead | - | Slack: @sre-lead | インフラ問題 |
| Security Team | - | Slack: #security | セキュリティインシデント |

## 3. 重要リンク

| リソース | URL |
|---------|-----|
| ダッシュボード | https://grafana.example.com/d/xxx |
| ログ | https://logs.example.com |
| アラート | https://alerts.example.com |
| ステータスページ | https://status.example.com |
| インシデント管理 | https://incident.example.com |
| デプロイパイプライン | https://ci.example.com |

## 4. Severity定義

| Severity | 定義 | 初動目標 | 解決目標 | 例 |
|----------|------|---------|---------|-----|
| **SEV1** | サービス全停止、データ損失リスク | 15分 | 4時間 | 全ユーザー影響、DBダウン |
| **SEV2** | 主要機能停止、大規模影響 | 30分 | 8時間 | 決済不可、50%以上影響 |
| **SEV3** | 一部機能停止、限定影響 | 1時間 | 24時間 | 特定機能エラー、10%以下影響 |
| **SEV4** | 軽微な問題、ワークアラウンド可能 | 4時間 | 1週間 | UI不具合、パフォーマンス低下 |

## 5. 共通対応手順

### 5.1 初動対応（全Severity共通）

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: アラート確認（1分以内）                                  │
├─────────────────────────────────────────────────────────────────┤
│ □ アラート内容を確認                                             │
│ □ 影響範囲を推定                                                 │
│ □ Severity判定                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: コミュニケーション開始（5分以内）                        │
├─────────────────────────────────────────────────────────────────┤
│ □ #incident チャンネルにスレッド作成                             │
│ □ SEV1/2: 電話でエスカレーション                                 │
│ □ ステータスページ更新（顧客影響あり）                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: 調査・緩和（並行実行）                                   │
├─────────────────────────────────────────────────────────────────┤
│ □ ダッシュボード・ログ確認                                       │
│ □ 直近の変更確認（デプロイ、設定変更）                           │
│ □ 緩和策実行（ロールバック、スケールアウト等）                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: 復旧確認                                                 │
├─────────────────────────────────────────────────────────────────┤
│ □ SLI正常化を確認                                                │
│ □ 5分間安定を確認                                                │
│ □ ステータスページ更新（復旧）                                   │
│ □ インシデントクローズ                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: ポストモーテム（48時間以内）                             │
├─────────────────────────────────────────────────────────────────┤
│ □ タイムライン作成                                               │
│ □ 根本原因分析（RCA）                                            │
│ □ 改善アクション起票                                             │
│ □ レビュー会議開催                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 緊急コマンド集

```bash
# 現在のPod状態確認
kubectl get pods -n <namespace> -o wide

# Pod再起動
kubectl rollout restart deployment/<deployment> -n <namespace>

# 直近ログ確認
kubectl logs -f deployment/<deployment> -n <namespace> --tail=100

# デプロイロールバック
kubectl rollout undo deployment/<deployment> -n <namespace>

# スケールアウト
kubectl scale deployment/<deployment> --replicas=5 -n <namespace>

# DB接続確認
psql -h <host> -U <user> -d <database> -c "SELECT 1"

# Redis接続確認
redis-cli -h <host> ping

# 負荷状況確認
top -bn1 | head -20
```

## 6. シナリオ別対応

### 6.1 高レイテンシ

**症状**: P99 > 500ms

**確認手順**:
```bash
# 1. どのエンドポイントが遅いか確認
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/slow-endpoint

# 2. DB slow queryログ確認
tail -f /var/log/postgresql/postgresql-*-slow.log

# 3. 外部API応答時間確認
kubectl logs deployment/api -n prod | grep "external_api_duration"
```

**緩和策**:
1. キャッシュ有効化/TTL短縮
2. DB接続プール増加
3. 外部APIタイムアウト短縮
4. スケールアウト

### 6.2 高エラー率

**症状**: 5xx > 1%

**確認手順**:
```bash
# 1. エラーログ確認
kubectl logs deployment/api -n prod | grep -i error | tail -50

# 2. エラー内訳
curl -s http://prometheus:9090/api/v1/query?query=sum(rate(http_requests_total{status=~"5.."}[5m]))by(status,path)

# 3. 依存サービス確認
curl -s http://api.example.com/health/dependencies
```

**緩和策**:
1. エラー原因特定 → 該当機能無効化
2. ロールバック（直近デプロイ原因の場合）
3. サーキットブレーカー発動確認

### 6.3 DB接続障害

**症状**: "connection refused" or "too many connections"

**確認手順**:
```bash
# 1. DB接続数確認
psql -c "SELECT count(*) FROM pg_stat_activity;"

# 2. アクティブクエリ確認
psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active';"

# 3. ロック確認
psql -c "SELECT * FROM pg_locks WHERE NOT granted;"
```

**緩和策**:
1. アイドル接続強制切断
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes';
   ```
2. コネクションプール再起動
3. 長時間クエリ強制終了

### 6.4 メモリ/CPU枯渇

**症状**: OOMKilled, CPU throttling

**確認手順**:
```bash
# 1. リソース使用状況
kubectl top pods -n prod

# 2. OOMイベント確認
kubectl get events -n prod | grep -i oom

# 3. Pod詳細
kubectl describe pod <pod-name> -n prod
```

**緩和策**:
1. Pod再起動（一時的）
2. リソース制限引き上げ
3. スケールアウト
4. メモリリーク調査（heap dump）

### 6.5 セキュリティインシデント

**症状**: 不正アクセス検知、データ漏洩疑い

**対応手順**:
```
⚠️ セキュリティチームに即時エスカレーション

1. 影響範囲特定（侵害されたシステム/データ）
2. 証拠保全（ログ、スナップショット）
3. 封じ込め（アクセス遮断、認証情報ローテーション）
4. 法務・広報連携（必要に応じて）
5. フォレンジック調査
```

## 7. ロールバック手順

### 7.1 アプリケーションロールバック

```bash
# 1. 現在のリビジョン確認
kubectl rollout history deployment/api -n prod

# 2. 前バージョンにロールバック
kubectl rollout undo deployment/api -n prod

# 3. 特定リビジョンにロールバック
kubectl rollout undo deployment/api -n prod --to-revision=<revision>

# 4. ロールバック状況確認
kubectl rollout status deployment/api -n prod
```

### 7.2 DBマイグレーションロールバック

```bash
# 1. 現在のマイグレーション状態確認
npx prisma migrate status

# 2. ロールバック（事前にダウンマイグレーション作成必要）
npx prisma migrate resolve --rolled-back <migration_name>

# 注意: 本番DBのロールバックは慎重に！
# 必ずバックアップ取得後に実行
```

### 7.3 設定変更ロールバック

```bash
# 1. ConfigMap履歴確認
kubectl get configmap <name> -n prod -o yaml

# 2. 前バージョンに戻す（GitOpsの場合）
git revert <commit-hash>
git push origin main

# ArgoCD/Flux自動同期で反映
```

## 8. 確認チェックリスト

### 復旧確認チェックリスト

- [ ] エラー率 < 0.1% (5分間)
- [ ] P99レイテンシ < 500ms (5分間)
- [ ] ヘルスチェック全パス
- [ ] 依存サービス正常
- [ ] ユーザー報告なし
- [ ] モニタリングアラートなし

### インシデントクローズチェックリスト

- [ ] ステータスページ更新（解決）
- [ ] #incident スレッドクローズ
- [ ] インシデントチケット更新
- [ ] ポストモーテムスケジュール（SEV1/2）
- [ ] 一時対応の恒久対応計画

## 9. 関連ドキュメント

- [slo.md](./slo.md) - SLO/SLI定義
- [design.md](./design.md) - システム構成
- [threat-model.md](./threat-model.md) - セキュリティ対応
