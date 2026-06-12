#!/usr/bin/env python3
"""
post_to_note.py
Playwright で note.com に記事を下書き保存する。
Usage:
  python3 scripts/post_to_note.py <output_dir>
環境変数:
  NOTE_EMAIL    / NOTE_PASSWORD  : ログイン情報
"""

import json
import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

NOTE_URL = "https://note.com"

# ---- セレクタ候補（note の DOM 変更に備えて複数用意） ----
TITLE_SELECTORS = [
    '[placeholder="タイトル"]',
    'h1[contenteditable="true"]',
    'div[data-placeholder*="タイトル"]',
    'textarea[name="name"]',
    '.editor-title',
    '[data-testid="note-title"]',
]
BODY_SELECTORS = [
    '.ProseMirror',
    'div[contenteditable="true"].note-common-styles__textnote-body',
    '.ql-editor',
    'div[contenteditable="true"][class*="editor"]',
    '[data-testid="note-body"]',
]
SAVE_DRAFT_SELECTORS = [
    'button:has-text("下書き保存")',
    'button:has-text("下書きとして保存")',
    '[data-testid="save-draft-button"]',
    'button.o-publishSetting__save',
]
EYECATCH_SELECTORS = [
    'input[type="file"][accept*="image"]',
    '[data-testid="eyecatch-upload"] input[type="file"]',
    'label[for*="eyecatch"] input[type="file"]',
]


# ==================== コンテンツ変換 ====================

def blocks_to_html(blocks: list) -> str:
    """body_blocks を note エディタが受け付ける HTML に変換"""
    parts = []
    i = 0
    while i < len(blocks):
        b = blocks[i]
        t = b.get("type", "paragraph")

        if t == "h2":
            parts.append(f'<h2>{_escape(b["text"])}</h2>')
        elif t == "h3":
            parts.append(f'<h3>{_escape(b["text"])}</h3>')
        elif t == "bold":
            parts.append(f'<p><strong>{_escape(b["text"])}</strong></p>')
        elif t == "quote":
            parts.append(f'<blockquote><p>{_escape(b["text"])}</p></blockquote>')
        elif t == "list":
            items_html = "".join(f'<li>{_escape(it)}</li>' for it in b.get("items", []))
            parts.append(f'<ul>{items_html}</ul>')
        elif t == "separator":
            parts.append('<hr>')
        else:
            text = b.get("text", "")
            # インライン **bold** を <strong> に変換
            import re
            text_html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', _escape(text))
            parts.append(f'<p>{text_html}</p>')

        i += 1
    return "\n".join(parts)


def _escape(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ==================== Playwright 操作 ====================

def _find_visible(page, selectors: list):
    """セレクタ候補を順に試して最初に見つかったものを返す"""
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if el.is_visible(timeout=1000):
                return sel
        except Exception:
            pass
    return None


def _fill_first(page, selectors: list, value: str, label: str) -> None:
    """セレクタ候補を順に試して最初に見つかった入力欄に値をセットする"""
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if loc.is_visible(timeout=2000):
                loc.fill(value)
                print(f"  [note] {label} 入力完了（selector: {sel}）")
                return
        except Exception:
            pass
    raise RuntimeError(f"{label} の入力欄が見つかりませんでした。selectors={selectors}")


def login(page, email: str, password: str) -> None:
    print("  [note] ログイン中...")
    page.goto(f"{NOTE_URL}/login", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=15000)

    # メールアドレス（セレクタ候補を個別に試す）
    _fill_first(page, [
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="メール"]',
        'input[placeholder*="mail"]',
        'input[placeholder*="note ID"]',
        'input[name="identifier"]',
        'form input:first-of-type',
    ], email, "メールアドレス")

    # パスワード
    _fill_first(page, [
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="パスワード"]',
        'input[placeholder*="password"]',
    ], password, "パスワード")

    # ログインボタン
    login_btn_selectors = [
        'button[type="submit"]',
        'button:has-text("ログイン")',
        'input[type="submit"]',
    ]
    btn = _find_visible(page, login_btn_selectors)
    if btn:
        page.click(btn)
    else:
        raise RuntimeError("ログインボタンが見つかりません")

    try:
        page.wait_for_url(f"{NOTE_URL}/**", timeout=30000)
    except PWTimeout:
        pass  # リダイレクト先が変わっても続行

    # ログイン完了まで待機
    page.wait_for_load_state("networkidle", timeout=15000)
    print("  [note] ログイン完了")


