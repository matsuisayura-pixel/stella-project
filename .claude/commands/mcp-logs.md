# ログアグリゲーター スキル

taiyou-mcp-bundleのログ管理・分析ツール（7個）を活用するスキルです。

## 使用方法

```
/mcp-logs
```

---

## 利用可能なMCPツール

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__log_sources` | ログソース一覧を取得 |
| `mcp__taiyou-mcp__log_read` | ログファイルを読み取り |
| `mcp__taiyou-mcp__log_tail` | ログの末尾を取得 |
| `mcp__taiyou-mcp__log_search` | ログ内検索 |
| `mcp__taiyou-mcp__log_errors` | エラーログをフィルタリング |
| `mcp__taiyou-mcp__log_warnings` | 警告ログをフィルタリング |
| `mcp__taiyou-mcp__log_stats` | ログ統計分析 |

---

## ユースケース

### 1. ログソースの確認

```
「利用可能なログを一覧表示して」

使用ツール:
- mcp__taiyou-mcp__log_sources

出力例:
【ログソース一覧】
■ システムログ
  - /var/log/system.log
  - /var/log/syslog

■ アプリケーションログ
  - ./logs/app.log
  - ./logs/error.log

■ サービスログ
  - ~/.pm2/logs/
  - /var/log/nginx/
```

### 2. 最新ログの確認

```
「アプリケーションの最新ログを見せて」

使用ツール:
- mcp__taiyou-mcp__log_tail

パラメータ:
- path: "./logs/app.log"
- lines: 50 (行数)

出力例:
【最新ログ: app.log】
2024-01-15 10:30:45 [INFO] Server started on port 3000
2024-01-15 10:30:46 [INFO] Database connected
2024-01-15 10:31:00 [INFO] Request: GET /api/users
2024-01-15 10:31:01 [WARN] Slow query detected (523ms)
2024-01-15 10:31:15 [ERROR] Connection timeout
...
```

### 3. エラーログの抽出

```
「エラーログだけを見せて」

使用ツール:
- mcp__taiyou-mcp__log_errors

パラメータ:
- path: "./logs/app.log"
- limit: 20

出力例:
【エラーログ】
■ 10:31:15 [ERROR] Connection timeout
  → Database connection failed after 30s

■ 10:45:23 [ERROR] Unhandled exception
  → TypeError: Cannot read property 'id'

■ 11:02:08 [ERROR] API Error
  → 503 Service Unavailable

合計: 3件（過去24時間）
```

### 4. 警告ログの抽出

```
「警告ログを確認して」

使用ツール:
- mcp__taiyou-mcp__log_warnings

パラメータ:
- path: "./logs/app.log"

出力例:
【警告ログ】
■ 10:31:01 [WARN] Slow query detected (523ms)
■ 10:45:00 [WARN] Memory usage high (85%)
■ 11:00:00 [WARN] Rate limit approaching

合計: 12件（過去24時間）
```

### 5. ログ内検索

```
「'timeout'を含むログを検索して」

使用ツール:
- mcp__taiyou-mcp__log_search

パラメータ:
- path: "./logs/"
- pattern: "timeout"
- case_sensitive: false

出力例:
【検索結果: "timeout"】
■ app.log:1234
  [ERROR] Connection timeout after 30s

■ app.log:1567
  [WARN] Request timeout warning

■ error.log:89
  [ERROR] Database query timeout

合計: 15件
```

### 6. ログ統計分析

```
「ログの統計を分析して」

使用ツール:
- mcp__taiyou-mcp__log_stats

パラメータ:
- path: "./logs/app.log"

出力例:
【ログ統計: app.log】
■ 期間: 2024-01-15 00:00 〜 23:59

■ レベル別
  INFO:  1,234件 (85%)
  WARN:    156件 (11%)
  ERROR:    45件 (3%)
  DEBUG:    12件 (1%)

■ 時間帯別
  00-06時:  234件
  06-12時:  567件 ←ピーク
  12-18時:  423件
  18-24時:  223件

■ 頻出パターン
  1. "Request: GET" - 456回
  2. "Database query" - 234回
  3. "Cache hit" - 189回
```

---

## 組み合わせ例

### エラー診断

```
「アプリケーションのエラーを診断して」

実行順序:
1. log_errors - エラー抽出
2. log_warnings - 警告抽出
3. log_stats - 統計分析

出力:
━━━━━━━━━━━━━━━━━━━━
【エラー診断レポート】
━━━━━━━━━━━━━━━━━━━━

■ サマリー
  エラー: 12件
  警告: 45件
  期間: 過去24時間

■ エラー種別
  Connection timeout: 5件
  Unhandled exception: 4件
  API Error: 3件

■ 時間帯分析
  ピーク: 10:00-11:00 (8件)
  原因推定: DBサーバー負荷

■ 推奨アクション
  1. DB接続プールの確認
  2. タイムアウト設定の見直し
  3. エラーハンドリングの追加
━━━━━━━━━━━━━━━━━━━━
```

### パフォーマンス分析

```
「パフォーマンス関連のログを分析して」

実行順序:
1. log_search ("slow" OR "timeout" OR "memory")
2. log_stats
3. log_warnings

出力:
━━━━━━━━━━━━━━━━━━━━
【パフォーマンス分析】
━━━━━━━━━━━━━━━━━━━━

■ 検出された問題
  Slow query: 23件
  Timeout: 8件
  High memory: 5件

■ 影響を受けたエンドポイント
  /api/users: 12件
  /api/reports: 8件
  /api/search: 6件

■ トレンド
  昨日比: +15%増加
  先週比: +30%増加

■ 推奨
  1. クエリの最適化
  2. キャッシュの導入
  3. インデックスの見直し
━━━━━━━━━━━━━━━━━━━━
```

### 日次ログレポート

```
「今日のログレポートを作成して」

実行順序:
1. log_stats (今日分)
2. log_errors
3. log_warnings

出力:
━━━━━━━━━━━━━━━━━━━━
【日次ログレポート】
2024-01-15
━━━━━━━━━━━━━━━━━━━━

■ 概要
  総ログ数: 5,678件
  エラー率: 0.8%
  可用性: 99.2%

■ ハイライト
  ✓ 重大エラー: 0件
  ⚠ 警告: 45件
  ✗ エラー: 45件

■ 主要イベント
  09:15 - デプロイ完了
  10:30 - 一時的な負荷増加
  14:00 - 定期メンテナンス

■ 明日の注意点
  - メモリ使用量の監視
  - 10:00台の負荷対策
━━━━━━━━━━━━━━━━━━━━
```

---

## 対応ログフォーマット

```
【自動検出されるフォーマット】
- JSON形式
- Apache/Nginx形式
- Syslog形式
- カスタム形式（パターン指定）

【タイムスタンプ形式】
- ISO 8601
- Unix timestamp
- カスタム形式
```

---

## 注意事項

```
- 大きなログファイルの読み取りは時間がかかります
- リアルタイム監視ではありません
- 読み取り専用（ログの削除・変更は行いません）
- 圧縮ログ（.gz等）は対応していません
```
