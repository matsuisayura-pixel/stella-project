---
name: anime-slide-generator
description: Anime-style slide generator
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
disable-model-invocation: true
---

# Anime Slide Generator

アニメ風イラスト付きの日本語スライドを自動生成するスキル。NanoBanana Pro で背景画像を生成し、Pillow で日本語テキストをオーバーレイする。

## 対応OS

| OS | 対応状況 | 使用フォント |
|----|----------|-------------|
| **macOS** | ✅ 完全対応 | ヒラギノ角ゴシック |
| **Windows** | ✅ 完全対応 | 游ゴシック / メイリオ |
| **Linux** | ✅ 完全対応 | Noto Sans CJK |

> **フォント自動検出**: OSに応じて最適な日本語フォントを自動選択します。
> フォントが見つからない場合は、Noto Sans CJK JP を自動ダウンロードします。

## トリガー

以下のキーワードで発動:
- 「スライドを生成」「スライド作成」
- 「プレゼン資料を作成」
- 「アニメ風スライド」
- 「/slides」「/anime-slides」

## ワークフロー

### Phase 1: 設定ファイル作成

ユーザーの要件に基づいて、スライド設定ファイルを作成:

```python
SLIDES_CONFIG = [
    {
        "num": 1,                    # スライド番号
        "name": "p01_cover",         # ファイル名（拡張子なし）
        "bg_prompt": "anime style illustration, [シーン説明], no text, high quality",
        "title_texts": [
            {
                "text": "タイトル文字",
                "position": "top-center",  # or (x, y) tuple
                "font_size": 56,
                "color": (255, 255, 255, 255),      # RGBA
                "outline_color": (0, 80, 120, 255), # RGBA
                "outline_width": 5
            }
        ],
        "telop": "下部テロップエリアに表示する説明文"
    },
    # ... 続くスライド
]
```

### Phase 2: バッチ生成

1枚ずつ丁寧に生成:

```bash
python3 ~/.claude/skills/anime-slide-generator/scripts/generate_slides.py \
    --config <config_file.py> \
    --output <output_dir> \
    --batch <batch_name>
```

### Phase 3: 品質チェック（5枚ごと）

生成後、Read ツールでスライドを確認:
- 日本語テキストが正しく表示されているか
- テロップが見切れていないか
- 背景画像の品質

### Phase 4: PDF出力

```bash
python3 ~/.claude/skills/anime-slide-generator/scripts/create_pdf.py \
    --input <slides_dir> \
    --output <output.pdf>
```

## 技術仕様

### 背景画像生成

NanoBanana Pro（Gemini）を使用:
- プロンプトに必ず `no text, high quality` を含める
- アニメスタイルを指定: `anime style illustration`
- 生成サイズ: 約1024x559px

### テキストオーバーレイ

Pillow + Hiragino フォントを使用:
- タイトル: Hiragino Sans W8（太字）
- テロップ: Hiragino Sans W6
- アウトライン: 5-6px 幅
- テロップエリア: 画像下部20%

### フォント設定（自動検出）

```python
# OS自動検出 → 最適なフォントを選択
# macOS: ヒラギノ角ゴシック
# Windows: 游ゴシック / メイリオ
# Linux: Noto Sans CJK

# フォントが見つからない場合は自動ダウンロード
# → Noto Sans CJK JP（Google Fonts）
```

### テロップエリア仕様

- 背景色: RGBA(20, 25, 40, 240) - 半透明ダークブルー
- 高さ: 元画像の20%分を追加
- テキスト配置: 中央揃え
- 自動フォントサイズ調整: 幅-60pxに収まるよう

## 出力形式

### スライド画像

- フォーマット: PNG (RGBA)
- 背景ファイル: `{name}_bg.png`
- 完成ファイル: `{name}.png`

### PDF

- フォーマット: A4横（297mm x 210mm）
- 画像: アスペクト比維持、中央配置

## 使用例

### 基本的な使用

```
ユーザー: TAISUN Agentの説明スライドを10枚作成して
```

### 詳細指定

```
ユーザー: 以下の内容でスライドを生成して
1. 表紙
2. 目次
3. MCPとは
4. エージェントの役割
5. インストール手順（Mac）
6. まとめ
```

## 依存関係

- `nanobanana-pro` スキル（背景画像生成）
- `Pillow` (PIL)
- `fpdf2`

## ファイル構成

```
~/.claude/skills/anime-slide-generator/
├── SKILL.md
└── scripts/
    ├── japanese_slide_generator.py  # テキストオーバーレイ
    ├── generate_slides.py           # バッチ生成
    └── create_pdf.py                # PDF出力
```

## 注意事項

1. **日本語テキストは AI で生成しない**: 背景画像にはテキストを含めず、Pillow でオーバーレイ
2. **5枚ごとに品質チェック**: 問題があれば即座に再生成
3. **フォントパス**: macOS 以外では適宜変更が必要
4. **生成時間**: 1枚あたり約15-30秒（NanoBanana Pro 依存）
