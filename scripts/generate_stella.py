#!/usr/bin/env python3
"""
generate_stella.py v2
全素材ファイルを正しく活用してステラ記事を生成する。
品質チェック（70点以上）付き。
GitHub Actions から: python3 scripts/generate_stella.py --article N
"""

import argparse
import os
import re
import requests
from datetime import datetime, timezone, timedelta
from pathlib import Path

JST = timezone(timedelta(hours=9))
CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
CLAUDE_MODEL   = 'claude-haiku-4-5-20251001'

# 固有名詞チェック用（記事に残してはいけない名前）
FORBIDDEN_WORDS = [
    '石崎', '小野寺', '大野靖志', '山本', '山本時嗣',
    'ザ・ワープ', 'エンペラーコード', 'ユニバーサルコード', 'Gコード',
    'ユニバーサルコード', 'あまとわ',
]

# テーマ→関連キーワードのマッピング
THEME_KEYWORDS = {
    '魂': ['魂', '霊', '輪廻', '本来の自分', '五魂', '不滅'],
    'お金': ['お金', '豊か', '金運', '富', '経済', '財'],
    '引き寄せ': ['引き寄せ', '磁場', '潜在意識', '心の深海', '欠乏', '現実'],
    '人間関係': ['人間関係', '縁', '恋愛', '家族', '出会い', '赤い糸'],
    '運気': ['運気', '浄化', '祓い', '波動', 'エネルギー', '念'],
    '使命': ['使命', '目的', '日本', '大和', 'ハイヤーセルフ', '本来の自分'],
    '瞑想': ['瞑想', '直感', '静か', '内側', '中今', '今'],
    '先祖': ['先祖', '霊界', '死後', 'ご先祖', '守護'],
    '逆境': ['逆境', '試練', '悪運', 'ついていない', '軌道修正'],
    '自己成長': ['エゴ', '変容', '成長', '手放す', '自己', '変化'],
    '言霊': ['言霊', '言葉', '祝詞', 'ことだま', '創造'],
    '季節': ['季節', '行動', '受容', '春', '夏', '秋', '冬', 'フェーズ'],
}


# ==================== 素材読み込み ====================

# 読み込みから除外するファイル名（ログ・インデックス系）
EXCLUDE_FILES = {'_fetch_log.txt', 'README.md'}

def load_all_sources() -> dict:
    """
    stella/knowledge-base/ 以下の全ファイルを再帰的に読み込む。
    .md と .txt を対象。今後ファイルを追加すれば自動的に対象に入る。
    """
    sources = {}
    kb_dir = Path('stella/knowledge-base')

    if not kb_dir.exists():
        print('  [警告] stella/knowledge-base/ が見つかりません')
        return sources

    for f in sorted(kb_dir.rglob('*')):
        if not f.is_file():
            continue
        if f.name in EXCLUDE_FILES:
            continue
        if f.suffix not in ('.md', '.txt'):
            continue

        try:
            content = f.read_text(encoding='utf-8', errors='ignore')
            if len(content.strip()) < 50:
                continue
            # キーとしてフォルダ名+ファイル名を使う（重複防止）
            key = f'{f.parent.name}/{f.stem}'
            sources[key] = content
            print(f'  [素材] {f.parent.name}/{f.name}: {len(content)}文字')
        except Exception as e:
            print(f'  [スキップ] {f.name}: {e}')

    return sources


def extract_relevant_chunks(theme: str, sources: dict, max_chars: int = 6000) -> str:
    """テーマに関連するチャンクを全素材から抽出する"""

    # キーワード収集
    expanded_keywords = set([theme])
    for key, words in THEME_KEYWORDS.items():
        if key in theme:
            expanded_keywords.update(words)
    # テーマの個別単語も追加
    for word in re.split(r'[　・\s]', theme):
        if len(word) > 1:
            expanded_keywords.add(word)

    scored = []
    for source_name, content in sources.items():
        paragraphs = content.split('\n\n')
        for para in paragraphs:
            para = para.strip()
            if len(para) < 60:
                continue
            score = sum(1 for kw in expanded_keywords if kw in para)
            if score > 0:
                scored.append((score, source_name, para))

    scored.sort(key=lambda x: -x[0])

    result_parts = []
    total_chars = 0
    seen = set()

    for score, source_name, para in scored:
        if total_chars >= max_chars:
            break
        key = para[:50]
        if key in seen:
            continue
        seen.add(key)
        result_parts.append(f'[出典: {source_name}]\n{para}')
        total_chars += len(para)

    if not result_parts:
        # マッチなし → wisdom-core の先頭を使う
        wisdom = sources.get('wisdom-core', '')
        return wisdom[:3000] if wisdom else '（関連素材なし）'

    return '\n\n---\n\n'.join(result_parts)


