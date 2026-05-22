#!/usr/bin/env python3
"""
generate_stella.py
Google Gemini API で Stella 記事を1本生成する（無料枠対応）。
GitHub Actions から `python3 scripts/generate_stella.py --article N` で呼び出す。
"""

import argparse
import os
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

import google.generativeai as genai

JST = timezone(timedelta(hours=9))


def read_file(path: str) -> str:
    p = Path(path)
    return p.read_text(encoding='utf-8') if p.exists() else ''


def get_used_themes() -> str:
    output_dir = Path('stella/content/output')
    if not output_dir.exists():
        return 'なし'
    dirs = sorted(d.name for d in output_dir.iterdir() if d.is_dir())
    return '\n'.join(dirs) if dirs else 'なし'


def extract_section(text: str, marker: str) -> str:
    pattern = rf'<<<{marker}>>>(.*?)<<</{marker}>>>'
    m = re.search(pattern, text, re.DOTALL)
    return m.group(1).strip() if m else ''


def generate(article_num: int) -> dict:
    wisdom  = read_file('stella/knowledge-base/synthesis/wisdom-core.md')[:3000]
    columns = read_file('stella/knowledge-base/synthesis/columns-essence.md')[:2000]
    cta     = read_file('stella/core/cta-templates.md')
    used    = get_used_themes()

    prompt = f"""あなたはステラ（Stella）というスピリチュアルキャラクター（男性）のコンテンツを生成するエージェントです。

## 知識ベース: wisdom-core.md（抜粋）
{wisdom}

## 知識ベース: columns-essence.md（抜粋）
{columns}

## CTAテンプレート
{cta}

## 既存テーマ一覧（重複厳禁）
{used}

## キャラクター設定（厳守）
- 名前: ステラ（男性） / 一人称: 私 / 読者: あなた
- 語尾: 〜ですね / 〜なのです
- 講師名・コース名・固有メソッド名は一切使わない（「かつての賢者」等で匿名化）
- 比喩変換: 潜在意識→心の深海 / 波動→内側の周波数 / カルマ→魂の記憶 / ハイヤーセルフ→本来の自分
- 疑問形33%以上 / 恐怖→希望の流れで構成

## 生成指示

既存テーマと重複しない新テーマを1つ選び、以下5ファイル分の内容を生成してください。
必ず各セクションを <<<タグ>>> と <<</タグ>>> で囲んで出力してください。

<<<theme>>>
theme: [テーマ名（日本語）]
slug: [ローマ字ハイフン区切り（例: tamashii-no-shinka）]
title: [最終タイトル（25字以内）]
<<</theme>>>

<<<note>>>
[note.md全文 1500〜2000字]
構成:
1. つかみ（150字）: 読者の悩みへの共感、疑問形で始める
2. 問題の本質（300字）: 多次元統合ロジック（行動の季節/受容の季節）で解説
3. 教えのエッセンス（600字）: 知識ベースをステラ口調に統合
4. 季節の診断（300字）: 読者が行動の季節か受容の季節かを診断
5. 具体的なアクション（300字）: 今日からできる実践3つ
6. まとめ（150字）: 希望・光で締める
7. CTA-Aをそのまま末尾に挿入
<<</note>>>

<<<voice>>>
[voice.md全文 900〜1500字]
構成: オープニング→内的葛藤の描写→気づきの瞬間→解放→実践ワーク→CTA-C
[感情:穏やか]等の感情タグと（間）を適切に挿入。
末尾に収録メモ（推奨トーン・注意点）を付ける。
<<</voice>>>

<<<note_meta>>>
[note-meta.md全文]
タイトル案3つ（各25字以内）＋ハッシュタグ10個＋投稿推奨時間・カテゴリ
<<</note_meta>>>

<<<spotify_meta>>>
[spotify-meta.md全文]
エピソードタイトル（30字以内）＋説明文（150字）＋カテゴリ・タグ
<<</spotify_meta>>>

<<<sources>>>
[sources.md全文]
使用した知識ベースの箇所・選定テーマとキーワード一覧
<<</sources>>>
"""

    print('  Gemini API にリクエスト送信中...')
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    text = response.text

    theme_block = extract_section(text, 'theme')

    def pick(pattern: str) -> str:
        m = re.search(pattern, theme_block)
        return m.group(1).strip() if m else ''

    return {
        'theme':        pick(r'theme:\s*(.+)') or f'テーマ{article_num}',
        'slug':         pick(r'slug:\s*(.+)')  or f'article-{article_num}',
        'title':        pick(r'title:\s*(.+)') or '無題',
        'note':         extract_section(text, 'note'),
        'voice':        extract_section(text, 'voice'),
        'note_meta':    extract_section(text, 'note_meta'),
        'spotify_meta': extract_section(text, 'spotify_meta'),
        'sources':      extract_section(text, 'sources'),
    }


def save(data: dict) -> str:
    now = datetime.now(JST)
    dir_name = f"{now.strftime('%Y%m%d-%H%M%S')}__{data['slug']}"
    out = Path('stella/content/output') / dir_name
    out.mkdir(parents=True, exist_ok=True)

    (out / 'note.md').write_text(data['note'], encoding='utf-8')
    (out / 'voice.md').write_text(data['voice'], encoding='utf-8')
    (out / 'note-meta.md').write_text(data['note_meta'], encoding='utf-8')
    (out / 'spotify-meta.md').write_text(data['spotify_meta'], encoding='utf-8')
    (out / 'sources.md').write_text(data['sources'], encoding='utf-8')
    return dir_name


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--article', type=int, default=1)
    args = parser.parse_args()

    api_key = os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        raise SystemExit('ERROR: GOOGLE_API_KEY が設定されていません。\n'
                         'GitHub の 設定 > シークレットと変数 > Actions で設定してください。')

    genai.configure(api_key=api_key)

    print(f'\n{"="*50}')
    print(f'  記事 {args.article} 生成開始')
    print(f'{"="*50}')

    data = generate(args.article)
    dir_name = save(data)

    print(f'  ✓ テーマ  : {data["theme"]}')
    print(f'  ✓ タイトル: {data["title"]}')
    print(f'  ✓ 出力先  : stella/content/output/{dir_name}/')
    print(f'{"="*50}\n')


if __name__ == '__main__':
    main()
