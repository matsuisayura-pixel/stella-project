#!/usr/bin/env python3
"""
stella_tts.py - voice.md を stand.fm 用 MP3 に変換する

【デフォルト】VOICEVOX（無料・インストール不要）
  → 事前に VOICEVOX アプリを起動しておくだけでOK
  → https://voicevox.hiroshiba.jp/ からダウンロード

【有料オプション】OpenAI TTS（高品質）
  → --engine openai で切り替え

使い方:
  python scripts/stella_tts.py                          # 最新のvoice.mdをVOICEVOXで変換
  python scripts/stella_tts.py --input path/to/voice.md # 指定ファイルを変換
  python scripts/stella_tts.py --all                    # 未変換をすべて変換
  python scripts/stella_tts.py --engine openai          # OpenAI TTSを使用（有料）
"""

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


# VOICEVOX スピーカー一覧（ステラのキャラに合うもの）
# 8 = 春日部つむぎ（穏やか・落ち着いた女性）
# 13 = 青山龍星（落ち着いた女性）
# 2 = 四国めたん ノーマル（標準的な女性）
VOICEVOX_SPEAKER_ID = 8
VOICEVOX_URL = 'http://localhost:50021'


def clean_voice_text(text: str) -> str:
    """voice.md から音声合成に不要な制御文字・マークアップを除去する"""
    text = re.sub(r'\[感情:[^\]]*\]', '', text)
    text = re.sub(r'（[^）]*間[^）]*）', '。', text)
    text = re.sub(r'\n---+\n', '\n', text)
    text = re.sub(r'^#{1,3}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'【収録メモ】.*', '', text, flags=re.DOTALL)
    text = re.sub(r'---\s*収録メモ.*', '', text, flags=re.DOTALL)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def find_latest_voice_md() -> Path:
    output_dir = Path('stella/content/output')
    if not output_dir.exists():
        raise FileNotFoundError('stella/content/output が見つかりません')
    files = sorted(output_dir.glob('*/voice.md'), key=lambda p: p.parent.name, reverse=True)
    if not files:
        raise FileNotFoundError('voice.md が見つかりません')
    return files[0]


def find_unconverted() -> list[Path]:
    output_dir = Path('stella/content/output')
    result = []
    for voice_md in sorted(output_dir.glob('*/voice.md')):
        if not (voice_md.parent / 'voice.mp3').exists():
            result.append(voice_md)
    return result


def convert_voicevox(voice_md_path: Path) -> Path:
    """VOICEVOX（無料）で変換する"""
    try:
        import requests
    except ImportError:
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'requests', '-q'], check=True)
        import requests

    # VOICEVOXが起動しているか確認
    try:
        requests.get(f'{VOICEVOX_URL}/speakers', timeout=3)
    except Exception:
        print('ERROR: VOICEVOX が起動していません。')
        print()
        print('【VOICEVOXの起動手順】')
        print('  1. https://voicevox.hiroshiba.jp/ からアプリをダウンロード')
        print('  2. インストールして起動する（アプリを開くだけでOK）')
        print('  3. 再度このスクリプトを実行する')
        sys.exit(1)

    raw_text = voice_md_path.read_text(encoding='utf-8')
    clean_text = clean_voice_text(raw_text)
    char_count = len(clean_text)
    output_wav = voice_md_path.parent / 'voice.wav'
    output_mp3 = voice_md_path.parent / 'voice.mp3'

    print(f'  変換中: {voice_md_path}')
    print(f'  文字数: {char_count}字 → 約{char_count // 200 + 1}分の音声')
    print(f'  エンジン: VOICEVOX（無料）')

    # 音声合成クエリを作成
    query_resp = requests.post(
        f'{VOICEVOX_URL}/audio_query',
        params={'text': clean_text, 'speaker': VOICEVOX_SPEAKER_ID},
    )
    query_resp.raise_for_status()
    query = query_resp.json()

    # 読み上げ速度を少しゆっくりに（スピリチュアルコンテンツに合わせる）
    query['speedScale'] = 0.92
    query['pitchScale'] = 0.0
    query['intonationScale'] = 1.1

    # 音声合成
    synth_resp = requests.post(
        f'{VOICEVOX_URL}/synthesis',
        params={'speaker': VOICEVOX_SPEAKER_ID},
        json=query,
    )
    synth_resp.raise_for_status()
    output_wav.write_bytes(synth_resp.content)

    # WAV → MP3 変換（ffmpegがあれば）
    if _has_ffmpeg():
        subprocess.run(
            ['ffmpeg', '-y', '-i', str(output_wav), '-q:a', '2', str(output_mp3)],
            capture_output=True,
        )
        output_wav.unlink()
        print(f'  ✓ 保存完了: {output_mp3}')
        return output_mp3
    else:
        print(f'  ✓ 保存完了: {output_wav}（WAV形式）')
        print('  ※ MP3に変換するには ffmpeg をインストールしてください')
        print('    → https://ffmpeg.org/download.html')
        return output_wav