# ==================== テーマ管理 ====================

def get_used_themes() -> set:
    output_dir = Path('stella/content/output')
    if not output_dir.exists():
        return set()
    return {d.name for d in output_dir.iterdir() if d.is_dir()}


def get_available_themes(sources: dict) -> str:
    """videos-themes.md からテーマ一覧を取得"""
    content = sources.get('videos-themes', '')
    if not content:
        return ''
    lines = []
    for line in content.split('\n'):
        if line.startswith('## テーマ'):
            lines.append(line.replace('## ', '').strip())
    return '\n'.join(lines)


# ==================== Claude API ====================

def call_gemini(api_key: str, prompt: str) -> str:
    """Anthropic Claude API を呼び出す（関数名は互換性のため維持）"""
    headers = {
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
    }
    body = {
        'model': CLAUDE_MODEL,
        'max_tokens': 8000,
        'temperature': 0.9,
        'messages': [{'role': 'user', 'content': prompt}],
    }
    resp = requests.post(CLAUDE_API_URL, headers=headers, json=body, timeout=120)
    if not resp.ok:
        print(f'[ERROR] Claude API: HTTP {resp.status_code}')
        print(f'[ERROR] {resp.text[:500]}')
        resp.raise_for_status()

    data = resp.json()
    content = data.get('content', [])
    if not content:
        raise ValueError(f'Claude: contentが空 -> {data}')

    return content[0]['text']


# ==================== ブロックパーサー ====================

def parse_note_to_blocks(text: str) -> list:
    """note.md テキストをブロック配列にパース（note エディタ用）"""
    blocks = []
    lines = text.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if line.startswith('## '):
            blocks.append({'type': 'h2', 'text': line[3:].strip()})
        elif line.startswith('### '):
            blocks.append({'type': 'h3', 'text': line[4:].strip()})
        elif stripped.startswith('━') or stripped == '---':
            blocks.append({'type': 'separator'})
        elif line.startswith('- '):
            items = [line[2:].strip()]
            while i + 1 < len(lines) and lines[i + 1].startswith('- '):
                i += 1
                items.append(lines[i][2:].strip())
            blocks.append({'type': 'list', 'items': items})
        elif line.startswith('> '):
            blocks.append({'type': 'quote', 'text': line[2:].strip()})
        elif stripped.startswith('**') and stripped.endswith('**') and len(stripped) > 4:
            blocks.append({'type': 'bold', 'text': stripped[2:-2]})
        elif stripped:
            # **太字** がインラインで混じる段落もそのまま保持
            blocks.append({'type': 'paragraph', 'text': stripped})

        i += 1
    return blocks


def extract_tags(note_meta: str) -> list:
    """note-meta テキストからハッシュタグを抽出"""
    import re
    tags = re.findall(r'#([^\s#　]+)', note_meta)
    return tags[:10]


