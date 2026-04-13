#!/usr/bin/env python3
"""
画像収集モジュール
Apify、Web スクレイピング、APIを使用した画像収集
"""

import os
import json
import requests
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum


class ImageSource(Enum):
    """画像ソース"""
    GOOGLE_IMAGES = "google_images"
    AMAZON_KINDLE = "amazon_kindle"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    PINTEREST = "pinterest"
    CUSTOM_URL = "custom_url"


@dataclass
class CollectedImage:
    """収集された画像"""
    url: str
    local_path: Optional[str]
    metadata: Dict[str, Any]
    source: str


class ImageCollector:
    """画像収集クラス"""

    def __init__(self, apify_token: Optional[str] = None):
        """初期化"""
        self.apify_token = apify_token or os.environ.get("APIFY_API_TOKEN")

    def collect_google_images(
        self,
        query: str,
        count: int = 100,
        output_dir: Optional[str] = None
    ) -> List[CollectedImage]:
        """Google画像検索から収集"""

        if not self.apify_token:
            raise RuntimeError("APIFY_API_TOKEN not set")

        try:
            from apify_client import ApifyClient
        except ImportError:
            raise ImportError("apify-client not installed. Run: pip install apify-client")

        client = ApifyClient(self.apify_token)

        run = client.actor("hooli/google-images-scraper").call(
            run_input={
                "queries": [query],
                "maxResultsPerQuery": count,
                "outputFormat": "json"
            }
        )

        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

        results = []
        for item in items:
            collected = CollectedImage(
                url=item.get("imageUrl", ""),
                local_path=None,
                metadata={
                    "title": item.get("title"),
                    "source_url": item.get("sourceUrl"),
                    "width": item.get("width"),
                    "height": item.get("height")
                },
                source="google_images"
            )

            if output_dir and collected.url:
                local_path = self._download_image(
                    collected.url,
                    output_dir,
                    f"google_{len(results):04d}"
                )
                collected.local_path = local_path

            results.append(collected)

        return results

    def collect_amazon_kindle_covers(
        self,
        category: str,
        count: int = 100,
        output_dir: Optional[str] = None
    ) -> List[CollectedImage]:
        """Amazon Kindle表紙を収集"""

        if not self.apify_token:
            raise RuntimeError("APIFY_API_TOKEN not set")

        try:
            from apify_client import ApifyClient
        except ImportError:
            raise ImportError("apify-client not installed")

        client = ApifyClient(self.apify_token)

        # Amazon商品スクレイパーを使用
        run = client.actor("junglee/amazon-product-scraper").call(
            run_input={
                "searchKeywords": [f"Kindle本 {category}"],
                "maxProducts": count,
                "includeDescription": False
            }
        )

        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

        results = []
        for item in items:
            image_url = item.get("imageUrl") or item.get("thumbnailImage")
            if not image_url:
                continue

            collected = CollectedImage(
                url=image_url,
                local_path=None,
                metadata={
                    "title": item.get("title"),
                    "asin": item.get("asin"),
                    "price": item.get("price"),
                    "rating": item.get("rating"),
                    "reviews": item.get("reviewsCount"),
                    "rank": item.get("bestSellersRank")
                },
                source="amazon_kindle"
            )

            if output_dir and collected.url:
                local_path = self._download_image(
                    collected.url,
                    output_dir,
                    f"kindle_{len(results):04d}"
                )
                collected.local_path = local_path

            results.append(collected)

        return results

    def collect_youtube_thumbnails(
        self,
        query: str,
        count: int = 100,
        output_dir: Optional[str] = None
    ) -> List[CollectedImage]:
        """YouTubeサムネイルを収集"""

        if not self.apify_token:
            raise RuntimeError("APIFY_API_TOKEN not set")

        try:
            from apify_client import ApifyClient
        except ImportError:
            raise ImportError("apify-client not installed")

        client = ApifyClient(self.apify_token)

        run = client.actor("bernardo/youtube-scraper").call(
            run_input={
                "searchKeywords": [query],
                "maxResults": count
            }
        )

        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

        results = []
        for item in items:
            # 高解像度サムネイルURL構築
            video_id = item.get("id")
            if not video_id:
                continue

            thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"

            collected = CollectedImage(
                url=thumbnail_url,
                local_path=None,
                metadata={
                    "title": item.get("title"),
                    "video_id": video_id,
                    "channel": item.get("channelName"),
                    "views": item.get("viewCount"),
                    "likes": item.get("likeCount"),
                    "duration": item.get("duration")
                },
                source="youtube"
            )

            if output_dir and collected.url:
                local_path = self._download_image(
                    collected.url,
                    output_dir,
                    f"youtube_{len(results):04d}"
                )
                collected.local_path = local_path

            results.append(collected)

        return results

    def collect_from_urls(
        self,
        urls: List[str],
        output_dir: str
    ) -> List[CollectedImage]:
        """URLリストから画像を収集"""

        results = []
        for i, url in enumerate(urls):
            local_path = self._download_image(url, output_dir, f"custom_{i:04d}")

            collected = CollectedImage(
                url=url,
                local_path=local_path,
                metadata={"index": i},
                source="custom_url"
            )
            results.append(collected)

        return results

    def _download_image(
        self,
        url: str,
        output_dir: str,
        filename: str
    ) -> Optional[str]:
        """画像をダウンロード"""

        try:
            os.makedirs(output_dir, exist_ok=True)

            response = requests.get(url, timeout=30, headers={
                "User-Agent": "Mozilla/5.0 (compatible; ImageCollector/1.0)"
            })

            if response.status_code != 200:
                return None

            # 拡張子を推定
            content_type = response.headers.get("Content-Type", "image/jpeg")
            ext = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/gif": ".gif",
                "image/webp": ".webp"
            }.get(content_type, ".jpg")

            filepath = os.path.join(output_dir, f"{filename}{ext}")

            with open(filepath, "wb") as f:
                f.write(response.content)

            return filepath

        except Exception as e:
            print(f"Error downloading {url}: {e}")
            return None

    def save_metadata(
        self,
        images: List[CollectedImage],
        output_path: str
    ):
        """メタデータを保存"""

        data = []
        for img in images:
            data.append({
                "url": img.url,
                "local_path": img.local_path,
                "source": img.source,
                "metadata": img.metadata
            })

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


# CLI用
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 4:
        print("Usage: python image_collector.py <source> <query> <output_dir> [count]")
        print("Sources: google_images, amazon_kindle, youtube")
        sys.exit(1)

    source = sys.argv[1]
    query = sys.argv[2]
    output_dir = sys.argv[3]
    count = int(sys.argv[4]) if len(sys.argv) > 4 else 50

    collector = ImageCollector()

    if source == "google_images":
        images = collector.collect_google_images(query, count, output_dir)
    elif source == "amazon_kindle":
        images = collector.collect_amazon_kindle_covers(query, count, output_dir)
    elif source == "youtube":
        images = collector.collect_youtube_thumbnails(query, count, output_dir)
    else:
        print(f"Unknown source: {source}")
        sys.exit(1)

    metadata_path = os.path.join(output_dir, "metadata.json")
    collector.save_metadata(images, metadata_path)

    print(f"Collected {len(images)} images to {output_dir}")
    print(f"Metadata saved to {metadata_path}")
