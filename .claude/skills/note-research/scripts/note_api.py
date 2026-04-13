#!/usr/bin/env python3
"""
note.com 非公式API リサーチャー
コストゼロでnote.comの記事・ユーザー情報を取得
"""

import requests
import json
import time
import re
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import sys


@dataclass
class NoteArticle:
    """note記事データ"""
    key: str
    title: str
    author: str
    author_urlname: str
    like_count: int
    comment_count: int
    price: int
    is_paid: bool
    body_preview: str
    url: str
    published_at: str


@dataclass
class NoteUser:
    """noteユーザーデータ"""
    id: int
    urlname: str
    name: str
    note_count: int
    follower_count: int
    following_count: int
    profile: str


class NoteResearcher:
    """note.com 非公式APIリサーチャー"""

    BASE_URL = "https://note.com/api"

    def __init__(self, delay: float = 0.5):
        """
        Args:
            delay: リクエスト間の待機時間（秒）
        """
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "application/json",
            "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        })
        self.delay = delay
        self._last_request = 0

    def _wait(self):
        """レート制限対策の待機"""
        elapsed = time.time() - self._last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_request = time.time()

    def get_user(self, username: str) -> Optional[NoteUser]:
        """
        ユーザー情報を取得

        Args:
            username: ユーザーのurlname（@なし）

        Returns:
            NoteUser or None
        """
        self._wait()
        url = f"{self.BASE_URL}/v2/creators/{username}"
        try:
            resp = self.session.get(url)
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                return NoteUser(
                    id=data.get("id", 0),
                    urlname=data.get("urlname", ""),
                    name=data.get("name", ""),
                    note_count=data.get("noteCount", 0),
                    follower_count=data.get("followerCount", 0),
                    following_count=data.get("followingCount", 0),
                    profile=data.get("profile", ""),
                )
        except Exception as e:
            print(f"[ERROR] get_user({username}): {e}", file=sys.stderr)
        return None

    def get_user_notes(self, username: str, max_pages: int = 3) -> List[Dict]:
        """
        ユーザーの記事一覧を取得

        Args:
            username: ユーザーのurlname
            max_pages: 取得する最大ページ数

        Returns:
            記事リスト
        """
        all_notes = []
        for page in range(1, max_pages + 1):
            self._wait()
            url = f"{self.BASE_URL}/v2/creators/{username}/contents"
            params = {"kind": "note", "page": page}
            try:
                resp = self.session.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    notes = data.get("contents", [])
                    if not notes:
                        break
                    all_notes.extend(notes)
                else:
                    break
            except Exception as e:
                print(f"[ERROR] get_user_notes({username}, page={page}): {e}", file=sys.stderr)
                break
        return all_notes

    def get_note(self, note_key: str) -> Optional[Dict]:
        """
        記事詳細を取得

        Args:
            note_key: 記事のキー（n1234567890ab形式）

        Returns:
            記事データ or None
        """
        self._wait()
        url = f"{self.BASE_URL}/v1/notes/{note_key}"
        try:
            resp = self.session.get(url)
            if resp.status_code == 200:
                return resp.json().get("data")
        except Exception as e:
            print(f"[ERROR] get_note({note_key}): {e}", file=sys.stderr)
        return None

    def get_trending(self) -> List[Dict]:
        """
        トレンド記事を取得

        Returns:
            トレンド記事リスト
        """
        self._wait()
        url = f"{self.BASE_URL}/v3/trending/notes"
        try:
            resp = self.session.get(url)
            if resp.status_code == 200:
                return resp.json().get("data", [])
        except Exception as e:
            print(f"[ERROR] get_trending(): {e}", file=sys.stderr)
        return []

    def search_by_tag(self, tag: str, max_pages: int = 2) -> List[Dict]:
        """
        タグで記事を検索

        Args:
            tag: 検索タグ
            max_pages: 取得する最大ページ数

        Returns:
            記事リスト
        """
        all_articles = []
        for page in range(1, max_pages + 1):
            self._wait()
            url = f"{self.BASE_URL}/v3/articles"
            params = {"tag": tag, "page": page}
            try:
                resp = self.session.get(url, params=params)
                if resp.status_code == 200:
                    articles = resp.json().get("data", [])
                    if not articles:
                        break
                    all_articles.extend(articles)
                else:
                    break
            except Exception as e:
                print(f"[ERROR] search_by_tag({tag}, page={page}): {e}", file=sys.stderr)
                break
        return all_articles

    @staticmethod
    def extract_note_key(url: str) -> Optional[str]:
        """
        URLからnote_keyを抽出

        Args:
            url: note記事のURL

        Returns:
            note_key or None
        """
        match = re.search(r'/n/([a-zA-Z0-9]+)', url)
        if match:
            return match.group(1)
        return None

    @staticmethod
    def extract_username(url: str) -> Optional[str]:
        """
        URLからusernameを抽出

        Args:
            url: noteユーザーまたは記事のURL

        Returns:
            username or None
        """
        match = re.search(r'note\.com/([^/]+)', url)
        if match:
            username = match.group(1)
            if username not in ['api', 'search', 'hashtag']:
                return username
        return None


