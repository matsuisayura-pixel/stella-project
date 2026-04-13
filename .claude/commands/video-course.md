---
name: video-course
description: 動画コース一括作成パイプライン（リサーチ→カリキュラム→スクリプト→サムネイル）
---

# Video Course Pipeline

動画コース/教材を一括で作成する統合パイプライン。

## 使用方法

```
/video-course <トピック> [レッスン数]
```

例:
```
/video-course "Claude Code入門" 5
/video-course "マーケティング基礎"
```

## パイプライン構成

### Phase 1: 市場リサーチ
- 競合コース分析、需要調査
- ターゲット視聴者の特定
- スキル: `/research-free` または `/gpt-researcher`（深層）

### Phase 2: カリキュラム設計（SDD-REQ100）
- 100点スコアリング付きコース仕様書
- 学習目標、レッスン構成、前提知識を明確化
- スキル: `/sdd-req100`

### Phase 3: 動画スクリプト生成
- 各レッスンの台本を自動生成
- 視聴者維持を考慮した構成
- スキル: `/video-agent`

### Phase 4: 音声合成（オプション）
- 日本語ナレーション音声を生成
- スキル: `/japanese-tts-reading` または `/gpt-sovits-tts`

### Phase 5: サムネイル生成
- 各レッスンのサムネイル画像
- チャンネルアート、OGP画像
- スキル: `/nanobanana-pro`, `/youtube-thumbnail`

### Phase 6: SEO最適化
- タイトル、説明文、タグの最適化
- 6つの教育要素でエンゲージメント向上
- スキル: `/education-framework`

## 出力構造

```
course-package/
├── 00-research/
│   └── market-research.md       # 市場リサーチ結果
├── 01-curriculum/
│   └── curriculum.md            # カリキュラム仕様書
├── lessons/
│   ├── lesson-01/
│   │   ├── script.md            # 台本
│   │   ├── voiceover.mp3        # ナレーション（オプション）
│   │   ├── thumbnail.png        # サムネイル
│   │   └── metadata.json        # タイトル、説明、タグ
│   ├── lesson-02/
│   │   └── ...
│   └── lesson-N/
├── assets/
│   ├── channel-art.png          # チャンネルアート
│   └── course-thumbnail.png     # コースサムネイル
└── seo/
    └── seo-optimization.md      # SEO最適化レポート
```

## 実行手順

1. トピックとレッスン数を指定して実行
2. Phase 1-2で仕様を確定（確認あり）
3. Phase 3-6で成果物を生成
4. `course-package/` に全成果物が出力

## オプション

- `--deep-research`: GPT Researcherで深層リサーチ（APIコスト発生）
- `--with-voice`: 音声ナレーションを生成
- `--lessons <N>`: レッスン数を指定（デフォルト: 5）
- `--output <dir>`: 出力ディレクトリを指定

## 関連スキル

- `/research-free` - 無料リサーチ
- `/sdd-req100` - 要件定義
- `/video-agent` - 動画パイプライン
- `/youtube_channel_summary` - YouTube分析
- `/nanobanana-pro` - 画像生成
- `/youtube-thumbnail` - サムネイル
- `/education-framework` - 教育フレームワーク

## コスト

- 基本: **無料**
- 深層リサーチ追加: $0.50-2.00（オプション）
- 音声合成: **無料**（ローカルTTS）
