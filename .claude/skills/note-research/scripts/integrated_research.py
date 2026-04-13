#!/usr/bin/env python3
"""
統合リサーチシステム
note.com非公式API + WebSearch検索パターンを統合

Claude CodeのWebSearch/WebFetchと組み合わせて使用
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

from note_api import NoteResearcher, research_genre, research_user
from report_generator import generate_genre_report, generate_user_report


class IntegratedNoteResearch:
    """
    統合noteリサーチシステム

    機能:
    - note.com非公式APIによるデータ取得
    - WebSearch用の検索クエリ生成
    - 結果の統合とレポート生成
    """

    def __init__(self, output_dir: str = "research/note"):
        """
        Args:
            output_dir: 出力ディレクトリ
        """
        self.output_dir = Path(output_dir)
        self.researcher = NoteResearcher()

    def _create_run_dir(self, query: str) -> Path:
        """実行ディレクトリを作成"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        slug = query[:30].replace(" ", "_").replace("/", "_")
        run_dir = self.output_dir / f"{timestamp}__{slug}"
        run_dir.mkdir(parents=True, exist_ok=True)
        return run_dir

    def research_by_genre(self, genre: str) -> Dict[str, Any]:
        """
        ジャンル別リサーチを実行

        Args:
            genre: リサーチするジャンル

        Returns:
            リサーチ結果と出力ファイルパス
        """
        print(f"\n{'='*60}")
        print(f"[NOTE RESEARCH] ジャンル別リサーチ: {genre}")
        print(f"{'='*60}\n")

        run_dir = self._create_run_dir(f"genre_{genre}")

        # 1. 入力パラメータを保存
        input_data = {
            "type": "genre",
            "query": genre,
            "timestamp": datetime.now().isoformat(),
        }
        with open(run_dir / "input.yaml", "w") as f:
            f.write(f"type: genre\nquery: {genre}\ntimestamp: {input_data['timestamp']}\n")

        # 2. note.com APIでデータ取得
        print("[STEP 1] note.com APIからデータ取得中...")
        api_result = research_genre(genre, self.researcher)

        # 3. 生データを保存
        with open(run_dir / "raw_data.json", "w", encoding="utf-8") as f:
            json.dump(api_result, f, ensure_ascii=False, indent=2)
        print(f"[INFO] Raw data saved: {run_dir}/raw_data.json")

        # 4. WebSearch用クエリを生成
        web_queries = self._generate_genre_queries(genre)
        with open(run_dir / "web_queries.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(web_queries))
        print(f"[INFO] WebSearch queries saved: {run_dir}/web_queries.txt")

        # 5. レポート生成
        print("[STEP 2] レポート生成中...")
        report = generate_genre_report(api_result)
        with open(run_dir / "report.md", "w", encoding="utf-8") as f:
            f.write(report)
        print(f"[INFO] Report saved: {run_dir}/report.md")

        # 6. 結果サマリー
        result = {
            "success": True,
            "run_dir": str(run_dir),
            "files": {
                "input": str(run_dir / "input.yaml"),
                "raw_data": str(run_dir / "raw_data.json"),
                "web_queries": str(run_dir / "web_queries.txt"),
                "report": str(run_dir / "report.md"),
            },
            "stats": api_result.get("stats", {}),
            "web_queries": web_queries,
        }

        print(f"\n{'='*60}")
        print("[COMPLETE] ジャンル別リサーチ完了")
        print(f"出力ディレクトリ: {run_dir}")
        print(f"{'='*60}\n")

        return result

    def research_by_user(self, username: str) -> Dict[str, Any]:
        """
        ユーザー別リサーチを実行

        Args:
            username: リサーチするユーザー名（@あり/なし両対応）

        Returns:
            リサーチ結果と出力ファイルパス
        """
        username = username.lstrip("@")

        print(f"\n{'='*60}")
        print(f"[NOTE RESEARCH] ユーザー別リサーチ: @{username}")
        print(f"{'='*60}\n")

        run_dir = self._create_run_dir(f"user_{username}")

        # 1. 入力パラメータを保存
        input_data = {
            "type": "user",
            "username": username,
            "timestamp": datetime.now().isoformat(),
        }
        with open(run_dir / "input.yaml", "w") as f:
            f.write(f"type: user\nusername: {username}\ntimestamp: {input_data['timestamp']}\n")

        # 2. note.com APIでデータ取得
        print("[STEP 1] note.com APIからデータ取得中...")
        api_result = research_user(username, self.researcher)

        # 3. 生データを保存
        with open(run_dir / "raw_data.json", "w", encoding="utf-8") as f:
            json.dump(api_result, f, ensure_ascii=False, indent=2)
        print(f"[INFO] Raw data saved: {run_dir}/raw_data.json")

        # 4. WebSearch用クエリを生成
        web_queries = self._generate_user_queries(username)
        with open(run_dir / "web_queries.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(web_queries))
        print(f"[INFO] WebSearch queries saved: {run_dir}/web_queries.txt")

        # 5. レポート生成
        print("[STEP 2] レポート生成中...")
        report = generate_user_report(api_result)
        with open(run_dir / "report.md", "w", encoding="utf-8") as f:
            f.write(report)
        print(f"[INFO] Report saved: {run_dir}/report.md")

        # 6. 結果サマリー
        result = {
            "success": True,
            "run_dir": str(run_dir),
            "files": {
                "input": str(run_dir / "input.yaml"),
                "raw_data": str(run_dir / "raw_data.json"),
                "web_queries": str(run_dir / "web_queries.txt"),
                "report": str(run_dir / "report.md"),
            },
            "stats": api_result.get("stats", {}),
            "user_info": api_result.get("user_info", {}),
            "web_queries": web_queries,
        }

        print(f"\n{'='*60}")
        print("[COMPLETE] ユーザー別リサーチ完了")
        print(f"出力ディレクトリ: {run_dir}")
        print(f"{'='*60}\n")

        return result

    def research_template(self, genre: Optional[str] = None) -> Dict[str, Any]:
        """
        売れるnote構成テンプレートをリサーチ

        Args:
            genre: 特定ジャンルに絞る場合

        Returns:
            テンプレート分析結果
        """
        print(f"\n{'='*60}")
        print("[NOTE RESEARCH] 構成テンプレートリサーチ")
        print(f"{'='*60}\n")

        query = f"template_{genre}" if genre else "template_all"
        run_dir = self._create_run_dir(query)

        # WebSearch用クエリ
        web_queries = self._generate_template_queries(genre)
        with open(run_dir / "web_queries.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(web_queries))

        result = {
            "success": True,
            "run_dir": str(run_dir),
            "web_queries": web_queries,
            "instructions": """
## 次のステップ

1. 以下のWebSearch用クエリを実行してください:

{queries}

2. 検索結果から重要なURLをWebFetchで取得:
   WebFetch(url, prompt="記事構成のテンプレートを抽出")

3. 抽出したテンプレートを report.md に追記
""".format(queries="\n".join([f"- {q}" for q in web_queries]))
        }

        print(f"[INFO] WebSearch queries saved: {run_dir}/web_queries.txt")
        print("\n以下のクエリでWebSearchを実行してください:")
        for q in web_queries[:5]:
            print(f"  - {q}")

        return result

    def _generate_genre_queries(self, genre: str) -> List[str]:
        """ジャンル別WebSearch用クエリを生成"""
        return [
            f"site:note.com {genre} 有料記事 人気",
            f"site:note.com {genre} 売れてる",
            f"site:note.com {genre} ベストセラー",
            f"site:note.com {genre} おすすめ 2026",
            f"{genre} note 売れる 構成",
            f"{genre} note 書き方 コツ",
            f"{genre} note テンプレート",
        ]

    def _generate_user_queries(self, username: str) -> List[str]:
        """ユーザー別WebSearch用クエリを生成"""
        return [
            f"site:note.com @{username}",
            f'"{username}" note 人気',
            f'"{username}" note 評判',
            f"site:twitter.com {username} note",
        ]

    def _generate_template_queries(self, genre: Optional[str] = None) -> List[str]:
        """テンプレートリサーチ用クエリを生成"""
        base_queries = [
            "売れる note 構成 テンプレート",
            "note 有料記事 書き方 コツ",
            "note 記事 構成 黄金パターン",
            "note 人気記事 共通点",
            "note 売れる 目次 構成",
            "note 冒頭 書き方 テンプレート",
            "note 有料部分 どこから",
            "note 価格設定 コツ",
            "site:note.com note 書き方 テンプレート",
            "site:zenn.dev note 記事 構成",
        ]

        if genre:
            genre_queries = [
                f"{genre} note 構成 テンプレート",
                f"site:note.com {genre} 書き方",
                f"{genre} note 売れる 共通点",
            ]
            return genre_queries + base_queries

        return base_queries


def main():
    """CLI エントリーポイント"""
    import argparse

    parser = argparse.ArgumentParser(description="統合noteリサーチシステム")
    parser.add_argument("--genre", "-g", help="ジャンル別リサーチ")
    parser.add_argument("--user", "-u", help="ユーザー別リサーチ")
    parser.add_argument("--template", "-t", action="store_true",
                        help="テンプレートリサーチ")
    parser.add_argument("--output-dir", "-o", default="research/note",
                        help="出力ディレクトリ")

    args = parser.parse_args()

    research = IntegratedNoteResearch(output_dir=args.output_dir)

    if args.genre:
        result = research.research_by_genre(args.genre)
    elif args.user:
        result = research.research_by_user(args.user)
    elif args.template:
        result = research.research_template(args.genre)
    else:
        parser.print_help()
        return

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