def research_genre(genre: str, researcher: Optional[NoteResearcher] = None) -> Dict[str, Any]:
    """
    ジャンル別リサーチ

    Args:
        genre: リサーチするジャンル名
        researcher: NoteResearcherインスタンス（省略時は新規作成）

    Returns:
        リサーチ結果
    """
    if researcher is None:
        researcher = NoteResearcher()

    results = {
        "genre": genre,
        "timestamp": datetime.now().isoformat(),
        "trending": [],
        "by_tag": [],
        "stats": {},
    }

    print(f"[INFO] Researching genre: {genre}")

    # トレンド取得
    print("[INFO] Fetching trending notes...")
    results["trending"] = researcher.get_trending()[:20]

    # タグ検索
    print(f"[INFO] Searching by tag: {genre}")
    results["by_tag"] = researcher.search_by_tag(genre, max_pages=3)

    # 統計計算
    all_notes = results["trending"] + results["by_tag"]
    if all_notes:
        like_counts = [n.get("likeCount", 0) for n in all_notes if n.get("likeCount")]
        prices = [n.get("price", 0) for n in all_notes if n.get("price", 0) > 0]

        results["stats"] = {
            "total_count": len(all_notes),
            "avg_likes": sum(like_counts) / len(like_counts) if like_counts else 0,
            "paid_count": len(prices),
            "avg_price": sum(prices) / len(prices) if prices else 0,
            "min_price": min(prices) if prices else 0,
            "max_price": max(prices) if prices else 0,
        }

    return results


def research_user(username: str, researcher: Optional[NoteResearcher] = None) -> Dict[str, Any]:
    """
    ユーザー別リサーチ

    Args:
        username: リサーチするユーザー名（@なし）
        researcher: NoteResearcherインスタンス

    Returns:
        リサーチ結果
    """
    if researcher is None:
        researcher = NoteResearcher()

    # @を除去
    username = username.lstrip("@")

    results = {
        "username": username,
        "timestamp": datetime.now().isoformat(),
        "user_info": None,
        "notes": [],
        "stats": {},
    }

    print(f"[INFO] Researching user: @{username}")

    # ユーザー情報取得
    print("[INFO] Fetching user info...")
    user = researcher.get_user(username)
    if user:
        results["user_info"] = asdict(user)

    # 記事一覧取得
    print("[INFO] Fetching user notes...")
    results["notes"] = researcher.get_user_notes(username, max_pages=5)

    # 統計計算
    notes = results["notes"]
    if notes:
        like_counts = [n.get("likeCount", 0) for n in notes if n.get("likeCount")]
        prices = [n.get("price", 0) for n in notes if n.get("price", 0) > 0]

        results["stats"] = {
            "total_notes": len(notes),
            "total_likes": sum(like_counts),
            "avg_likes": sum(like_counts) / len(like_counts) if like_counts else 0,
            "paid_notes": len(prices),
            "avg_price": sum(prices) / len(prices) if prices else 0,
        }

    return results


def main():
    """CLI エントリーポイント"""
    import argparse

    parser = argparse.ArgumentParser(description="note.com リサーチツール")
    parser.add_argument("--genre", "-g", help="ジャンル別リサーチ")
    parser.add_argument("--user", "-u", help="ユーザー別リサーチ")
    parser.add_argument("--trending", "-t", action="store_true", help="トレンド取得")
    parser.add_argument("--output", "-o", help="出力ファイル（JSON）")

    args = parser.parse_args()

    researcher = NoteResearcher()
    result = None

    if args.genre:
        result = research_genre(args.genre, researcher)
    elif args.user:
        result = research_user(args.user, researcher)
    elif args.trending:
        result = {"trending": researcher.get_trending()}
    else:
        parser.print_help()
        return

    # 出力
    output_json = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        print(f"[INFO] Output saved to: {args.output}")
    else:
        print(output_json)


if __name__ == "__main__":
    main()
