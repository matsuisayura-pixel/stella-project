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
import re
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


# ==================== ログヘルパー ====================

def step(n: int, msg: str) -> None:
    print(f"[STEP {n:02d}] {msg}", flush=True)


def info(msg: str) -> None:
    print(f"  [INFO] {msg}", flush=True)


def warn(msg: str) -> None:
    print(f"  [WARN] {msg}", flush=True)


def save_debug_artifacts(page, output_dir: Path, label: str = "") -> None:
    """失敗時にスクリーンショットと HTML を保存する"""
    suffix = f"-{label}" if label else ""
    ss_path   = output_dir / f"debug-screenshot{suffix}.png"
    html_path = output_dir / f"page{suffix}.html"

    try:
        page.screenshot(path=str(ss_path), full_page=True)
        print(f"  [DEBUG] スクリーンショット保存: {ss_path}", flush=True)
    except Exception as e:
        print(f"  [DEBUG] スクリーンショット保存失敗: {e}", flush=True)

    try:
        html_content = page.content()
        html_path.write_text(html_content, encoding="utf-8")
        print(f"  [DEBUG] HTML保存: {html_path}  ({len(html_content)} bytes)", flush=True)
    except Exception as e:
        print(f"  [DEBUG] HTML保存失敗: {e}", flush=True)


# ==================== コンテンツ変換 ====================

def blocks_to_html(blocks: list) -> str:
    parts = []
    for b in blocks:
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
            text_html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', _escape(text))
            parts.append(f'<p>{text_html}</p>')
    return "\n".join(parts)


def _escape(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ==================== Playwright 操作 ====================

def _find_visible(page, selectors: list):
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if el.is_visible(timeout=1000):
                return sel
        except Exception:
            pass
    return None


def _fill_first(page, selectors: list, value: str, label: str) -> str:
    """セレクタ候補を順に試して最初に見つかった入力欄に値をセット。使用したセレクタを返す。"""
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if loc.is_visible(timeout=2000):
                loc.fill(value)
                return sel
        except Exception:
            pass
    raise RuntimeError(f"{label} の入力欄が見つかりませんでした。試したセレクタ: {selectors}")


# ==================== 各ステップ関数 ====================

def do_login(page, output_dir: Path, email: str, password: str) -> None:
    # STEP 1
    page.goto(f"{NOTE_URL}/login", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=15000)
    step(1, f"noteログインページ到達: {page.url}")

    # STEP 2
    email_sel = _fill_first(page, [
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="メール"]',
        'input[placeholder*="mail"]',
        'input[placeholder*="note ID"]',
        'input[name="identifier"]',
        'form input:first-of-type',
    ], email, "メールアドレス")
    step(2, f"メールアドレス入力成功 (selector: {email_sel})")

    # STEP 3
    pass_sel = _fill_first(page, [
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="パスワード"]',
        'input[placeholder*="password"]',
    ], password, "パスワード")
    step(3, f"パスワード入力成功 (selector: {pass_sel})")

    # STEP 4
    login_btn_selectors = [
        'button[type="submit"]',
        'button:has-text("ログイン")',
        'input[type="submit"]',
    ]
    btn = _find_visible(page, login_btn_selectors)
    if not btn:
        save_debug_artifacts(page, output_dir, "login-no-button")
        raise RuntimeError("ログインボタンが見つかりません")
    page.click(btn)
    step(4, f"ログインボタンクリック (selector: {btn})")

    try:
        page.wait_for_url(f"{NOTE_URL}/**", timeout=30000)
    except PWTimeout:
        info("wait_for_url タイムアウト（続行）")

    page.wait_for_load_state("networkidle", timeout=15000)

    # STEP 5
    current = page.url
    step(5, f"ログイン後URL: {current}")

    if "/login" in current:
        err_text = ""
        for err_sel in [
            '[class*="error"]', '[class*="Error"]',
            '[role="alert"]', '.o-error', 'p.error',
        ]:
            try:
                el = page.locator(err_sel).first
                if el.is_visible(timeout=500):
                    err_text = el.inner_text().strip()
                    break
            except Exception:
                pass
        save_debug_artifacts(page, output_dir, "login-failed")
        raise RuntimeError(
            f"ログイン失敗: まだログインページにいます。"
            f" URL={current}  エラー文={err_text or '（取得できず）'}"
        )

    info("ログイン成功")


def do_navigate_new(page, output_dir: Path) -> None:
    page.goto(f"{NOTE_URL}/notes/new", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=20000)
    time.sleep(2)
    current = page.url
    # /notes/new にリダイレクトされず /login になった場合を検知
    if "/login" in current:
        save_debug_artifacts(page, output_dir, "new-note-redirect-login")
        raise RuntimeError(f"新規記事ページへの遷移でログインにリダイレクトされました: {current}")
    step(6, f"新規記事ページ到達: {current}")


def do_input_title(page, output_dir: Path, title: str) -> None:
    sel = _find_visible(page, TITLE_SELECTORS)
    if not sel:
        save_debug_artifacts(page, output_dir, "title-not-found")
        raise RuntimeError(f"タイトル欄が見つかりません。試したセレクタ: {TITLE_SELECTORS}")
    page.click(sel)
    page.evaluate(f'''() => {{
        const el = document.querySelector({json.dumps(sel)});
        if (el) {{ el.textContent = ""; }}
    }}''')
    page.keyboard.type(title, delay=20)
    step(7, f"タイトル入力成功 (selector: {sel})  値: {title[:40]}")


