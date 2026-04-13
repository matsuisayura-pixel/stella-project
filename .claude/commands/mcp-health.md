# システム総合診断 スキル

taiyou-mcp-bundleの全ツールを組み合わせた総合診断スキルです。

## 使用方法

```
/mcp-health
```

---

## 診断カテゴリ

### 1. クイックヘルスチェック

```
「システムのヘルスチェックを実行して」

使用ツール:
- mcp__taiyou-mcp__health_check

出力例:
━━━━━━━━━━━━━━━━━━━━
【ヘルスチェック結果】
━━━━━━━━━━━━━━━━━━━━

■ Git接続
  ✓ リポジトリ: 正常
  ✓ リモート: 接続OK

■ GitHub API
  ✓ 認証: 有効
  ✓ レート制限: 4,850/5,000

■ システムリソース
  ✓ CPU: 35% (正常)
  ✓ メモリ: 62% (正常)
  ✓ ディスク: 45% (正常)

■ ネットワーク
  ✓ インターネット: 接続OK
  ✓ DNS: 正常

■ 総合評価: ✓ 正常
━━━━━━━━━━━━━━━━━━━━
```

---

### 2. 開発環境診断

```
「開発環境の総合診断を実行して」

使用ツール:
- mcp__taiyou-mcp__system_info
- mcp__taiyou-mcp__git_status
- mcp__taiyou-mcp__process_search (node, docker)
- mcp__taiyou-mcp__network_ports
- mcp__taiyou-mcp__file_recent

出力:
━━━━━━━━━━━━━━━━━━━━
【開発環境診断レポート】
━━━━━━━━━━━━━━━━━━━━

■ システム情報
  OS: macOS 14.0
  Node: v20.10.0
  npm: 10.2.0
  Docker: 24.0.7

■ Git状態
  ブランチ: feature/new-feature
  変更ファイル: 3
  コミット待ち: あり

■ 実行中サービス
  ✓ Node.js (port: 3000)
  ✓ PostgreSQL (port: 5432)
  ✓ Redis (port: 6379)
  ✗ Docker: 未起動

■ 最近の変更
  - src/App.tsx (5分前)
  - package.json (1時間前)

■ 推奨アクション
  1. Dockerを起動してください
  2. 変更をコミットしてください
━━━━━━━━━━━━━━━━━━━━
```

---

### 3. パフォーマンス診断

```
「パフォーマンス診断を実行して」

使用ツール:
- mcp__taiyou-mcp__system_cpu
- mcp__taiyou-mcp__system_memory
- mcp__taiyou-mcp__system_load
- mcp__taiyou-mcp__process_top
- mcp__taiyou-mcp__process_memory_top
- mcp__taiyou-mcp__log_errors

出力:
━━━━━━━━━━━━━━━━━━━━
【パフォーマンス診断】
━━━━━━━━━━━━━━━━━━━━

■ リソース使用状況
  CPU: ████████░░ 78% ⚠
  メモリ: ██████░░░░ 62%
  ディスク: ████░░░░░░ 45%
  負荷: 3.45, 2.89, 2.12

■ 高負荷プロセス
  1. chrome (CPU: 45%, Mem: 2.3GB)
  2. node (CPU: 23%, Mem: 890MB)
  3. docker (CPU: 8%, Mem: 1.2GB)

■ メモリ消費上位
  1. chrome: 2.3GB
  2. docker: 1.2GB
  3. code: 980MB

■ 最近のエラー
  - Connection timeout (3件)
  - Memory warning (2件)

■ 診断結果
  ⚠ CPU使用率が高め
  推奨: 不要なChromeタブを閉じる

■ スコア: 72/100 (普通)
━━━━━━━━━━━━━━━━━━━━
```

---

### 4. ネットワーク診断

