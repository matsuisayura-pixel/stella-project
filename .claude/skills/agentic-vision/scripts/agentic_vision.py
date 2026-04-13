#!/usr/bin/env python3
"""
Agentic Vision - 最強の視覚AI分析モジュール
Gemini 3 FlashのAgentic Vision機能を活用
"""

import os
import json
import base64
from pathlib import Path
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum

# Google GenAI SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("Warning: google-genai not installed. Run: pip install google-genai")

# Image processing
try:
    from PIL import Image
    import io
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class AnalysisType(Enum):
    """分析タイプ"""
    COMPREHENSIVE = "comprehensive"  # 総合分析
    COMPOSITION = "composition"      # 構図分析
    COLOR = "color"                  # 色彩分析
    TEXT = "text"                    # テキスト分析
    ELEMENTS = "elements"            # 要素検出
    QUALITY = "quality"              # 品質評価
    MARKET = "market"                # 市場分析


class ContentType(Enum):
    """コンテンツタイプ"""
    KINDLE_COVER = "kindle_cover"
    MANGA_PAGE = "manga_page"
    VIDEO_THUMBNAIL = "video_thumbnail"
    BANNER_AD = "banner_ad"
    SNS_POST = "sns_post"
    LP_HERO = "lp_hero"
    INFOGRAPHIC = "infographic"
    LOGO = "logo"


@dataclass
class AnalysisResult:
    """分析結果"""
    analysis_id: str
    image_path: str
    analysis_type: str
    results: Dict[str, Any]
    recommendations: List[str]
    generated_prompt: Optional[str] = None
    code_executed: Optional[str] = None
    intermediate_images: Optional[List[str]] = None