def convert_openai(voice_md_path: Path) -> Path:
    """OpenAI TTS（有料・高品質）で変換する"""
    try:
        from openai import OpenAI
    except ImportError:
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'openai', '-q'], check=True)
        from openai import OpenAI

    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        env_file = Path('.env')
        if env_file.exists():
            for line in env_file.read_text(encoding='utf-8').splitlines():
                if line.startswith('OPENAI_API_KEY='):
                    api_key = line.split('=', 1)[1].strip().strip('"\'')
                    break
    if not api_key:
        print('ERROR: OPENAI_API_KEY が設定されていません。')
        print('  PowerShell: $env:OPENAI_API_KEY = "sk-..."')
        sys.exit(1)

    client = OpenAI(api_key=api_key)
    raw_text = voice_md_path.read_text(encoding='utf-8')
    clean_text = clean_voice_text(raw_text)
    char_count = len(clean_text)
    output_path = voice_md_path.parent / 'voice.mp3'

    print(f'  変換中: {voice_md_path}')
    print(f'  文字数: {char_count}字 → 約{char_count // 200 + 1}分の音声')
    print(f'  エンジン: OpenAI TTS HD（有料）')

    response = client.audio.speech.create(
        model='tts-1-hd',
        voice='shimmer',
        input=clean_text,
        speed=0.95,
    )
    response.stream_to_file(str(output_path))
    print(f'  ✓ 保存完了: {output_path}')
    return output_path


def _has_ffmpeg() -> bool:
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def convert(voice_md_path: Path, engine: str) -> Path:
    if engine == 'openai':
        return convert_openai(voice_md_path)
    return convert_voicevox(voice_md_path)


def print_upload_guide(mp3: Path) -> None:
    meta = mp3.parent / 'spotify-meta.md'
    print()
    print('stand.fm アップロード手順:')
    print('  1. stand.fm にログイン')
    print('  2. 「収録する」→「音声をアップロード」をクリック')
    print(f'  3. {mp3} を選択してアップロード')
    if meta.exists():
        print(f'  4. {meta} のタイトル・説明文を貼り付けて公開')


def main():
    parser = argparse.ArgumentParser(description='voice.md を stand.fm 用音声ファイルに変換')
    parser.add_argument('--input', '-i', help='変換する voice.md のパス')
    parser.add_argument('--all', '-a', action='store_true', help='未変換の voice.md をすべて変換')
    parser.add_argument('--engine', choices=['voicevox', 'openai'], default='voicevox',
                        help='TTSエンジン（デフォルト: voicevox=無料）')
    args = parser.parse_args()

    if args.all:
        targets = find_unconverted()
        if not targets:
            print('✓ 未変換のファイルはありません。')
            return
        print(f'{len(targets)} 件を変換します（エンジン: {args.engine}）...\n')
        for path in targets:
            out = convert(path, args.engine)
            print_upload_guide(out)
            print()
        print(f'✓ {len(targets)} 件の変換が完了しました。')
    else:
        if args.input:
            target = Path(args.input)
            if not target.exists():
                print(f'ERROR: {args.input} が見つかりません')
                sys.exit(1)
        else:
            target = find_latest_voice_md()
            print(f'最新のファイルを使用: {target}\n')
        out = convert(target, args.engine)
        print_upload_guide(out)


if __name__ == '__main__':
    main()