```
「ネットワーク診断を実行して」

使用ツール:
- mcp__taiyou-mcp__network_interfaces
- mcp__taiyou-mcp__network_public_ip
- mcp__taiyou-mcp__network_wifi
- mcp__taiyou-mcp__network_ping
- mcp__taiyou-mcp__network_dns
- mcp__taiyou-mcp__network_ports

出力:
━━━━━━━━━━━━━━━━━━━━
【ネットワーク診断】
━━━━━━━━━━━━━━━━━━━━

■ 接続状態
  ✓ インターネット: 接続中
  ✓ WiFi: MyNetwork (-42dBm)
  ✓ DNS: 正常

■ IPアドレス
  ローカル: 192.168.1.100
  パブリック: 203.0.113.50
  ゲートウェイ: 192.168.1.1

■ 接続テスト
  google.com: 12ms ✓
  github.com: 45ms ✓
  api.anthropic.com: 89ms ✓

■ 使用ポート
  22 (SSH)
  80 (HTTP)
  443 (HTTPS)
  3000 (Node)
  5432 (PostgreSQL)

■ 評価: ✓ 良好
━━━━━━━━━━━━━━━━━━━━
```

---

### 5. プロジェクト診断

```
「プロジェクトの状態を診断して」

使用ツール:
- mcp__taiyou-mcp__git_status
- mcp__taiyou-mcp__git_log
- mcp__taiyou-mcp__github_issues
- mcp__taiyou-mcp__github_pull_requests
- mcp__taiyou-mcp__github_workflow_runs
- mcp__taiyou-mcp__file_tree

出力:
━━━━━━━━━━━━━━━━━━━━
【プロジェクト診断】
━━━━━━━━━━━━━━━━━━━━

■ リポジトリ情報
  名前: taiyou-taiyo
  ブランチ: main
  最終コミット: 30分前

■ Issue状況
  オープン: 5件
  - P1: 1件 ⚠
  - P2: 2件
  - P3: 2件

■ PR状況
  オープン: 2件
  - レビュー待ち: 1件
  - CI実行中: 1件

■ CI/CD
  最新ビルド: ✓ success
  デプロイ: ✓ success
  テストカバレッジ: 85%

■ コード品質
  変更待ちファイル: 3
  最近の変更: 12ファイル

■ 推奨アクション
  1. P1 Issueに対応
  2. PRのレビュー
━━━━━━━━━━━━━━━━━━━━
```

---

### 6. セキュリティ診断

```
「セキュリティ診断を実行して」

使用ツール:
- mcp__taiyou-mcp__network_ports
- mcp__taiyou-mcp__process_list
- mcp__taiyou-mcp__file_permissions
- mcp__taiyou-mcp__github_branch_protection

出力:
━━━━━━━━━━━━━━━━━━━━
【セキュリティ診断】
━━━━━━━━━━━━━━━━━━━━

■ オープンポート
  ✓ 22 (SSH): 認証済み接続のみ
  ✓ 80 (HTTP): → 443リダイレクト
  ✓ 443 (HTTPS): TLS有効
  ⚠ 3000 (Node): 開発サーバー露出

■ ファイルパーミッション
  ✓ .env: 600 (適切)
  ✓ scripts/: 755 (適切)
  ⚠ logs/: 777 (要確認)

■ GitHub設定
  ✓ main: ブランチ保護有効
  ✓ レビュー必須: 有効
  ✓ CI必須: 有効

■ 推奨アクション
  1. 開発サーバーをlocalhostに制限
  2. logsディレクトリのパーミッション修正

■ スコア: 85/100 (良好)
━━━━━━━━━━━━━━━━━━━━
```

---

## 診断レベル

| レベル | 実行時間 | 内容 |
|--------|---------|------|
| quick | 5秒 | 基本ヘルスチェック |
| standard | 15秒 | 主要項目の診断 |
| full | 60秒 | 全項目の詳細診断 |

```
「クイック診断を実行して」
→ quick レベル

「詳細診断を実行して」
→ full レベル
```

---

## 定期診断の推奨

```
【毎日】
- クイックヘルスチェック
- エラーログ確認

【毎週】
- パフォーマンス診断
- プロジェクト診断

【毎月】
- セキュリティ診断
- 全項目フル診断
```

---

## 参照スキル

詳細な診断が必要な場合は、以下の専用スキルを使用:

- `/mcp-git` - Git詳細診断
- `/mcp-system` - システム詳細診断
- `/mcp-network` - ネットワーク詳細診断
- `/mcp-github` - GitHub詳細診断
- `/mcp-files` - ファイル詳細診断
- `/mcp-logs` - ログ詳細診断
- `/mcp-tmux` - Tmux詳細診断
