#!/usr/bin/env python3
"""Build static site from Stella note.md files."""

import re
import subprocess
from pathlib import Path

PATTERN = re.compile(r'(\d{4})(\d{2})(\d{2})-\d{6}__(.*)')

STYLE = """
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Hiragino Kaku Gothic Pro', 'Noto Sans JP', 'Yu Gothic', sans-serif;
  background: #faf9f7; color: #2d2d2d; line-height: 1.9;
}
.container { max-width: 740px; margin: 0 auto; padding: 24px 20px; }
header {
  text-align: center; padding: 56px 0 40px;
  border-bottom: 1px solid #e8e4df; margin-bottom: 40px;
}
header h1 { font-size: 2rem; color: #7b6ea0; letter-spacing: 0.15em; }
header p { color: #aaa; margin-top: 10px; font-size: 0.95rem; letter-spacing: 0.05em; }
.article-list { list-style: none; }
.article-list li { padding: 22px 0; border-bottom: 1px solid #eeebe6; }
.article-list .date { font-size: 0.82rem; color: #bbb; margin-bottom: 6px; }
.article-list a { text-decoration: none; color: #2d2d2d; font-size: 1.05rem; font-weight: 500; }
.article-list a:hover { color: #7b6ea0; }
.back-link {
  display: inline-block; margin-bottom: 36px;
  color: #7b6ea0; text-decoration: none; font-size: 0.9rem;
}
.back-link:hover { text-decoration: underline; }
.article-body h1 { font-size: 1.45rem; line-height: 1.6; margin-bottom: 32px; color: #1e1e1e; }
.article-body h2 {
  font-size: 1.05rem; color: #7b6ea0;
  margin: 36px 0 14px; padding-bottom: 6px;
  border-bottom: 1px solid #e0daf5;
}
.article-body p { margin-bottom: 18px; }
.article-body hr { border: none; border-top: 1px solid #e8e4df; margin: 28px 0; }
.article-body blockquote {
  border-left: 3px solid #c5bcdf; padding: 12px 20px;
  color: #666; margin: 24px 0; background: #f5f3fa;
}
footer {
  text-align: center; padding: 40px 0; margin-top: 56px;
  color: #ccc; font-size: 0.85rem;
  border-top: 1px solid #e8e4df;
}
@media (max-width: 600px) {
  header h1 { font-size: 1.6rem; }
  .article-body h1 { font-size: 1.25rem; }
}
"""

def get_title(content: str) -> str:
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith('# '):
            return stripped[2:].strip()
    return "無題"

def md_to_html(content: str) -> str:
    try:
        import markdown
        return markdown.markdown(
            content,
            extensions=['nl2br', 'sane_lists', 'fenced_code'],
        )
    except ImportError:
        pass
    result = subprocess.run(
        ['pandoc', '-f', 'markdown', '-t', 'html'],
        input=content, capture_output=True, text=True,
    )
    if result.returncode == 0:
        return result.stdout
    escaped = content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return f'<pre style="white-space:pre-wrap">{escaped}</pre>'

def page(title: str, body: str, is_article: bool = False) -> str:
    back = '<a class="back-link" href="../">← 記事一覧</a>' if is_article else ''
    full_title = f'{title} | Stella' if is_article else 'Stella'
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full_title}</title>
<style>{STYLE}</style>
</head>
<body>
<div class="container">
<header>
  <h1>✦ Stella</h1>
  <p>魂の声に耳を澄ませる</p>
</header>
{back}
{body}
<footer>© Stella</footer>
</div>
</body>
</html>"""

def build() -> None:
    site = Path('_site')
    site.mkdir(exist_ok=True)
    articles_dir = site / 'articles'
    articles_dir.mkdir(exist_ok=True)

    articles = []
    output_root = Path('stella/content/output')

    for note_path in sorted(output_root.glob('*/note.md'), reverse=True):
        dir_name = note_path.parent.name
        m = PATTERN.match(dir_name)
        if not m:
            continue
        year, month, day, _ = m.groups()
        date_str = f'{year}/{month}/{day}'

        content = note_path.read_text(encoding='utf-8')
        title = get_title(content)
        html_content = md_to_html(content)

        articles.append({'date': date_str, 'slug': dir_name, 'title': title})

        article_body = f'<div class="article-body">{html_content}</div>'
        (articles_dir / f'{dir_name}.html').write_text(
            page(title, article_body, is_article=True), encoding='utf-8'
        )

    items = '\n'.join(
        f'<li>'
        f'<div class="date">{a["date"]}</div>'
        f'<a href="articles/{a["slug"]}.html">{a["title"]}</a>'
        f'</li>'
        for a in articles
    )
    index_body = f'<ul class="article-list">\n{items}\n</ul>'
    (site / 'index.html').write_text(page('記事一覧', index_body), encoding='utf-8')

    print(f"✓ {len(articles)} 記事をビルドしました → _site/")

if __name__ == '__main__':
    build()
