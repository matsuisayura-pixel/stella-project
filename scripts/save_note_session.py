#!/usr/bin/env python3
"""
save_note_session.py
ローカルで一度だけ実行して note.com のセッション Cookie を保存する。

使い方:
  python scripts/save_note_session.py

ブラウザが開くので手動でログイン → ログイン完了を自動検知 → note_session.json を保存。
出力された JSON を GitHub Secret "NOTE_SESSION_JSON" に登録すること。
"""

import json
import sys
from playwright.sync_api import sync_playwright

TIMEOUT_SEC = 180


def main():
    print("=" * 60)
    print("  note.com セッション保存ツール")
    print("=" * 60)
    print()
    print("ブラウザが開きます。")
    print("note.com に手動でログインしてください。")
    print(f"ログイン完了を自動検知します（最大 {TIMEOUT_SEC} 秒待機）。")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--start-maximized", "--disable-blink-features=AutomationControlled"],
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="ja-JP",
        )
        page = context.new_page()
        page.goto("https://note.com/login")
        print("  → ブラウザを開きました: https://note.com/login")
        print("  → ログインしてください（ブラウザウィンドウを確認）")
        print()

        # ログイン完了（/login から離脱）を自動検知
        try:
            page.wait_for_url(
                lambda url: "/login" not in url,
                timeout=TIMEOUT_SEC * 1000,
            )
        except Exception:
            print("[ERROR] タイムアウト: ログインが完了しませんでした。")
            print("        ブラウザで手動ログイン後、もう一度実行してください。")
            browser.close()
            sys.exit(1)

        current_url = page.url
        print(f"  → ログイン検知: {current_url}")

        # 少し待ってから Cookie を取得（セッション安定化）
        page.wait_for_load_state("networkidle", timeout=10000)
        state = context.storage_state()
        browser.close()

    cookies = state.get("cookies", [])
    note_cookies = [c for c in cookies if "note.com" in c.get("domain", "")]

    if not note_cookies:
        print("[ERROR] note.com の Cookie が取得できませんでした。")
        print("        ブラウザで手動ログイン後、もう一度実行してください。")
        sys.exit(1)

    print(f"\n  Cookie 取得: {len(cookies)} 件（note.com: {len(note_cookies)} 件）")

    # ファイルに保存
    out_path = "note_session.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)

    print()
    print("=" * 60)
    print("  保存完了")
    print("=" * 60)
    print()
    print(f"  [保存先] {out_path}")
    print()
    print("  次のステップ:")
    print("  1. GitHub → Settings → Secrets and variables → Actions")
    print("  2. New repository secret")
    print("     名前: NOTE_SESSION_JSON")
    print("     値:   note_session.json の中身をすべてコピーして貼り付け")
    print()
    print("  [重要] note_session.json は認証情報です。")
    print("         Git にコミットしないでください（.gitignore 登録済み）。")


if __name__ == "__main__":
    main()