def do_input_body(page, output_dir: Path, html_body: str) -> None:
    sel = _find_visible(page, BODY_SELECTORS)
    if not sel:
        save_debug_artifacts(page, output_dir, "body-not-found")
        raise RuntimeError(f"本文欄が見つかりません。試したセレクタ: {BODY_SELECTORS}")

    page.click(sel)
    time.sleep(0.5)

    success = page.evaluate(f'''(html) => {{
        const el = document.querySelector({json.dumps(sel)});
        if (!el) return false;
        el.focus();
        document.execCommand("selectAll", false, null);
        return document.execCommand("insertHTML", false, html);
    }}''', html_body)
    info(f"insertHTML 結果: {success}")

    if not success:
        info("insertHTML 失敗 → クリップボード経由でフォールバック")
        page.evaluate(f'''async (html) => {{
            const blob = new Blob([html], {{type: "text/html"}});
            const item = new ClipboardItem({{"text/html": blob}});
            await navigator.clipboard.write([item]);
        }}''', html_body)
        page.keyboard.press("Control+a")
        page.keyboard.press("Control+v")

    time.sleep(1)
    step(8, f"本文入力成功 (selector: {sel})  HTML長: {len(html_body)} chars")


def do_upload_eyecatch(page, output_dir: Path, image_path: Path) -> None:
    if not image_path.exists():
        warn(f"アイキャッチ画像が存在しません（スキップ）: {image_path}")
        return

    for sel in EYECATCH_SELECTORS:
        try:
            if page.locator(sel).count() > 0:
                page.locator(sel).first.set_input_files(str(image_path))
                time.sleep(2)
                step(9, f"アイキャッチアップロード成功 (selector: {sel})")
                return
        except Exception as e:
            info(f"eyecatch selector '{sel}' 失敗: {e}")

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
                step(9, f"アイキャッチアップロード成功（ボタン経由: {btn}）")
                return
        except Exception as e:
            info(f"eyecatch button '{btn}' 失敗: {e}")

    warn("アイキャッチアップロードボタンが見つかりません（スキップ）")
    step(9, "アイキャッチアップロード: スキップ（ボタン未検出）")


def do_save_draft(page, output_dir: Path) -> str:
    sel = _find_visible(page, SAVE_DRAFT_SELECTORS)
    if sel:
        page.click(sel)
        step(10, f"下書き保存ボタンクリック (selector: {sel})")
    else:
        info("下書き保存ボタン未検出 → Ctrl+S フォールバック")
        page.keyboard.press("Control+s")
        step(10, "下書き保存ボタンクリック: Ctrl+S フォールバック使用")

    time.sleep(3)

    url = page.url
    step(11, f"保存後URL: {url}")

    if "/login" in url:
        save_debug_artifacts(page, output_dir, "after-save-login")
        raise RuntimeError(f"下書き保存後にログインページへリダイレクトされました: {url}")

    return url


def do_quality_check(page, url: str, content: dict) -> dict:
    result = {
        "url":      url,
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
        result["h2"]       = "<h2" in html
        result["h3"]       = "<h3" in html
        result["bold"]     = "<strong" in html or "<b>" in html
        result["cta"]      = "LINE" in html or "魂の現在地" in html
        result["eyecatch"] = 'og:image' in html or '<img' in html
    except Exception as e:
        warn(f"品質チェック中にエラー: {e}")
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

    content   = json.loads(content_path.read_text(encoding="utf-8"))
    title     = content.get("title", "（タイトルなし）")
    body_html = blocks_to_html(content.get("body_blocks", []))
    eyecatch  = output_dir / "images" / "eyecatch.png"

    info(f"対象ディレクトリ: {output_dir}")
    info(f"タイトル: {title[:50]}")
    info(f"本文HTML長: {len(body_html)} chars")
    info(f"アイキャッチ: {eyecatch}  存在={eyecatch.exists()}")

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
            do_login(page, output_dir, email, password)
            do_navigate_new(page, output_dir)
            do_input_title(page, output_dir, title)
            do_input_body(page, output_dir, body_html)
            do_upload_eyecatch(page, output_dir, eyecatch)
            draft_url = do_save_draft(page, output_dir)

            info("品質チェック中...")
            qc = do_quality_check(page, draft_url, content)
            print_quality_report(qc)

            return draft_url

        except Exception as e:
            save_debug_artifacts(page, output_dir, "error")
            raise RuntimeError(f"note 投稿失敗: {e}") from e

        finally:
            browser.close()


def print_quality_report(qc: dict) -> None:
    print("\n  ── 品質チェック結果 ──────────────────")
    checks = [
        ("タイトル反映",     qc["title"]),
        ("H2 反映",         qc["h2"]),
        ("H3 反映",         qc["h3"]),
        ("太字反映",         qc["bold"]),
        ("CTA 反映",        qc["cta"]),
        ("アイキャッチ反映", qc["eyecatch"]),
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

    # STEP 12
    url_file = output_dir / "draft-url.txt"
    url_file.write_text(draft_url, encoding="utf-8")
    step(12, f"draft-url.txt 保存完了: {url_file}")
    print(f"  ✓ 下書きURL: {draft_url}")


if __name__ == "__main__":
    main()
