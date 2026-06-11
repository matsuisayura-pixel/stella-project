#!/usr/bin/env python3
"""
generate_eyecatch.py
content.json からアイキャッチ画像（1280×670）を生成する。
Pillow 使用。フォントが見つからない場合はデフォルトフォントで続行。
"""

import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# フォント候補（Linux / GitHub Actions 環境）
FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
FONT_SMALL_CANDIDATES = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def _load_font(candidates: list, size: int) -> ImageFont.FreeTypeFont:
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list:
    """テキストを max_width に収まるよう折り返す"""
    words = list(text)  # 日本語は文字単位で分割
    lines = []
    current = ""
    for ch in words:
        test = current + ch
        bbox = font.getbbox(test)
        if bbox[2] - bbox[0] > max_width and current:
            lines.append(current)
            current = ch
        else:
            current = test
    if current:
        lines.append(current)
    return lines


def generate_eyecatch(output_dir: Path) -> Path:
    content_path = output_dir / "content.json"
    content = json.loads(content_path.read_text(encoding="utf-8"))

    title = content.get("title", "")
    catch_copy = content.get("catch_copy", "")
    tags = content.get("tags", [])
    tag_str = "  ".join(f"#{t}" for t in tags[:5])

    W, H = 1280, 670

    # ---- 背景グラデーション（深夜ブルー → 紫紺） ----
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    for y in range(H):
        ratio = y / H
        r = int(8  + ratio * 18)
        g = int(6  + ratio * 12)
        b = int(55 + ratio * 55)
        draw.rectangle([(0, y), (W, y + 1)], fill=(r, g, b))

    # ---- 星の装飾（ランダム的に固定位置で） ----
    star_positions = [
        (120, 80), (300, 40), (600, 100), (900, 60), (1150, 90),
        (80, 200), (450, 160), (820, 180), (1200, 150),
        (50, 500), (250, 580), (700, 540), (1050, 600), (1220, 490),
    ]
    for sx, sy in star_positions:
        radius = 2
        draw.ellipse([(sx - radius, sy - radius), (sx + radius, sy + radius)],
                     fill=(220, 210, 255))

    # ---- フォント読み込み ----
    font_title = _load_font(FONT_CANDIDATES, 68)
    font_catch = _load_font(FONT_SMALL_CANDIDATES, 38)
    font_brand = _load_font(FONT_SMALL_CANDIDATES, 30)
    font_tag   = _load_font(FONT_SMALL_CANDIDATES, 24)

    # ---- タイトル（折り返し・中央） ----
    title_lines = _wrap_text(title, font_title, W - 160)
    total_title_h = sum(
        font_title.getbbox(ln)[3] - font_title.getbbox(ln)[1] + 12
        for ln in title_lines
    )
    y_title = H // 2 - total_title_h // 2 - 30
    for ln in title_lines:
        bbox = font_title.getbbox(ln)
        lw = bbox[2] - bbox[0]
        lh = bbox[3] - bbox[1]
        draw.text(((W - lw) // 2, y_title), ln, fill=(255, 255, 255), font=font_title)
        y_title += lh + 12

    # ---- キャッチコピー ----
    if catch_copy and catch_copy != title:
        bbox = font_catch.getbbox(catch_copy)
        cw = bbox[2] - bbox[0]
        draw.text(((W - cw) // 2, y_title + 10), catch_copy,
                  fill=(190, 170, 255), font=font_catch)
        y_after = y_title + 10 + (bbox[3] - bbox[1]) + 16
    else:
        y_after = y_title + 16

    # ---- ブランド名 ----
    brand = "✦  Stella  ✦"
    bbox = font_brand.getbbox(brand)
    bw = bbox[2] - bbox[0]
    draw.text(((W - bw) // 2, y_after), brand, fill=(160, 140, 230), font=font_brand)

    # ---- ハッシュタグ（下部） ----
    if tag_str:
        bbox = font_tag.getbbox(tag_str)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) // 2, H - 60), tag_str, fill=(130, 115, 200), font=font_tag)

    # ---- 枠線 ----
    draw.rectangle([(20, 20), (W - 20, H - 20)], outline=(80, 70, 150), width=2)

    # ---- 保存 ----
    out_path = output_dir / "images" / "eyecatch.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG")
    print(f"  ✓ アイキャッチ生成: {out_path}  ({W}×{H})")
    return out_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 generate_eyecatch.py <output_dir>")
        sys.exit(1)

    output_dir = Path(sys.argv[1])
    if not output_dir.exists():
        print(f"[ERROR] ディレクトリが存在しません: {output_dir}")
        sys.exit(1)

    generate_eyecatch(output_dir)


if __name__ == "__main__":
    main()