class AgenticVisionAnalyzer:
    """Agentic Vision分析クラス"""

    def __init__(self, api_key: Optional[str] = None):
        """初期化"""
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")

        if GENAI_AVAILABLE and self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

        self.model = "gemini-3-flash-preview"

    def _load_image(self, image_path: str) -> bytes:
        """画像を読み込み"""
        with open(image_path, "rb") as f:
            return f.read()

    def _get_mime_type(self, image_path: str) -> str:
        """MIMEタイプを取得"""
        ext = Path(image_path).suffix.lower()
        mime_types = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp"
        }
        return mime_types.get(ext, "image/png")

    def _build_analysis_prompt(
        self,
        analysis_type: AnalysisType,
        content_type: Optional[ContentType] = None,
        custom_criteria: Optional[List[str]] = None
    ) -> str:
        """分析プロンプトを構築"""

        base_prompts = {
            AnalysisType.COMPREHENSIVE: """
この画像を包括的に分析してください：

1. 構図分析
   - レイアウトパターン（グリッド/対称/非対称/自由形式）
   - 視線誘導の流れ（矢印で図示）
   - 余白の使い方と比率
   - 黄金比・三分割法の適用度

2. 色彩分析
   - 主要色パレット（HEX値で上位5色と面積比%）
   - 配色タイプ（補色/類似色/トライアド等）
   - コントラスト比（WCAG基準）
   - 色彩の心理的効果

3. テキスト分析（存在する場合）
   - 文字の配置と視覚的階層
   - フォントスタイル推定
   - サイズ比率（画像高さに対する%）
   - 可読性スコア（1-10）

4. 要素検出
   - 主要オブジェクトのリスト
   - 人物/顔の有無と表情
   - アイコン/シンボルの種類
   - ブランド要素の特定

5. 技術的品質
   - 解像度の適切さ
   - シャープネス/ノイズレベル
   - 圧縮アーティファクト有無

6. 総合評価
   - 強み（3点）
   - 改善点（3点）
   - 推奨使用シーン
   - 類似デザインの生成プロンプト

JSON形式で詳細に出力してください。
""",
            AnalysisType.COMPOSITION: """
この画像の構図を詳細に分析してください：

1. レイアウト構造
   - グリッドシステムの検出
   - 主要な線と形
   - 対称性の分析

2. 視覚的フロー
   - 視線の入口点
   - 視線の移動経路
   - フォーカルポイント

3. バランス
   - 視覚的重心
   - 要素の分布
   - ネガティブスペース

4. 幾何学的分析
   - 黄金比の適用（コードで計測）
   - 三分割法との一致度
   - 対角線構図

バウンディングボックスと補助線を画像に描画して可視化してください。
""",
            AnalysisType.COLOR: """
この画像の色彩を詳細に分析してください：

Pythonコードを使って以下を実行：
1. 色のヒストグラムを生成
2. K-meansで主要色を5色抽出
3. 各色のHEX値と面積比を計算
4. コントラスト比を測定

分析項目：
- ドミナントカラー
- アクセントカラー
- 配色の調和度
- 明度/彩度の分布
- 色温度（暖色/寒色比）

カラーパレットを可視化した画像も生成してください。
""",
            AnalysisType.TEXT: """
この画像のテキスト要素を分析してください：

1. OCR（光学文字認識）
   - 検出されたすべてのテキスト
   - 各テキストの位置（座標）
   - 信頼度スコア

2. タイポグラフィ分析
   - フォントスタイル推定
   - フォントサイズ（相対比）
   - 太さ/ウェイト
   - 装飾（シャドウ/アウトライン等）

3. レイアウト
   - テキスト階層（見出し/本文等）
   - 配置パターン
   - 行間/文字間

4. 可読性評価
   - 背景とのコントラスト
   - サムネイルサイズでの視認性
   - 改善提案

各テキスト要素にバウンディングボックスを描画してください。
""",
            AnalysisType.ELEMENTS: """
この画像内の要素を検出・分類してください：

1. オブジェクト検出
   - 検出された全オブジェクト
   - 各オブジェクトの位置とサイズ
   - 信頼度スコア

2. 人物検出（存在する場合）
   - 人数
   - ポーズ推定
   - 表情分析
   - 視線方向

3. シンボル/アイコン
   - 種類と意味
   - ブランドロゴ検出

4. 背景分析
   - 背景タイプ（写真/イラスト/グラデーション/単色）
   - 背景と前景の分離度

各要素にラベル付きバウンディングボックスを描画してください。
""",
            AnalysisType.QUALITY: """
この画像の技術的品質を評価してください：

1. 解像度分析
   - 画像サイズ（px）
   - 推奨用途に対する適切さ
   - アップスケール必要性

2. シャープネス
   - エッジの鮮明さ
   - ボケ/ブラー検出
   - フォーカスエリア

3. ノイズ分析
   - ノイズレベル推定
   - 圧縮アーティファクト
   - バンディング有無

4. 色品質
   - 色域の使用範囲
   - 白飛び/黒つぶれ
   - 色かぶり検出

5. 総合スコア（100点満点）
   - 各項目の点数内訳
   - 改善のための具体的な推奨事項
"""
        }

        prompt = base_prompts.get(analysis_type, base_prompts[AnalysisType.COMPREHENSIVE])

        # コンテンツタイプ別の追加指示
        if content_type:
            content_additions = {
                ContentType.KINDLE_COVER: """
追加分析（Kindle表紙向け）：
- Amazonサムネイルサイズ（160x256px）での視認性
- タイトルの読みやすさ
- カテゴリ内での差別化ポイント
- 「売れる」要素の有無
""",
                ContentType.MANGA_PAGE: """
追加分析（漫画ページ向け）：
- コマ割りパターンと効果
- 読み順の自然さ
- 効果線/集中線の使用
- 吹き出し配置の適切さ
""",
                ContentType.VIDEO_THUMBNAIL: """
追加分析（動画サムネイル向け）：
- クリック率向上要素
- 感情喚起効果
- テキストオーバーレイの効果
- 競合との差別化
"""
            }
            prompt += content_additions.get(content_type, "")

        # カスタム基準
        if custom_criteria:
            prompt += "\n追加分析項目：\n"
            for criterion in custom_criteria:
                prompt += f"- {criterion}\n"

        return prompt

    def analyze(
        self,
        image_path: str,
        analysis_type: Union[AnalysisType, str] = AnalysisType.COMPREHENSIVE,
        content_type: Optional[Union[ContentType, str]] = None,
        custom_criteria: Optional[List[str]] = None,
        use_code_execution: bool = True,
        thinking_level: str = "HIGH"
    ) -> AnalysisResult:
        """画像を分析"""

        if not self.client:
            raise RuntimeError("Gemini API client not initialized. Set GEMINI_API_KEY.")

        # Enum変換
        if isinstance(analysis_type, str):
            analysis_type = AnalysisType(analysis_type)
        if isinstance(content_type, str):
            content_type = ContentType(content_type)

        # 画像読み込み
        image_data = self._load_image(image_path)
        mime_type = self._get_mime_type(image_path)

        image_part = types.Part.from_bytes(
            data=image_data,
            mime_type=mime_type
        )

        # プロンプト構築
        prompt = self._build_analysis_prompt(analysis_type, content_type, custom_criteria)

        # 設定
        config_kwargs = {}

        if use_code_execution:
            config_kwargs["tools"] = [
                types.Tool(code_execution=types.ToolCodeExecution())
            ]
            config_kwargs["thinking_config"] = types.ThinkingConfig(
                thinking_level=thinking_level
            )

        config = types.GenerateContentConfig(**config_kwargs)

        # API呼び出し
        response = self.client.models.generate_content(
            model=self.model,
            contents=[image_part, prompt],
            config=config
        )

        # 結果パース
        result_text = response.text if hasattr(response, 'text') else str(response)

        # JSONを抽出
        try:
            import re
            json_match = re.search(r'\{[\s\S]*\}', result_text)
            if json_match:
                results = json.loads(json_match.group())
            else:
                results = {"raw_response": result_text}
        except json.JSONDecodeError:
            results = {"raw_response": result_text}

        # 分析結果を構築
        import uuid
        analysis_result = AnalysisResult(
            analysis_id=f"av_{uuid.uuid4().hex[:12]}",
            image_path=image_path,
            analysis_type=analysis_type.value,
            results=results,
            recommendations=results.get("recommendations", []),
            generated_prompt=results.get("generated_prompt"),
        )

        return analysis_result

    def compare(
        self,
        images: List[str],
        criteria: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """複数画像を比較分析"""

        if not self.client:
            raise RuntimeError("Gemini API client not initialized.")

        # 画像を読み込み
        image_parts = []
        for img_path in images:
            image_data = self._load_image(img_path)
            mime_type = self._get_mime_type(img_path)
            image_parts.append(
                types.Part.from_bytes(data=image_data, mime_type=mime_type)
            )

        criteria_text = "\n".join(f"- {c}" for c in (criteria or ["全体的な品質", "構図", "色彩"]))

        prompt = f"""
以下の{len(images)}枚の画像を比較分析してください。

比較基準：
{criteria_text}

各画像について：
1. 基準ごとのスコア（1-10）
2. 強みと弱み
3. 最も効果的な画像とその理由
4. 改善のための具体的な提案

JSON形式で出力してください。
"""

        config = types.GenerateContentConfig(
            tools=[types.Tool(code_execution=types.ToolCodeExecution())],
            thinking_config=types.ThinkingConfig(thinking_level="HIGH")
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=[*image_parts, prompt],
            config=config
        )

        return {"comparison_result": response.text if hasattr(response, 'text') else str(response)}

    def market_analysis(
        self,
        images_dir: str,
        content_type: ContentType,
        output_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """市場分析（複数画像のバッチ処理）"""

        image_files = list(Path(images_dir).glob("*.png")) + \
                      list(Path(images_dir).glob("*.jpg")) + \
                      list(Path(images_dir).glob("*.jpeg"))

        results = []
        for img_path in image_files[:100]:  # 最大100枚
            try:
                result = self.analyze(
                    str(img_path),
                    AnalysisType.COMPREHENSIVE,
                    content_type
                )
                results.append(asdict(result))
            except Exception as e:
                print(f"Error analyzing {img_path}: {e}")

        # 統計分析
        summary = {
            "total_analyzed": len(results),
            "content_type": content_type.value,
            "results": results,
            "patterns": self._extract_patterns(results)
        }

        if output_path:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)

        return summary

    def _extract_patterns(self, results: List[Dict]) -> Dict[str, Any]:
        """分析結果からパターンを抽出"""
        # 簡易的なパターン抽出（実際にはより複雑な統計処理が必要）
        return {
            "common_colors": [],
            "popular_layouts": [],
            "typography_trends": [],
            "note": "Detailed pattern extraction requires statistical analysis"
        }


# CLI用
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python agentic_vision.py <image_path> [analysis_type]")
        print("Analysis types: comprehensive, composition, color, text, elements, quality")
        sys.exit(1)

    image_path = sys.argv[1]
    analysis_type = sys.argv[2] if len(sys.argv) > 2 else "comprehensive"

    analyzer = AgenticVisionAnalyzer()
    result = analyzer.analyze(image_path, analysis_type)

    print(json.dumps(asdict(result), ensure_ascii=False, indent=2))
