---
name: agentic-vision
description: Image/video analysis with Gemini
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Agentic Vision - 最強の視覚AI分析スキル

Gemini 3 FlashのAgentic Vision機能を活用した、Think-Act-Observeループによる高度な画像・動画分析スキル。市場分析、競合調査、コンテンツ生成の品質評価を自動化。

## トリガー

以下のキーワードで発動:
- 「画像を分析」「画像分析」「ビジュアル分析」
- 「Agentic Vision」「エージェンティックビジョン」
- 「市場トレンド分析」「競合分析」「デザイン分析」
- 「漫画分析」「表紙分析」「動画分析」
- `/agentic-vision` `/vision-analyze`

## コア機能

### 1. Think-Act-Observe ループ

```
┌──────────────────────────────────────────────────────────┐
│  THINK（計画）                                            │
│  ├─ クエリと画像を分析                                    │
│  ├─ 複数ステップの調査計画を立案                          │
│  └─ 必要なツール/操作を特定                               │
├──────────────────────────────────────────────────────────┤
│  ACT（実行）                                              │
│  ├─ Pythonコードを生成・実行                              │
│  ├─ 画像操作: crop, rotate, zoom, annotate               │
│  └─ 分析処理: count, measure, calculate, compare         │
├──────────────────────────────────────────────────────────┤
│  OBSERVE（観察）                                          │
│  ├─ 変換された画像をコンテキストに追加                    │
│  ├─ 中間結果を検証                                        │
│  └─ 最終回答を生成                                        │
└──────────────────────────────────────────────────────────┘
```

### 2. 分析カテゴリ

| カテゴリ | 分析内容 |
|---------|---------|
| **構図分析** | 黄金比、三分割法、視線誘導、レイアウトパターン |
| **色彩分析** | カラーパレット抽出、コントラスト比、色彩心理 |
| **テキスト分析** | OCR、フォント検出、配置パターン、可読性 |
| **要素検出** | オブジェクト、顔、感情、ポーズ、アイコン |
| **品質評価** | 解像度、ノイズ、シャープネス、技術的品質 |
| **比較分析** | A/Bテスト、類似度、差分検出 |

## 使用方法

### 基本的な分析

```python
# スクリプト: ~/.claude/skills/agentic-vision/scripts/analyze.py

from agentic_vision import AgenticVisionAnalyzer

analyzer = AgenticVisionAnalyzer()

# 単一画像分析
result = analyzer.analyze(
    image_path="path/to/image.png",
    analysis_type="comprehensive",  # full, composition, color, text, elements
    output_format="json"
)

# 複数画像比較
comparison = analyzer.compare(
    images=["image1.png", "image2.png", "image3.png"],
    criteria=["layout", "color", "effectiveness"]
)
```

### 市場分析モード

```python
# 競合表紙/デザインの一括分析
market_analysis = analyzer.market_analysis(
    source="amazon_kindle",  # amazon_kindle, instagram, youtube, pinterest
    category="ビジネス書",
    sample_size=100,
    extract=["color_palette", "typography", "layout", "elements"]
)
```

## 分野別ワークフロー

### Kindle表紙分析

```yaml
workflow: kindle_cover_analysis
steps:
  1. 収集:
     - Amazon Kindleランキング上位100冊
     - カテゴリ別フィルタリング
     - 画像ダウンロード

  2. 分析:
     - 色彩パターン抽出（HEX, 面積比）
     - タイトル配置分析（位置, サイズ, フォント）
     - 構図パターン分類
     - 要素検出（人物, アイコン, 帯）

  3. 統計:
     - 勝ちパターンの特定
     - ジャンル別傾向レポート
     - プロンプトテンプレート生成

  4. 品質評価:
     - サムネイル視認性テスト
     - コントラスト比チェック
     - 競合との差別化スコア
```

### 漫画制作分析

```yaml
workflow: manga_analysis
steps:
  1. パネルレイアウト分析:
     - コマ割りパターン検出
     - 視線誘導フロー可視化
     - アクション/静止シーン比率

  2. キャラクター分析:
     - 表情パターンマッピング
     - アングル分布（正面/俯瞰/あおり）
     - デフォルメ比率

  3. スタイル分析:
     - 線の太さ・強弱
     - スクリーントーン使用パターン
     - 効果線・集中線の使用法

  4. テキスト分析:
     - 吹き出し形状・配置
     - オノマトペの視覚効果
     - ナレーションボックス使用法
```

### 動画サムネイル分析

```yaml
workflow: video_thumbnail_analysis
steps:
  1. データ収集:
     - YouTube/TikTok人気動画
     - 再生数・エンゲージメント相関

  2. 要素分析:
     - 顔の有無・表情パターン
     - テキスト量・配置
     - 色彩傾向（彩度, 明度）

  3. 効果測定:
     - CTR推定スコア
     - A/Bテストシミュレーション
     - ジャンル別勝ちパターン
```

## API統合

### Gemini 3 Flash (Agentic Vision)