def input_title(page, title: str) -> None:
    sel = _find_visible(page, TITLE_SELECTORS)
    if not sel:
        print("  [警告] タイトル欄が見つかりません（スキップ）")
        return
    page.click(sel)
    page.evaluate(f'''() => {{
        const el = document.querySelector({json.dumps(sel)});
        if (el) {{ el.textContent = ""; }}
    }}''')
    page.keyboard.type(title, delay=20)
    print(f"  [note] タイトル入力完了: {title[:30]}...")


def input_body(page, html_body: str) -> None:
    sel = _find_visible(page, BODY_SELECTORS)
    if not sel:
        print("  [警告] 本文欄が見つかりません（スキップ）")
        return

    page.click(sel)
    time.sleep(0.5)

    # ① insertHTML で HTML をそのまま流し込む（最優先）
    success = page.evaluate(f'''(html) => {{
        const el = document.querySelector({json.dumps(sel)});
        if (!el) return false;
        el.focus();
        document.execCommand("selectAll", false, null);
        return document.execCommand("insertHTML", false, html);
    }}''', html_body)

    if not success:
        # ② Clipboard API 経由でペースト（fallback）
        page.evaluate(f'''async (html) => {{
            const blob = new Blob([html], {{type: "text/html"}});
            const item = new ClipboardItem({{"text/html": blob}});
            await navigator.clipboard.write([item]);
        }}''', html_body)
        page.keyboard.press("Control+a")
        page.keyboard.press("Control+v")

    time.sleep(1)
    print("  [note] 本文入力完了")


def upload_eyecatch(page, image_path: Path) -> None:
    if not image_path.exists():
        print("  [note] アイキャッチ画像なし（スキップ）")
        return

    # ファイルチューザー経由でアップロード
    for sel in EYECATCH_SELECTORS:
        try:
            if page.locator(sel).count() > 0:
                page.locator(sel).first.set_input_files(str(image_path))
                time.sleep(2)
                print("  [note] アイキャッチ画像アップロード完了")
                return
        except Exception:
            pass

    # ボタンクリック経由でファイルチューザーを開く fallback
    eyecatch_buttons = [
        'button:has-text("画像をアップロード")',
        'button:has-text("サムネイル")',
        '[data-testid="eyecatch-button"]',
        'label:has-text("アイキャッチ")',
    ]
    for btn in eyecatch_buttons:
        try:
            if page.locator(btn).is_visible(timeout=1000):
                with page.expect_file_chooser(timeout=5000) as fc_info:
                    page.click(btn)
                fc_info.value.set_files(str(image_path))
                time.sleep(2)
                print("  [note] アイキャッチ画像アップロード完了（ボタン経由）")
                return
        except Exception:
            pass

    print("  [警告] アイキャッチアップロードボタンが見つかりません")


def save_draft(page) -> str:
    """下書き保存し、記事 URL を返す"""
    sel = _find_visible(page, SAVE_DRAFT_SELECTORS)
    if sel:
        page.click(sel)
    else:
        # Ctrl+S fallback
        page.keyboard.press("Control+s")

    time.sleep(3)

    # 保存後の URL を取得
    url = page.url
    print(f"  [note] 下書き保存完了: {url}")
    return url


