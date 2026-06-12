#!/usr/bin/env python3
"""
save_note_session.py
ローカルで一度だけ実行して note.com のセッション Cookie を保存する。

使い方:
  python3 scripts/save_note_session.py

出力された JSON を GitHub Secret "NOTE_SESSION_JSON" に登録すること。
"""

import json
from playwright.sync_api import sync_playwright


def main():
    print("=" * 60)
    print("  note.com セッション保存ツール")
    print("=" * 60)
    print()
    print("ブラウザが開きます。note.com に手動でログインしてください。")
    print("ログイン完了後、このターミナルで Enter を押してください。")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--start-maximized"],
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="ja-JP",
        )
        page = context.new_page()
        page.goto("https://note.com/login")

        input(">>> ブラウザでログイン完了後、Enter を押してください... ")

        current_url = page.url
        print(f"現在のURL: {current_url}")

        if "/login" in current_url:
            print("[ERROR] まだログインページにいます。ログインしてから Enter を押してください。")
            browser.close()
            return

        state = context.storage_state()
        browser.close()

    cookies = state.get("cookies", [])
    note_cookies = [c for c in cookies if "note.com" in c.get("domain", "")]

    print(f"\nCookie 取得数: {len(cookies)} 件（note.com: {len(note_cookies)} 件）")

    session_json = json.dumps(state, ensure_ascii=False, indent=2)

    print()
    print("=" * 60)
    print("  以下の JSON を GitHub Secret に登録してください")
    print("  Secret 名: NOTE_SESSION_JSON")
    print("=" * 60)
    print()

    # ファイルにも保存（確認用・gitignore 対象）
    out_path = "note_session.json"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(session_json)
    print(f"[保存] {out_path}  ← このファイルの内容を Secret に貼り付けてください")
    print()
    print("[重要] note_session.json は認証情報です。Git にコミットしないでください。")
    print("       .gitignore に note_session.json が含まれているか確認してください。")
    print()

    # GitHub Secrets に貼りやすいよう 1 行版も表示
    one_line = json.dumps(state, ensure_ascii=False, separators=(",", ":"))
    print("=== 1行版（Secretへの貼り付け用）===")
    print(one_line[:200], "..." if len(one_line) > 200 else "")
    print(f"\n（全体は {out_path} を参照）")


if __name__ == "__main__":
    main()
