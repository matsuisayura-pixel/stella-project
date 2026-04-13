# ファイルウォッチャー スキル

taiyou-mcp-bundleのファイルシステム操作ツール（10個）を活用するスキルです。

## 使用方法

```
/mcp-files
```

---

## 利用可能なMCPツール

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__file_recent` | 最近変更されたファイル一覧 |
| `mcp__taiyou-mcp__file_tree` | ディレクトリツリー表示 |
| `mcp__taiyou-mcp__file_search` | ファイル名検索 |
| `mcp__taiyou-mcp__file_size` | ファイル/ディレクトリサイズ |
| `mcp__taiyou-mcp__file_stats` | ファイル統計情報 |
| `mcp__taiyou-mcp__file_compare` | ファイル比較 |
| `mcp__taiyou-mcp__file_checksum` | チェックサム計算 |
| `mcp__taiyou-mcp__file_duplicates` | 重複ファイル検出 |
| `mcp__taiyou-mcp__file_large` | 大きいファイル検索 |
| `mcp__taiyou-mcp__file_permissions` | パーミッション確認 |

---

## ユースケース

### 1. 最近の変更ファイル確認

```
「最近変更されたファイルを見せて」

使用ツール:
- mcp__taiyou-mcp__file_recent

パラメータ:
- path: "." (デフォルト: カレントディレクトリ)
- limit: 10 (表示件数)

出力例:
【最近の変更ファイル】
■ 5分前
  - src/components/Header.tsx
  - src/App.tsx

■ 30分前
  - package.json
  - package-lock.json

■ 1時間前
  - README.md
```

### 2. ディレクトリ構造の確認

```
「srcディレクトリの構造を見せて」

使用ツール:
- mcp__taiyou-mcp__file_tree

パラメータ:
- path: "src"
- depth: 3 (深さ)

出力例:
src/
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Sidebar/
│       ├── index.tsx
│       └── MenuItem.tsx
├── pages/
│   ├── Home.tsx
│   └── About.tsx
├── utils/
│   └── helpers.ts
└── App.tsx
```

### 3. ファイル検索

```
「.tsxファイルを全て検索して」

使用ツール:
- mcp__taiyou-mcp__file_search

パラメータ:
- pattern: "*.tsx"
- path: "."

出力例:
【検索結果: *.tsx】
■ 見つかったファイル: 15件

src/App.tsx
src/components/Header.tsx
src/components/Footer.tsx
src/pages/Home.tsx
...
```

### 4. ディスク使用量の確認

```
「node_modulesのサイズを確認して」

使用ツール:
- mcp__taiyou-mcp__file_size

パラメータ:
- path: "node_modules"

出力例:
【サイズ: node_modules】
■ 合計: 456 MB
■ ファイル数: 12,345
■ ディレクトリ数: 1,234
```

### 5. 大きいファイルの検索

```
「大きいファイルを探して」

使用ツール:
- mcp__taiyou-mcp__file_large

パラメータ:
- path: "."
- min_size: "10MB" (最小サイズ)
- limit: 10

出力例:
【大きいファイル TOP10】
■ 45MB - data/backup.sql
■ 23MB - public/video.mp4
■ 15MB - node_modules/.cache/xxx
■ 12MB - dist/bundle.js
```

### 6. 重複ファイルの検出

```
「重複ファイルを検出して」

使用ツール:
- mcp__taiyou-mcp__file_duplicates

パラメータ:
- path: "."

出力例:
【重複ファイル検出】
■ グループ1 (3ファイル, 各1.2MB)
  - src/assets/logo.png
  - public/logo.png
  - backup/logo.png

■ グループ2 (2ファイル, 各500KB)
  - src/data/config.json
  - backup/config.json

削除可能な容量: 2.9MB
```

### 7. ファイル比較

```
「2つのファイルを比較して」

使用ツール:
- mcp__taiyou-mcp__file_compare

パラメータ:
- file1: "src/config.ts"
- file2: "backup/config.ts"

出力例:
【ファイル比較】
■ file1: src/config.ts
■ file2: backup/config.ts

■ 結果: 差異あり
  - 追加行: 5
  - 削除行: 2
  - 変更箇所: 3
```

### 8. チェックサム確認

```
「ファイルのチェックサムを計算して」

使用ツール:
- mcp__taiyou-mcp__file_checksum

パラメータ:
- path: "dist/bundle.js"
- algorithm: "sha256"

出力例:
【チェックサム】
■ ファイル: dist/bundle.js
■ SHA256: a1b2c3d4e5f6...
■ サイズ: 1.2MB
```

### 9. パーミッション確認

```
「スクリプトファイルのパーミッションを確認して」

使用ツール:
- mcp__taiyou-mcp__file_permissions

パラメータ:
- path: "scripts/"

出力例:
【パーミッション: scripts/】
■ deploy.sh: rwxr-xr-x (755) ✓実行可能
■ setup.sh: rw-r--r-- (644) ✗実行不可
■ test.sh: rwxr-xr-x (755) ✓実行可能
```

---

## 組み合わせ例

### プロジェクト分析

```
「プロジェクトのファイル構成を分析して」

実行順序:
1. file_tree - 構造確認
2. file_stats - 統計情報
3. file_large - 大きいファイル
4. file_duplicates - 重複検出

出力:
━━━━━━━━━━━━━━━━━━━━
【プロジェクト分析】
━━━━━━━━━━━━━━━━━━━━

■ ファイル構成
  総ファイル数: 234
  総サイズ: 45MB

■ ファイル種別
  .ts/.tsx: 89ファイル
  .json: 12ファイル
  .md: 8ファイル
  その他: 125ファイル

■ 大きいファイル
  - node_modules/: 380MB
  - dist/: 12MB

■ 重複ファイル
  検出: 3グループ
  削減可能: 2.5MB

■ 推奨アクション
  1. node_modulesをキャッシュ化
  2. 重複ファイルの整理
━━━━━━━━━━━━━━━━━━━━
```

### 変更追跡

```
「今日の変更を追跡して」

実行順序:
1. file_recent (24時間以内)
2. file_stats (変更ファイル)

出力:
━━━━━━━━━━━━━━━━━━━━
【今日の変更】
━━━━━━━━━━━━━━━━━━━━

■ 変更ファイル数: 12

■ 時系列
  09:00 - package.json
  10:30 - src/App.tsx
  11:00 - src/components/Header.tsx
  14:00 - README.md

■ 変更量
  追加: +234行
  削除: -56行
━━━━━━━━━━━━━━━━━━━━
```

---

## 注意事項

```
- 大規模ディレクトリの走査は時間がかかります
- 隠しファイル（.で始まる）も含まれます
- シンボリックリンクは別途表示されます
- 読み取り専用（ファイル操作は行いません）
```
