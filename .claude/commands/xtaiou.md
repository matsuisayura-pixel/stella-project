---
description: X記事自動投稿パイプライン (Ollama版) - リサーチから投稿まで全自動実行
---

# xtaiou - X記事投稿パイプライン (Ollama Local LLM)

Ollama ローカルLLMを使ったX記事自動投稿パイプラインを実行します。
コスト0円で記事生成・ツイート投稿を完全自動化。

## システム構成

```
Stage 1: トレンドリサーチ (Twitter検索 + リサーチネタ元.md)
    ↓
Stage 2: 記事生成 (Ollama qwen2.5:72b) + ツイート文生成 (Ollama qwen3:8b)
    ↓
Stage 3+4: カバー画像取得 & 挿入 (Pexels API)
    ↓
Stage 5: X投稿 (Cookie認証 or OAuth 2.0)
```

## 使用モデル (固定)

| 用途 | モデル | サイズ | API |
|------|--------|--------|-----|
| 記事生成 | `qwen2.5:72b` | 47GB | `http://localhost:11434/v1` |
| ツイート生成 | `qwen3:8b` | 5.2GB | `http://localhost:11434/v1` |

## 前提条件

1. **Ollama起動中**: `ollama serve` が実行されていること
2. **モデルダウンロード済み**:
   - `ollama pull qwen2.5:72b`
   - `ollama pull qwen3:8b`
3. **環境変数** (`.env`):
   - `PEXELS_API_KEY` - 画像取得用 (Stage 3)
   - `TWITTER_COOKIES` - シングルアカウント投稿用 (Stage 5)

## 実行手順

### 1. Ollamaの起動確認

```bash
curl -s http://localhost:11434/v1/models | head -5
```

起動していない場合:
```bash
ollama serve &
```

### 2. パイプライン実行

#### ドライラン (APIもX投稿もなし - テスト用)
```bash
npm run pipeline:dry
```

#### 本番実行 (全ステージ)
```bash
npm run pipeline
```

#### ステージ指定実行
```bash
# Stage 1のみ: リサーチ
npm run pipeline:stage -- --stage 1

# Stage 2のみ: 記事生成 (ドライラン)
npm run pipeline:stage -- --stage 2 --dry-run

# Stage 2のみ: 記事生成 (本番 - Ollama使用)
npm run pipeline:stage -- --stage 2
```

#### マルチアカウント投稿
```bash
npm run pipeline -- --account 3
```

### 3. 結果確認

- 生成記事: `data/articles/YYYYMMDD_タイトル.md`
- 実行ログ: `data/runs/YYYYMMDD-HHMMSS/`
  - `stage1_result.json` - リサーチ結果
  - `stage2_result.json` - 記事生成結果
  - `stage3_result.json` - 画像挿入結果
  - `stage5_result.json` - 投稿結果
  - `stage0_result.json` - サマリー

## 記事生成の仕組み

### テンプレート選択 (8パターン自動マッチ)

| トピックキーワード | テンプレート |
|-------------------|-------------|
| AI, 自動 | AIマーケティング |
| データ, 数字 | データ分析 |
| ゼロ, 凡人 | ゼロヒーロー |
| 秘密, 暴露 | 秘密暴露 |
| 常識, 破壊 | 常識破壊 |
| ステップ, 方法 | ステップ |
| 問題, 課題 | 問題解決 |
| パラドックス, 矛盾 | パラドックス |

### 記事の要件

- **文字数**: 5,000〜8,000文字以上
- **構成**: 7〜8セクション (導入→5章→結論)
- **文体**: トミー (@ceo_tommy1) スタイル完全再現
- **ペルソナ**: 海外ビジネス事例を日本語で解説するインフルエンサー
- **参考記事**: `トミーX記事/*.md` から最新3件を自動読み込み
- **テンプレート**: `トミーX記事切り口テンプレ/*.md` から自動選択

### ツイート文

- **280文字以内**
- **具体的な数字を含む**
- **好奇心を刺激する表現**
- ハッシュタグなし

## 環境変数一覧

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `ANTHROPIC_BASE_URL` | `http://localhost:11434/v1` | Ollama API URL |
| `ANTHROPIC_API_KEY` | `ollama` | APIキー (Ollamaは不要) |
| `ARTICLE_MODEL` | `qwen2.5:72b` | 記事生成モデル |
| `TWEET_MODEL` | `qwen3:8b` | ツイート生成モデル |
| `PEXELS_API_KEY` | (必須) | 画像API |
| `TWITTER_COOKIES` | (投稿時必須) | Cookie認証 |
| `ENCRYPTION_KEY` | (OAuth時必須) | トークン暗号化キー |

## コスト

**完全無料** (ローカルLLM + 無料API)
- Ollama: ローカル実行のため0円
- Pexels API: 無料枠
- X投稿: 無料

## トラブルシューティング

### Ollamaが応答しない
```bash
# プロセス確認
ps aux | grep ollama

# 再起動
killall ollama && ollama serve &
```

### モデルが見つからない
```bash
ollama list
ollama pull qwen2.5:72b
ollama pull qwen3:8b
```

### 記事が短い (500文字未満エラー)
- qwen2.5:72bのVRAM不足の可能性
- `ARTICLE_MODEL=qwen2.5:32b` にフォールバック可能

### メモリ不足
- qwen2.5:72b は約47GBのディスク/RAMが必要
- 不足時は `ARTICLE_MODEL=qwen2.5:32b` (19GB) を使用
