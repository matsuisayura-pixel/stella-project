---
name: udemy-download
description: Download Udemy courses with auth
argument-hint: "<COURSE_URL> [--quality=720|1080] [--captions] [--assets] [--chapter=1-3]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
disable-model-invocation: true
---

# udemy-download - Udemyコースダウンローダー

## 概要

Udemyコースの動画・字幕・アセット・クイズをダウンロードするスキル。
`Puyodead1/udemy-downloader` をラップし、Claude Codeから簡単に使えるようにする。

```
┌───────────────────────────────────────────────────────┐
│              udemy-download スキル                      │
├───────────────────────────────────────────────────────┤
│                                                        │
│   /udemy-download <URL> [options]                      │
│          │                                             │
│          ▼                                             │
│   ┌──────────────┐                                    │
│   │  認証チェック  │ Bearer Token (.env)               │
│   └──────┬───────┘                                    │
│          ▼                                             │
│   ┌──────────────┐                                    │
│   │  コース情報   │ --info でプレビュー可              │
│   └──────┬───────┘                                    │
│          ▼                                             │
│   ┌──────────────┐     ┌─────────────┐               │
│   │  動画DL      │────▶│  字幕DL     │               │
│   │  (aria2c)    │     │  (VTT→SRT)  │               │
│   └──────┬───────┘     └─────────────┘               │
│          ▼                                             │
│   ┌──────────────┐                                    │
│   │  出力ディレクトリ │ ~/Desktop/udemy-courses/      │
│   └──────────────┘                                    │
│                                                        │
│  必須: Python 3.12, ffmpeg, aria2c, yt-dlp            │
│  場所: ~/taisun_agent/udemy-downloader/                │
└───────────────────────────────────────────────────────┘
```

## インストール場所

```
$HOME/taisun_agent/udemy-downloader/
```

- Python venv: `.venv/` (Python 3.12)
- 実行: `.venv/bin/python main.py`

## 初回セットアップ

Bearer Token の取得が必要:

1. ブラウザでUdemyにログイン
2. DevTools (F12) → Network タブ
3. Udemyページで API リクエストを探す
4. `Authorization: Bearer <token>` ヘッダーの値をコピー

```bash
# .env ファイルに設定
cd $HOME/taisun_agent/udemy-downloader
cp .env.sample .env
# UDEMY_BEARER=<your_token> を設定
```

## 使い方

```bash
# コース情報だけ表示（ダウンロードなし）
/udemy-download https://www.udemy.com/course/my-course --info

# 基本ダウンロード（最高画質）
/udemy-download https://www.udemy.com/course/my-course

# 720pで字幕付き
/udemy-download https://www.udemy.com/course/my-course --quality=720 --captions

# 字幕のみ（動画スキップ）、日本語
/udemy-download https://www.udemy.com/course/my-course --captions-only --lang=ja

# 特定チャプターのみ
/udemy-download https://www.udemy.com/course/my-course --chapter=1-3,5

# アセット付きフルダウンロード
/udemy-download https://www.udemy.com/course/my-course --all

# カスタム出力先
/udemy-download https://www.udemy.com/course/my-course --out=~/Downloads/udemy
```

## 実行フロー

このスキルが呼ばれた時のステップ:

### Step 1: 引数パース

ユーザーの引数を解析する:
- 第1引数: コースURL（必須）
- `--info`: コース情報のみ表示
- `--quality=N`: 動画画質 (720, 1080 等)
- `--captions`: 字幕もダウンロード
- `--captions-only`: 字幕のみ（動画スキップ）
- `--lang=XX`: 字幕言語 (ja, en, all 等、デフォルト: en)
- `--assets`: アセットもダウンロード
- `--quizzes`: クイズもダウンロード
- `--all`: 字幕+アセット+クイズすべて
- `--chapter=X`: 特定チャプター (例: "1-3,5,7")
- `--out=PATH`: 出力先ディレクトリ
- `--h265`: H.265エンコード
- `--browser=NAME`: Cookie抽出元ブラウザ
- `--bearer=TOKEN`: Bearer Tokenを直接指定

### Step 2: 認証確認

```bash
# .env ファイルの存在チェック
UDEMY_DIR="$HOME/taisun_agent/udemy-downloader"

if [ ! -f "$UDEMY_DIR/.env" ]; then
  echo "Bearer Tokenが未設定です"
  echo "以下の手順で設定してください:"
  echo "1. ブラウザでUdemyにログイン"
  echo "2. DevTools → Network → APIリクエストのAuthorizationヘッダーをコピー"
  echo "3. $UDEMY_DIR/.env に UDEMY_BEARER=<token> を設定"
  exit 1
fi
```

### Step 3: コマンド構築と実行

引数に基づいてコマンドを構築:

```bash
UDEMY_DIR="$HOME/taisun_agent/udemy-downloader"
PYTHON="$UDEMY_DIR/.venv/bin/python"
OUTPUT_DIR="${OUT:-$HOME/Desktop/udemy-courses}"

CMD="$PYTHON $UDEMY_DIR/main.py -c $COURSE_URL -o $OUTPUT_DIR"

# オプション追加
[ -n "$QUALITY" ] && CMD="$CMD -q $QUALITY"
[ "$CAPTIONS" = true ] && CMD="$CMD --download-captions"
[ "$CAPTIONS_ONLY" = true ] && CMD="$CMD --skip-lectures --download-captions"
[ -n "$LANG" ] && CMD="$CMD -l $LANG"
[ "$ASSETS" = true ] && CMD="$CMD --download-assets"
[ "$QUIZZES" = true ] && CMD="$CMD --download-quizzes"
[ "$INFO" = true ] && CMD="$CMD --info"
[ -n "$CHAPTER" ] && CMD="$CMD --chapter $CHAPTER"
[ "$H265" = true ] && CMD="$CMD --use-h265"
[ -n "$BROWSER" ] && CMD="$CMD --browser $BROWSER"
[ -n "$BEARER" ] && CMD="$CMD -b $BEARER"

# 実行
$CMD
```

### Step 4: 結果報告

ダウンロード完了後:
- 出力ディレクトリの内容を表示
- ダウンロードした動画数・字幕数を集計
- エラーがあれば報告

## 注意事項

- **Bearer Token は定期的に期限切れ**になるため、エラーが出たら再取得が必要
- **DRM保護されたコース**は `keyfile.json` に復号鍵が必要（別途取得）
- **出力先デフォルト**: `~/Desktop/udemy-courses/`
- **長時間コース**はダウンロードに時間がかかるため、`--chapter` で分割推奨
- サブスクリプションコースは `--browser chrome` と `-sc` フラグが必要

## 依存ツール

| ツール | 用途 | インストール済み |
|--------|------|:---:|
| Python 3.12 | 実行環境 | YES |
| ffmpeg | メディア処理 | YES |
| aria2c | 分割ダウンロード | YES |
| yt-dlp | HLSストリーム | YES |
| shaka-packager | DRM復号 | NO (DRMコース用) |

## トラブルシューティング

| エラー | 原因 | 対処 |
|--------|------|------|
| 401 Unauthorized | Token期限切れ | Bearer Token再取得 |
| 403 Forbidden | アクセス制限 | コース購入済みか確認 |
| DRM decryption failed | 鍵なし | keyfile.json に復号鍵を設定 |
| aria2c not found | 未インストール | `brew install aria2` |
