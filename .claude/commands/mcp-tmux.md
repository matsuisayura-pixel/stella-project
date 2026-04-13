# Tmuxモニター スキル

taiyou-mcp-bundleのTmux管理ツール（10個）を活用するスキルです。

## 使用方法

```
/mcp-tmux
```

> **前提**: tmuxがインストールされている必要があります

---

## 利用可能なMCPツール

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__tmux_sessions` | セッション一覧を取得 |
| `mcp__taiyou-mcp__tmux_windows` | ウィンドウ一覧を取得 |
| `mcp__taiyou-mcp__tmux_panes` | ペイン一覧を取得 |
| `mcp__taiyou-mcp__tmux_session_info` | セッション詳細情報 |
| `mcp__taiyou-mcp__tmux_capture` | ペイン内容をキャプチャ |
| `mcp__taiyou-mcp__tmux_history` | コマンド履歴を取得 |
| `mcp__taiyou-mcp__tmux_search` | ペイン内検索 |
| `mcp__taiyou-mcp__tmux_env` | 環境変数を取得 |
| `mcp__taiyou-mcp__tmux_layout` | レイアウト情報を取得 |
| `mcp__taiyou-mcp__tmux_clients` | 接続クライアント一覧 |

---

## ユースケース

### 1. セッション一覧の確認

```
「tmuxセッションを一覧表示して」

使用ツール:
- mcp__taiyou-mcp__tmux_sessions

出力例:
【Tmuxセッション一覧】
■ dev (3 windows) - attached
  作成: 2時間前
  最終アクティブ: 5分前

■ server (2 windows) - detached
  作成: 1日前
  最終アクティブ: 30分前

■ logs (1 window) - detached
  作成: 3日前
```

### 2. セッション詳細の確認

```
「devセッションの詳細を見せて」

使用ツール:
- mcp__taiyou-mcp__tmux_session_info
- mcp__taiyou-mcp__tmux_windows

パラメータ:
- session: "dev"

出力例:
【セッション: dev】
■ ウィンドウ一覧
  0: editor (vim)
  1: terminal (zsh)
  2: server (node)

■ アクティブウィンドウ: 0
■ 接続クライアント: 1
■ 作成日時: 2024-01-15 10:00
```

### 3. ペイン内容のキャプチャ

```
「現在のペインの出力を見せて」

使用ツール:
- mcp__taiyou-mcp__tmux_capture

パラメータ:
- session: "dev"
- window: 2
- pane: 0
- lines: 50

出力例:
【ペインキャプチャ: dev:2.0】
━━━━━━━━━━━━━━━━━━━━
> npm run dev

  VITE v5.0.0  ready in 500ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/

[10:30:45] Compiled successfully
[10:31:00] Request: GET /api/users
━━━━━━━━━━━━━━━━━━━━
```

### 4. ペイン内検索

```
「errorを含む出力を検索して」

使用ツール:
- mcp__taiyou-mcp__tmux_search

パラメータ:
- pattern: "error"
- session: "server"

出力例:
【検索結果: "error"】
■ server:0.0 (line 45)
  [ERROR] Connection refused

■ server:1.0 (line 123)
  Error: ENOENT: no such file
```

### 5. ウィンドウ/ペイン構成の確認

```
「全ウィンドウとペインの構成を見せて」

使用ツール:
- mcp__taiyou-mcp__tmux_windows
- mcp__taiyou-mcp__tmux_panes
- mcp__taiyou-mcp__tmux_layout

出力例:
【Tmux構成: dev】
■ Window 0: editor [180x50]
  └── Pane 0: vim (active)

■ Window 1: terminal [180x50]
  ├── Pane 0: zsh (top)
  └── Pane 1: htop (bottom)

■ Window 2: server [180x50]
  ├── Pane 0: node server
  ├── Pane 1: npm logs
  └── Pane 2: docker logs
```

### 6. コマンド履歴の確認

```
「最近のコマンド履歴を見せて」

使用ツール:
- mcp__taiyou-mcp__tmux_history

パラメータ:
- session: "dev"
- limit: 20

出力例:
【コマンド履歴: dev】
1. npm run dev
2. git status
3. git add .
4. git commit -m "feat: update"
5. npm test
...
```

### 7. 接続クライアントの確認

```
「接続中のクライアントを確認して」

使用ツール:
- mcp__taiyou-mcp__tmux_clients

出力例:
【接続クライアント】
■ /dev/ttys001
  セッション: dev
  サイズ: 180x50
  アクティブ: Yes

■ /dev/ttys002
  セッション: server
  サイズ: 120x30
  アクティブ: No
```

---

## 組み合わせ例

### 開発環境の状態確認

```
「開発環境の状態を確認して」

実行順序:
1. tmux_sessions - セッション一覧
2. tmux_windows - ウィンドウ詳細
3. tmux_capture - サーバー出力
4. tmux_search ("error") - エラー検索

出力:
━━━━━━━━━━━━━━━━━━━━
【開発環境状態】
━━━━━━━━━━━━━━━━━━━━

■ アクティブセッション
  dev: 3 windows (attached)

■ 実行中のプロセス
  Window 0: vim (編集中)
  Window 1: zsh (待機中)
  Window 2: node (実行中)

■ サーバー状態
  ✓ 正常稼働中
  最終出力: Compiled successfully

■ エラー検出
  なし

■ 評価: 正常
━━━━━━━━━━━━━━━━━━━━
```

### ログ監視

```
「全セッションのログを確認して」

実行順序:
1. tmux_sessions
2. tmux_capture (各セッション)
3. tmux_search ("error" OR "warn")

出力:
━━━━━━━━━━━━━━━━━━━━
【ログ監視レポート】
━━━━━━━━━━━━━━━━━━━━

■ dev:server
  最新出力: Request processed
  エラー: なし

■ server:logs
  最新出力: [INFO] Health check OK
  警告: 1件（メモリ使用量）

■ logs:nginx
  最新出力: 200 GET /api/users
  エラー: なし
━━━━━━━━━━━━━━━━━━━━
```

---

## tmuxコマンドチートシート

```
【セッション操作】
tmux new -s name     # 新規セッション
tmux attach -t name  # アタッチ
tmux detach          # デタッチ (Ctrl+b d)
tmux kill-session -t name

【ウィンドウ操作】
Ctrl+b c  # 新規ウィンドウ
Ctrl+b n  # 次のウィンドウ
Ctrl+b p  # 前のウィンドウ
Ctrl+b &  # ウィンドウを閉じる

【ペイン操作】
Ctrl+b %  # 縦分割
Ctrl+b "  # 横分割
Ctrl+b o  # ペイン切り替え
Ctrl+b x  # ペインを閉じる
```

---

## 注意事項

```
- tmuxがインストールされていない場合は動作しません
- セッションが存在しない場合はエラーになります
- 読み取り専用（セッション操作は行いません）
- 大量の出力は切り詰められる場合があります
```
