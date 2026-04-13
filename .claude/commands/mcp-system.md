# システムモニター スキル

taiyou-mcp-bundleのリソースモニター・プロセスインスペクターツール（22個）を活用するスキルです。

## 使用方法

```
/mcp-system
```

---

## 利用可能なMCPツール

### リソースモニター（10ツール）

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__system_cpu` | CPU使用率を取得 |
| `mcp__taiyou-mcp__system_memory` | メモリ使用量を取得 |
| `mcp__taiyou-mcp__system_disk` | ディスク容量を取得 |
| `mcp__taiyou-mcp__system_load` | システム負荷を取得 |
| `mcp__taiyou-mcp__system_uptime` | 稼働時間を取得 |
| `mcp__taiyou-mcp__system_info` | システム情報を取得 |
| `mcp__taiyou-mcp__system_battery` | バッテリー状態を取得 |
| `mcp__taiyou-mcp__system_temperature` | CPU温度を取得 |
| `mcp__taiyou-mcp__system_users` | ログインユーザーを取得 |
| `mcp__taiyou-mcp__system_processes_summary` | プロセスサマリーを取得 |

### プロセスインスペクター（12ツール）

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__process_list` | プロセス一覧を取得 |
| `mcp__taiyou-mcp__process_tree` | プロセスツリーを表示 |
| `mcp__taiyou-mcp__process_details` | プロセス詳細を取得 |
| `mcp__taiyou-mcp__process_top` | CPU使用率上位プロセス |
| `mcp__taiyou-mcp__process_memory_top` | メモリ使用率上位プロセス |
| `mcp__taiyou-mcp__process_search` | プロセス検索 |
| `mcp__taiyou-mcp__process_ports` | プロセスのポート使用状況 |
| `mcp__taiyou-mcp__process_files` | プロセスの開いているファイル |
| `mcp__taiyou-mcp__process_env` | プロセスの環境変数 |
| `mcp__taiyou-mcp__process_memory_details` | メモリ詳細分析 |
| `mcp__taiyou-mcp__process_children` | 子プロセス一覧 |
| `mcp__taiyou-mcp__process_limits` | プロセスのリソース制限 |

---

## ユースケース

### 1. システム全体の状態確認

```
「システムの状態を確認して」

使用ツール:
- mcp__taiyou-mcp__system_cpu
- mcp__taiyou-mcp__system_memory
- mcp__taiyou-mcp__system_disk
- mcp__taiyou-mcp__system_load

出力例:
【システム状態】
■ CPU使用率: 45%
■ メモリ: 8.2GB / 16GB (51%)
■ ディスク: 234GB / 500GB (47%)
■ システム負荷: 2.34, 2.12, 1.98
```

### 2. パフォーマンス問題の診断

```
「システムが重い原因を調べて」

使用ツール:
- mcp__taiyou-mcp__process_top
- mcp__taiyou-mcp__process_memory_top
- mcp__taiyou-mcp__system_load

出力例:
【パフォーマンス診断】
■ CPU高負荷プロセス:
  1. node (45%)
  2. chrome (23%)
  3. code (12%)

■ メモリ高使用プロセス:
  1. chrome (2.3GB)
  2. node (1.1GB)
  3. code (890MB)
```

### 3. 特定プロセスの調査

```
「nodeプロセスの詳細を見せて」

使用ツール:
- mcp__taiyou-mcp__process_search
- mcp__taiyou-mcp__process_details
- mcp__taiyou-mcp__process_ports
- mcp__taiyou-mcp__process_memory_details

パラメータ:
- name: "node"

出力例:
【プロセス詳細: node】
■ PID: 12345
■ CPU: 15%
■ メモリ: 256MB
■ 使用ポート: 3000, 8080
■ 起動時間: 2時間前
```

### 4. ポート使用状況の確認

```
「ポート3000を使っているプロセスを調べて」

使用ツール:
- mcp__taiyou-mcp__process_ports

出力例:
【ポート3000】
■ プロセス: node
■ PID: 12345
■ 状態: LISTEN
■ コマンド: node server.js
```

### 5. プロセスツリーの表示

```
「プロセスの親子関係を見せて」

使用ツール:
- mcp__taiyou-mcp__process_tree

出力例:
systemd(1)
├── sshd(1234)
│   └── bash(5678)
│       └── node(9012)
├── dockerd(2345)
│   └── containerd(3456)
```

### 6. バッテリー・温度監視（ノートPC）

```
「バッテリーとCPU温度を確認して」

使用ツール:
- mcp__taiyou-mcp__system_battery
- mcp__taiyou-mcp__system_temperature

出力例:
【電源状態】
■ バッテリー: 78%
■ 充電状態: 充電中
■ 残り時間: 3時間45分

【温度】
■ CPU: 52°C
■ 状態: 正常
```

---

## 組み合わせ例

### 総合システムレポート

```
「システムの総合レポートを作成して」

実行順序:
1. system_info - 基本情報
2. system_cpu - CPU状態
3. system_memory - メモリ状態
4. system_disk - ディスク状態
5. system_uptime - 稼働時間
6. process_top - 高負荷プロセス

出力:
━━━━━━━━━━━━━━━━━━━━
【システム総合レポート】
━━━━━━━━━━━━━━━━━━━━

■ システム情報
  OS: macOS 14.0
  ホスト名: MacBook-Pro
  稼働時間: 5日 12時間

■ リソース状況
  CPU: 32% (8コア)
  メモリ: 12.4GB / 32GB (39%)
  ディスク: 245GB / 1TB (24%)

■ 高負荷プロセス TOP3
  1. Docker (CPU: 18%)
  2. VSCode (CPU: 8%)
  3. Chrome (CPU: 5%)

■ 評価: 正常
━━━━━━━━━━━━━━━━━━━━
```

### 開発環境診断

```
「開発環境の状態を診断して」

実行順序:
1. process_search (node, docker, code)
2. process_ports (3000, 8080, 5432)
3. system_memory

出力:
━━━━━━━━━━━━━━━━━━━━
【開発環境診断】
━━━━━━━━━━━━━━━━━━━━

■ 実行中のサービス
  ✓ Node.js (PID: 1234, Port: 3000)
  ✓ Docker (PID: 2345)
  ✓ PostgreSQL (PID: 3456, Port: 5432)

■ 使用ポート
  3000: node (開発サーバー)
  5432: postgres (データベース)
  8080: 未使用

■ リソース状況
  開発関連メモリ: 4.2GB
  推奨: 十分な余裕あり
━━━━━━━━━━━━━━━━━━━━
```

---

## 注意事項

```
- 一部の情報は管理者権限が必要な場合があります
- プロセス操作（kill等）は含まれません（読み取り専用）
- リアルタイム監視ではなく、スナップショット取得です
```
