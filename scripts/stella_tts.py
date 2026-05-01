#!/usr/bin/env python3
"""
stella_tts.py - voice.md を stand.fm 用 MP3 に変換する

使い方:
  python scripts/stella_tts.py                          # 最新のvoice.mdを変換
  python scripts/stella_tts.py --input path/to/voice.md # 指定ファイルを変換
  python scripts/stella_tts.py --all                    # 未変換をすべて変換

必要な環境変数:
  OPENAI_API_KEY=sk-...
"""

import argparse
import os
import re
import sys
from pathlib import Path


def clean_voice_text(text: str) -> str:
    """voice.md から音声合成に不要な制御文字・マークアップを除去する"""
    # [感情:〇〇] タグを除去
    text = re.sub(r'\[感情:[^\]]*\]', '', text)
    # （間）（長い間）等を句点＋改行に変換（自然なポーズ）
    text = re.sub(r'（[^）]*間[^）]*）', '。', text)
    # --- セクション区切りを除去
    text = re.sub(r'\n---+\n', '\n', text)
    # ## 見出しを除去
    text = re.sub(r'^#{1,3}\s+', '', text, flags=re.MULTILINE)
    # 収録メモセクション以降を除去
    text = re.sub(r'【収録メモ】.*', '', text, flags=re.DOTALL)
    text = re.sub(r'---\s*収録メモ.*', '', text, flags=re.DOTALL)
    # 連続する空行を1行に
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def find_latest_voice_md() -> Path:
    """最新の voice.md を返す"""
    output_dir = Path('stella/content/output')
    if not output_dir.exists():
        raise FileNotFoundError('stella/content/output が見つかりません')
    files = sorted(output_dir.glob('*/voice.md'), key=lambda p: p.parent.name, reverse=True)
    if not files:
        raise FileNotFoundError('voice.md が見つかりません')
    return files[0]


def find_unconverted() -> list[Path]:
    """voice.mp3 が存在しない voice.md をすべて返す"""
    output_dir = Path('stella/content/output')
    result = []
    for voice_md in sorted(output_dir.glob('*/voice.md')):
        mp3_path = voice_md.parent / 'voice.mp3'
        if not mp3_path.exists():
            result.append(voice_md)
    return result


def convert_to_mp3(voice_md_path: Path) -> Path:
    """voice.md を読み込み、OpenAI TTS で MP3 に変換して保存する"""
    try:
        from openai import OpenAI
    except ImportError:
        print('openai パッケージをインストールします...')
        os.system(f'{sys.executable} -m pip install openai -q')
        from openai import OpenAI

    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        # .env ファイルを試みる
        env_file = Path('.env')
        if env_file.exists():
            for line in env_file.read_text(encoding='utf-8').splitlines():
                if line.startswith('OPENAI_API_KEY='):
                    api_key = line.split('=', 1)[1].strip().strip('"\'')
                    break
    if not api_key:
        print('ERROR: OPENAI_API_KEY が設定されていません。')
        print('  PowerShell: $env:OPENAI_API_KEY = "sk-..."')
        print('  または .env ファイルに OPENAI_API_KEY=sk-... を記載してください。')
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    raw_text = voice_md_path.read_text(encoding='utf-8')
    clean_text = clean_voice_text(raw_text)
    char_count = len(clean_text)

    output_path = voice_md_path.parent / 'voice.mp3'

    print(f'  変換中: {voice_md_path}')
    print(f'  文字数: {char_count}字 → 約{char_count // 200 + 1}分の音声')

    # OpenAI TTS API 呼び出し
    # shimmer: 柔らかく穏やかな女性の声（ステラのキャラに合う）
    response = client.audio.speech.create(
        model='tts-1-hd',
        voice='shimmer',
        input=clean_text,
        speed=0.95,  # 少しゆっくり目（スピリチュアルコンテンツに合う）
    )

    response.stream_to_file(str(output_path))

    print(f'  ✓ 保存完了: {output_path}')
    return output_path


def main():
    parser = argparse.ArgumentParser(description='voice.md を stand.fm 用 MP3 に変換')
    parser.add_argument('--input', '-i', help='変換する voice.md のパス')
    parser.add_argument('--all', '-a', action='store_true', help='未変換の voice.md をすべて変換')
    args = parser.parse_args()

    if args.all:
        targets = find_unconverted()
        if not targets:
            print('✓ 未変換のファイルはありません。すべて変換済みです。')
            return
        print(f'{len(targets)} 件を変換します...\n')
        for path in targets:
            convert_to_mp3(path)
        print(f'\n✓ {len(targets)} 件の変換が完了しました。')
    else:
        if args.input:
            target = Path(args.input)
            if not target.exists():
                print(f'ERROR: {args.input} が見つかりません')
                sys.exit(1)
        else:
            target = find_latest_voice_md()
            print(f'最新のファイルを使用: {target}\n')
        mp3 = convert_to_mp3(target)
        print(f'\nstand.fm アップロード手順:')
        print(f'  1. stand.fm にログイン')
        print(f'  2. 「収録する」→「音声をアップロード」をクリック')
        print(f'  3. {mp3} を選択してアップロード')
        print(f'  4. {target.parent}/spotify-meta.md のタイトル・説明文を貼り付けて公開')


if __name__ == '__main__':
    main()