```python
from google import genai
from google.genai import types

def analyze_with_agentic_vision(image_path, prompt):
    """Gemini 3 FlashのAgentic Visionで画像を分析"""
    client = genai.Client()

    with open(image_path, "rb") as f:
        image_data = f.read()

    image = types.Part.from_bytes(
        data=image_data,
        mime_type="image/png"
    )

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[image, prompt],
        config=types.GenerateContentConfig(
            tools=[types.Tool(code_execution=types.ToolCodeExecution())],
            thinking_config=types.ThinkingConfig(
                thinking_level="HIGH"
            )
        )
    )

    return response
```

### 画像収集 (Apify)

```python
from apify_client import ApifyClient

def collect_images(source, query, count=100):
    """Apifyで画像を収集"""
    client = ApifyClient(os.environ["APIFY_API_TOKEN"])

    actors = {
        "google_images": "hooli/google-images-scraper",
        "instagram": "apify/instagram-scraper",
        "amazon": "junglee/amazon-product-scraper"
    }

    run = client.actor(actors[source]).call(
        run_input={
            "queries": [query],
            "maxResults": count
        }
    )

    return list(client.dataset(run["defaultDatasetId"]).iterate_items())
```

## 出力フォーマット

### 分析レポート (JSON)

```json
{
  "analysis_id": "av_20260204_001",
  "image": "cover_sample.png",
  "timestamp": "2026-02-04T18:00:00Z",
  "results": {
    "composition": {
      "layout_type": "centered",
      "golden_ratio_score": 0.85,
      "visual_flow": ["top-center", "middle", "bottom"]
    },
    "color": {
      "dominant": ["#1a365d", "#ffffff", "#f6ad55"],
      "palette_type": "complementary",
      "contrast_ratio": 7.2
    },
    "text": {
      "title_position": "top-center",
      "title_size_ratio": 0.15,
      "font_style": "bold_sans",
      "readability_score": 0.92
    },
    "elements": {
      "has_human": false,
      "has_icon": true,
      "has_badge": true
    },
    "quality": {
      "resolution_adequate": true,
      "thumbnail_visibility": 0.88,
      "differentiation_score": 0.75
    }
  },
  "recommendations": [
    "コントラストを上げてタイトルの視認性を向上",
    "競合との差別化のため暖色系アクセントを追加"
  ],
  "generated_prompt": "business book cover, minimalist design, navy blue gradient..."
}
```

## プロンプトテンプレート

### 基本分析プロンプト

```
この画像を詳細に分析してください：

1. 構図分析
   - レイアウトパターン（グリッド/対称/非対称）
   - 視線誘導の流れ
   - 余白の使い方

2. 色彩分析
   - 主要色（HEX値で上位3色）
   - 色彩の心理的効果
   - コントラスト比

3. テキスト分析
   - 文字の配置と階層
   - フォントスタイル推定
   - 可読性スコア（1-10）

4. 要素検出
   - 主要オブジェクト
   - 人物/顔の有無
   - アイコン/シンボル

5. 総合評価
   - 強み3点
   - 改善点3点
   - 類似デザイン推奨使用シーン

JSON形式で出力してください。
```

### コード実行プロンプト

```
この画像に対してPythonコードを使って以下の分析を実行してください：

1. 画像の特定領域（右下の小さなテキスト）をクロップして拡大
2. 色のヒストグラムを生成
3. エッジ検出で構図の骨格を可視化
4. バウンディングボックスで主要要素をマーク

各ステップの結果を画像として出力し、分析結果を説明してください。
```

## 環境設定

### 必要な環境変数

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export APIFY_API_TOKEN="your-apify-token"
export OPENROUTER_API_KEY="your-openrouter-key"  # MCP用
```

### 依存パッケージ

```bash
pip install google-genai pillow opencv-python numpy pandas matplotlib
pip install apify-client requests
```

## 連携スキル

| スキル | 用途 |
|--------|------|
| `nanobanana-pro` | 分析結果に基づく画像生成 |
| `anime-slide-generator` | 分析結果からスライド生成 |
| `research` | 市場調査の深掘り |
| `taiyo-analyzer` | コンテンツ品質のスコアリング |

## パフォーマンス

- **精度向上**: Agentic Vision有効化で5-10%向上
- **処理時間**: 1画像あたり5-30秒（複雑さ依存）
- **コスト**: 標準トークン料金のみ（追加費用なし）

## 制限事項

- コード実行の最大時間: 30秒
- カスタムライブラリのインストール不可
- 対応ファイル: PNG, JPEG, CSV, TXT等

## 参考リソース

- [Gemini API Code Execution](https://ai.google.dev/gemini-api/docs/code-execution)
- [Agentic Vision Blog](https://blog.google/innovation-and-ai/technology/developers-tools/agentic-vision-gemini-3-flash/)
- [MCP Vision Servers](https://mcpmarket.com/)
- [SkillsMP Vision Skill](https://skillsmp.com/)
- [Apify Image Scrapers](https://apify.com/store)
