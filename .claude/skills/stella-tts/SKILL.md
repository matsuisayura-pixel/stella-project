---
name: stella-tts
description: stella/content/output/ 配下の voice.md を読み込み、stand.fm用のMP3音声ファイルを生成する。OpenAI TTS API を使用。[感情:]タグ・(間)等の制御文字を自動除去してから変換する。
allowed-tools: Read, Write, Bash, Glob
---

# stella-tts スキル

`voice.md` を stand.fm アップロード用の MP3 に変換する。

## 実行手順

### STEP 1: 対象ファイルの特定

引数でパスが指定された場合はそのファイルを使用する。
指定がない場合は最新の voice.md を自動検索する:

```bash
# 最新のvoice.mdを取得
ls -dt stella/content/output/*/voice.md | head -1
```

### STEP 2: 環境確認

```bash
# OpenAI APIキーの確認
echo $OPENAI_API_KEY | head -c 10

# Pythonとpipの確認
python --version
pip show openai
```

OPENAI_API_KEY が未設定の場合:
「OPENAI_API_KEY が設定されていません。以下のコマンドで設定してください:
$env:OPENAI_API_KEY = "sk-..."（PowerShell）
または .env ファイルに OPENAI_API_KEY=sk-... を追記してください。」
と伝えて停止する。

### STEP 3: スクリプト実行

```bash
pip install openai -q
python scripts/stella_tts.py --input [voice.mdのパス]
```

### STEP 4: 完了報告

生成されたMP3ファイルのパスと再生時間の目安を報告する。

```
✓ 音声ファイル生成完了
  入力: stella/content/output/[dir]/voice.md
  出力: stella/content/output/[dir]/voice.mp3
  文字数: [X]字 → 約[Y]分の音声
  
stand.fm へのアップロード手順:
1. stand.fm にログイン
2. 「収録する」→「音声をアップロード」
3. voice.mp3 を選択
4. spotify-meta.md のタイトル・説明文を貼り付けて公開
```

---

## 使用例

```bash
# 最新記事を自動変換
/stella-tts

# 特定記事を指定して変換
/stella-tts stella/content/output/20260501-090000__kotodama-no-chikara/voice.md

# 全記事を一括変換（未変換のみ）
/stella-tts --all
```

---

## 関連スキル

- `stella-generate` - voice.md の生成元スキル
