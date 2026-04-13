"""
プロジェクト・ステラ メインエントリーポイント

使い方:
    python main.py                          # インタラクティブモード
    python main.py --load                   # ナレッジベースを読み込む
    python main.py --theme 金運 --query "お金が貯まらない"  # コンテンツ生成
"""

import argparse
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# .env ファイルを読み込む
load_dotenv()

# stellaモジュールをパスに追加
sys.path.insert(0, str(Path(__file__).parent))

from stella.rag import load_knowledge_base
from stella.pipeline import run_daily_pipeline


def check_api_key():
    """APIキーの確認"""
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key or key == "your_api_key_here":
        print("❌ ANTHROPIC_API_KEY が設定されていません。")
        print("   .env ファイルに以下を追加してください：")
        print("   ANTHROPIC_API_KEY=your_actual_key")
        sys.exit(1)
    return key


def interactive_mode():
    """インタラクティブCLIモード"""
    print("=" * 60)
    print("  🌟 プロジェクト・ステラ - コンテンツ生成システム")
    print("=" * 60)
    print()

    print("📚 コマンド一覧:")
    print("  1. ナレッジベースを読み込む")
    print("  2. コンテンツを生成する")
    print("  3. 終了")
    print()

    while True:
        choice = input("選択してください (1/2/3): ").strip()

        if choice == "1":
            print("\nナレッジベースを読み込みます...")
            count = load_knowledge_base()
            print(f"完了。{count} チャンク登録されました。\n")

        elif choice == "2":
            check_api_key()
            print("\n利用可能なテーマ: 金運 / 人間関係 / 瞑想 / その他")
            theme = input("テーマを入力してください: ").strip()
            query = input("相談内容・悩みを入力してください: ").strip()

            if not theme or not query:
                print("テーマと相談内容は必須です。\n")
                continue

            save_path = run_daily_pipeline(theme=theme, user_query=query)
            print(f"\n💾 生成ファイルはこちら: {save_path}\n")

        elif choice == "3":
            print("終了します。")
            break

        else:
            print("1, 2, 3 のいずれかを入力してください。\n")


def main():
    parser = argparse.ArgumentParser(description="プロジェクト・ステラ コンテンツ生成システム")
    parser.add_argument("--load", action="store_true", help="ナレッジベースを読み込む")
    parser.add_argument("--theme", type=str, help="テーマ（例: 金運）")
    parser.add_argument("--query", type=str, help="相談内容（例: お金が貯まらない）")
    args = parser.parse_args()

    if args.load:
        print("ナレッジベースを読み込みます...")
        count = load_knowledge_base()
        print(f"完了。{count} チャンク登録されました。")

    elif args.theme and args.query:
        check_api_key()
        run_daily_pipeline(theme=args.theme, user_query=args.query)

    else:
        interactive_mode()


if __name__ == "__main__":
    main()