def save_content_json(data: dict, out_dir: Path) -> None:
    """note 投稿用の構造化 JSON を保存"""
    blocks = parse_note_to_blocks(data.get('note', ''))
    tags = extract_tags(data.get('note_meta', ''))

    # つかみ段落をリードとして抽出（先頭 paragraph ブロック）
    lead = ''
    for b in blocks:
        if b.get('type') == 'paragraph':
            lead = b['text']
            break

    content = {
        'title': data.get('title', ''),
        'catch_copy': data.get('theme', ''),
        'lead': lead,
        'body_blocks': blocks,
        'cta': data.get('note', ''),   # CTA-A はブロック内に含まれる
        'tags': tags,
        'quality_score': data.get('quality_score', 0),
        'slug': data.get('slug', ''),
    }
    (out_dir / 'content.json').write_text(
        __import__('json').dumps(content, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )


# ==================== 品質チェック ====================

def check_quality(note_text: str) -> tuple:
    """品質チェック（100点満点）"""
    issues = []
    score = 100

    # ① ステラ語尾
    if 'ですね' not in note_text and 'なのです' not in note_text:
        score -= 20
        issues.append('ステラ語尾（ですね/なのです）が不足')

    # ② 固有名詞
    for word in FORBIDDEN_WORDS:
        if word in note_text:
            score -= 15
            issues.append(f'固有名詞が残っている: {word}')

    # ③ 文字数
    char_count = len(note_text)
    if char_count < 1200:
        score -= 20
        issues.append(f'文字数不足: {char_count}字（1500〜2000字推奨）')
    elif char_count > 3000:
        score -= 10
        issues.append(f'文字数超過: {char_count}字（2000字以下推奨）')

    # ④ CTA
    if 'LINE' not in note_text:
        score -= 15
        issues.append('LINE CTAが挿入されていない')

    # ⑤ 疑問形
    question_count = note_text.count('か？') + note_text.count('でしょうか') + note_text.count('ませんか')
    if question_count < 2:
        score -= 10
        issues.append(f'疑問形が少ない: {question_count}個（2個以上推奨）')

    return max(0, score), issues


# ==================== セクション抽出 ====================

def extract_section(text: str, marker: str) -> str:
    pattern = rf'<<<{marker}>>>(.*?)<<</{marker}>>>'
    m = re.search(pattern, text, re.DOTALL)
    if m:
        return m.group(1).strip()
    # タグ閉じがスラッシュなしのパターンも試す
    pattern2 = rf'<<<{marker}>>>(.*?)<<<{marker}>>>'
    m2 = re.search(pattern2, text, re.DOTALL)
    return m2.group(1).strip() if m2 else ''


# ==================== メイン生成 ====================

def select_theme(api_key: str, sources: dict, used_themes: set) -> tuple:
    """Geminiにテーマを選ばせる"""
    available = get_available_themes(sources)
    used_list = '\n'.join(sorted(used_themes)) if used_themes else 'なし'

    prompt = f"""あなたはステラというスピリチュアルキャラクターのコンテンツエージェントです。

## 利用可能なテーマ一覧（動画209本より）
{available}

## 使用済みテーマ（重複禁止）
{used_list}

## 指示
上記から未使用のテーマを1つ選び、以下のフォーマットのみで出力してください。

<<<theme>>>
theme: [テーマ名（日本語）]
slug: [ローマ字ハイフン区切り（例: tamashii-no-shinka）]
<<</theme>>>
"""
    text = call_gemini(api_key, prompt)
    block = extract_section(text, 'theme')

    def pick(pattern):
        m = re.search(pattern, block)
        return m.group(1).strip() if m else ''

    theme = pick(r'theme:\s*(.+)') or 'テーマ不明'
    slug = pick(r'slug:\s*(.+)') or 'article'
    return theme, slug


def generate_article(api_key: str, theme: str, relevant_material: str, cta: str) -> tuple:
    """記事生成（品質チェックループ・最大3回）"""

    prompt = f"""あなたはステラ（Stella）というスピリチュアルキャラクター（男性）のコンテンツエージェントです。

## キャラクター設定（厳守）
- 名前: ステラ / 一人称: 私 / 読者: あなた
- 語尾: 〜ですね / 〜なのです（必ず使う）
- 講師名・コース名・プログラム名は一切出さない（「かつての賢者」等で匿名化）
- 比喩変換（必須）:
  - 潜在意識 → 心の深海
  - 波動・エネルギー → 内側の周波数
  - カルマ → 魂の記憶
  - ハイヤーセルフ → 本来の自分
- 疑問形を2個以上含める
- 恐怖→希望の流れで構成

## 今日のテーマ
{theme}

## 参考素材（これをベースに書く・固有名詞は必ず変換）
{relevant_material}

## CTAテンプレート（末尾に必ず挿入）
{cta[:600]}

---

以下5セクションを <<<タグ>>> と <<</タグ>>> で囲んで出力してください。

<<<note>>>
[note.md 1500〜2000字]
1. つかみ（150字）: 読者の悩みへの共感、疑問形で始める
2. 問題の本質（300字）: 行動の季節/受容の季節の多次元統合ロジックで解説
3. 教えのエッセンス（600字）: 参考素材をステラ口調に変換して統合
4. 季節の診断（300字）: 読者が行動の季節か受容の季節かを診断
5. 具体的なアクション（300字）: 今日からできる実践3つ
6. まとめ（150字）: 希望・光で締める
7. CTA-Aをそのまま末尾に挿入
<<</note>>>

<<<voice>>>
[voice.md 900〜1500字]
内的葛藤→気づき→解放のストーリー構成
[感情:穏やか]等の感情タグと（間）を適切に挿入
末尾にCTA-C＋収録メモ（推奨トーン・注意点）
<<</voice>>>

<<<note_meta>>>
タイトル案3つ（各25字以内）＋ハッシュタグ10個＋投稿推奨時間・カテゴリ
<<</note_meta>>>

<<<spotify_meta>>>
エピソードタイトル（30字以内）＋説明文（150字）＋カテゴリ・タグ
<<</spotify_meta>>>

<<<sources>>>
使用した素材の出典＋固有名詞の変換記録
<<</sources>>>
"""

    best_text = None
    best_score = 0
    best_issues = []

    for attempt in range(1, 4):
        print(f'  生成中... (試行{attempt}/3)')
        raw = call_gemini(api_key, prompt)
        note = extract_section(raw, 'note')

        if not note:
            print(f'  [警告] noteセクション取得失敗 (試行{attempt})')
            continue

        score, issues = check_quality(note)
        print(f'  品質スコア: {score}点')
        for issue in issues:
            print(f'    - {issue}')

        if score > best_score:
            best_score = score
            best_text = raw
            best_issues = issues

        if score >= 70:
            print(f'  ✓ 品質チェック合格')
            break

        if attempt < 3:
            print(f'  品質不足 → 再生成...')

    if best_text is None:
        raise ValueError('記事生成に失敗しました（3回試行）')

    return best_text, best_score


def generate(api_key: str, article_num: int, sources: dict, cta: str) -> dict:
    used_themes = get_used_themes()

    # テーマ選定
    print('  テーマ選定中...')
    theme, slug = select_theme(api_key, sources, used_themes)
    print(f'  選定テーマ: {theme}')

    # 関連素材抽出
    print('  関連素材を抽出中...')
    relevant_material = extract_relevant_chunks(theme, sources, max_chars=6000)
    chunk_count = relevant_material.count('[出典:')
    print(f'  抽出チャンク: {chunk_count}件')

    # 記事生成
    raw, score = generate_article(api_key, theme, relevant_material, cta)

    return {
        'theme':        theme,
        'slug':         slug,
        'title':        theme,
        'note':         extract_section(raw, 'note'),
        'voice':        extract_section(raw, 'voice'),
        'note_meta':    extract_section(raw, 'note_meta'),
        'spotify_meta': extract_section(raw, 'spotify_meta'),
        'sources':      extract_section(raw, 'sources'),
        'quality_score': score,
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
    (out / 'images').mkdir(exist_ok=True)
    save_content_json(data, out)

    return dir_name


# ==================== TEST MODE ====================

def generate_test_data(article_num: int) -> dict:
    """
    TEST_MODE=true のとき API を一切呼ばずに固定サンプルデータを返す。
    note 投稿・アイキャッチ生成の動作確認用。
    """
    theme = f'テスト記事{article_num}：魂の目覚めと季節の変わり目'
    slug  = f'test-tamashii-mezame-{article_num:02d}'

    note = f"""# {theme}

あなたは今、何かが変わり始めていると感じていませんか？

## 問題の本質

多くの人が「なぜうまくいかないのか」と悩んでいますね。それは行動の量の問題ではなく、内側の周波数が現実とずれているからなのです。

### 行動の季節と受容の季節

人の魂には、大きく分けて二つの季節があります。**行動の季節**と**受容の季節**です。

## 教えのエッセンス

かつての賢者はこう説いていました——「流れに逆らう魚は、流れを知らない魚よりも疲れる」と。

心の深海の奥底では、あなたはすでに答えを知っているのです。

- 今の自分を受け入れること
- 焦りを手放すこと
- 本来の自分の声に耳を傾けること

## 季節の診断

あなたは今、どちらの季節にいるのでしょうか？

> 何かを一生懸命やっているのに結果が出ない、という感覚があるなら、それは「受容の季節」のサインかもしれませんね。

## 具体的なアクション

今日からできる実践を三つお伝えします。

1. 朝、目覚めたとき「今日も魂の記憶に従って生きる」と静かに宣言する
2. 「できない」という言葉を「まだ」に変える
3. 夜、一つだけ「今日の小さな光」を思い出してから眠る

## まとめ

あなたの人生に、光が差し込んでいますね。それはあなた自身が発している光なのです。

━━━━━━━━━━━━━━━━━━━━
✨ 今のあなたに、届けたいものがあります

「魂の現在地診断」——5つの問いに答えるだけで、
今のあなたがどの「季節」にいるのかを
静かにお届けします。

完全無料です。

▼ 受け取る
[LINE登録リンク]
━━━━━━━━━━━━━━━━━━━━
"""

    voice = f"""[感情:穏やか]

こんにちは、ステラです。（間）

今日は「{theme}」についてお話しします。

[感情:共感]

あなたは今、変化の入り口に立っているのかもしれませんね。（間）

それは、とても大切なサインなのです。

[感情:穏やか]

今日の実践です。心を静かにして、ゆっくり深呼吸してください。

━ 収録メモ ━
推奨トーン：穏やか・ゆっくり
推奨BPM：90
注意点：読点で0.5秒、（間）で1.5秒のポーズ
"""

    note_meta = f"""# タイトル案
1. 魂が目覚める瞬間——変化の季節に気づくとき
2. うまくいかないのは「季節」のせいかもしれませんね
3. 心の深海からのメッセージ：今あなたに必要なこと

# ハッシュタグ
#スピリチュアル #魂 #引き寄せ #自己成長 #開運 #波動 #潜在意識 #人生 #癒し #ステラ

# 投稿設定
- 推奨投稿時間: 朝7時〜9時
- カテゴリ: スピリチュアル・自己啓発
"""

    spotify_meta = f"""# エピソードタイトル（30字以内）
魂の目覚め——季節の変わり目に

# 説明文（150字）
変化を感じているあなたへ。魂には「行動の季節」と「受容の季節」があります。今あなたがどちらの季節にいるのか、ステラと一緒に確かめてみませんか。

# カテゴリ・タグ
カテゴリ: スピリチュアル
タグ: 魂, 引き寄せ, 自己成長
"""

    sources = f"""# 使用素材（TEST MODE）

このファイルはテストモードで生成された固定サンプルです。
実際の素材ファイルは使用していません。

# 固有名詞変換記録
なし（テストデータのため）

# 品質スコア
100点（テストデータのため満点固定）
"""

    return {
        'theme':         theme,
        'slug':          slug,
        'title':         theme,
        'note':          note.strip(),
        'voice':         voice.strip(),
        'note_meta':     note_meta.strip(),
        'spotify_meta':  spotify_meta.strip(),
        'sources':       sources.strip(),
        'quality_score': 100,
    }


# ==================== メイン ====================

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--article', type=int, default=1)
    args = parser.parse_args()

    test_mode = os.environ.get('TEST_MODE', '').lower() == 'true'

    print(f'\n{"="*50}')
    if test_mode:
        print(f'  ステラ記事生成 v2 - 記事{args.article} [TEST MODE]')
    else:
        print(f'  ステラ記事生成 v2 - 記事{args.article}')
    print(f'{"="*50}')

    if test_mode:
        print('  [TEST MODE] API を呼ばずに固定サンプルデータを生成します')
        data = generate_test_data(args.article)
    else:
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if not api_key:
            raise SystemExit(
                'ERROR: ANTHROPIC_API_KEY が未設定\n'
                'GitHub の Settings → Secrets and variables → Actions で設定してください。'
            )
        print('\n  [1] 素材ファイル読み込み中...')
        sources = load_all_sources()
        print(f'  → {len(sources)}ファイル読み込み完了')
        cta = Path('stella/core/cta-templates.md').read_text(encoding='utf-8')
        data = generate(api_key, args.article, sources, cta)

    dir_name = save(data)

    print(f'\n  ✓ テーマ    : {data["theme"]}')
    print(f'  ✓ 品質スコア: {data["quality_score"]}点')
    print(f'  ✓ 出力先    : stella/content/output/{dir_name}/')
    print(f'{"="*50}\n')


if __name__ == '__main__':
    main()