def quality_check(page, url: str, content: dict) -> dict:
    """下書き URL にアクセスして反映状況をチェック"""
    result = {
        "url": url,
        "title":    False,
        "h2":       False,
        "h3":       False,
        "bold":     False,
        "cta":      False,
        "eyecatch": False,
    }

    try:
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle", timeout=15000)
        html = page.content()

        title = content.get("title", "")
        if title and title[:10] in html:
            result["title"] = True

        result["h2"] = "<h2" in html
        result["h3"] = "<h3" in html
        result["bold"] = "<strong" in html or "<b>" in html
        result["cta"] = "LINE" in html or "魂の現在地" in html
        result["eyecatch"] = 'og:image' in html or '<img' in html

    except Exception as e:
        print(f"  [警告] 品質チェック中にエラー: {e}")

    return result


# ==================== メイン ====================

def post_to_note(output_dir: Path) -> str:
    email    = os.environ.get("NOTE_EMAIL", "")
    password = os.environ.get("NOTE_PASSWORD", "")
    if not email or not password:
        raise SystemExit("ERROR: NOTE_EMAIL / NOTE_PASSWORD が未設定")

    content_path = output_dir / "content.json"
    if not content_path.exists():
        raise SystemExit(f"ERROR: content.json が見つかりません: {content_path}")

    content = json.loads(content_path.read_text(encoding="utf-8"))
    title      = content.get("title", "（タイトルなし）")
    body_html  = blocks_to_html(content.get("body_blocks", []))
    eyecatch   = output_dir / "images" / "eyecatch.png"

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="ja-JP",
            permissions=["clipboard-read", "clipboard-write"],
        )
        page = context.new_page()

        try:
            # STEP4: ログイン
            login(page, email, password)

            # STEP5: 新規記事作成ページへ
            print("  [note] 記事作成ページへ移動...")
            page.goto(f"{NOTE_URL}/notes/new", wait_until="domcontentloaded")
            page.wait_for_load_state("networkidle", timeout=20000)
            time.sleep(2)

            # STEP5: タイトル入力
            input_title(page, title)

            # STEP6: 本文入力（HTML貼り付け）
            input_body(page, body_html)

            # STEP7: アイキャッチ設定
            upload_eyecatch(page, eyecatch)

            # STEP5: 下書き保存
            draft_url = save_draft(page)

            # STEP8: 品質確認
            print("  [note] 品質チェック中...")
            qc = quality_check(page, draft_url, content)
            print_quality_report(qc)

            return draft_url

        except Exception as e:
            # デバッグ用スクリーンショット
            ss_path = output_dir / "debug-screenshot.png"
            try:
                page.screenshot(path=str(ss_path), full_page=True)
                print(f"  [デバッグ] スクリーンショット保存: {ss_path}")
            except Exception:
                pass
            raise RuntimeError(f"note 投稿失敗: {e}") from e

        finally:
            browser.close()


def print_quality_report(qc: dict) -> None:
    print("\n  ── 品質チェック結果 ──────────────────")
    checks = [
        ("タイトル反映",       qc["title"]),
        ("H2 反映",           qc["h2"]),
        ("H3 反映",           qc["h3"]),
        ("太字反映",           qc["bold"]),
        ("CTA 反映",          qc["cta"]),
        ("アイキャッチ反映",   qc["eyecatch"]),
    ]
    all_ok = True
    for label, ok in checks:
        mark = "✓" if ok else "✗"
        print(f"  {mark} {label}")
        if not ok:
            all_ok = False
    if not all_ok:
        print("  [警告] 未反映項目あり — 手動確認が必要です")
    print("  ──────────────────────────────────────\n")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 post_to_note.py <output_dir>")
        sys.exit(1)

    output_dir = Path(sys.argv[1])
    draft_url = post_to_note(output_dir)

    # draft-url.txt を保存
    url_file = output_dir / "draft-url.txt"
    url_file.write_text(draft_url, encoding="utf-8")
    print(f"  ✓ 下書きURL: {draft_url}")
    print(f"  ✓ 保存先   : {url_file}")


if __name__ == "__main__":
    main()
