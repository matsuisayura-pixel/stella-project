#!/usr/bin/env python3
"""
YouTube字幕一括取得スクリプト
山本先生チャンネル（および他の先生）の動画字幕を自動取得してknowledge-baseに保存する
"""

import subprocess
import sys
import os
import re
import time
import glob
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ============================================
# 設定
# ============================================
CHANNELS = {
    "yamamoto": "https://www.youtube.com/channel/UChn5kIu-7GczFodqArRzV9A",
    # 他の先生を追加する場合はここに追記
    # "sensei_b": "https://www.youtube.com/channel/XXXXX",
}

BASE_DIR = "stella/knowledge-base/videos"
SLEEP_BETWEEN = 2  # 動画間の待機秒数（レート制限対策）


# ============================================
# VTTファイルをクリーンなテキストに変換
# ============================================
def vtt_to_text(vtt_path):
    with open(vtt_path, encoding='utf-8', errors='replace') as f:
        content = f.read()

    lines = content.split('\n')
    texts = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith(('WEBVTT', 'NOTE', 'Kind:', 'Language:')):
            continue
        if '-->' in line:
            continue
        if re.match(r'^\d+$', line):
            continue
        clean = re.sub(r'<[^>]+>', '', line)
        clean = clean.strip()
        if clean:
            texts.append(clean)

    # 重複行を除去
    unique = list(dict.fromkeys(texts))
    return ' '.join(unique)


# ============================================
# 動画リストを取得
# ============================================
def get_video_list(channel_url):
    result = subprocess.run([
        sys.executable, "-m", "yt_dlp",
        "--flat-playlist",
        "--print", "%(id)s\t%(title)s\t%(duration_string)s",
        "--no-warnings",
        channel_url
    ], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=120)

    videos = []
    for line in result.stdout.strip().split('\n'):
        if '\t' in line:
            parts = line.split('\t')
            if len(parts) >= 2:
                videos.append({
                    'id': parts[0],
                    'title': parts[1],
                    'duration': parts[2] if len(parts) > 2 else ''
                })
    return videos


# ============================================
# 字幕を取得してテキスト保存
# ============================================
def fetch_subtitle(video_id, title, output_dir):
    url = f"https://www.youtube.com/watch?v={video_id}"
    safe_title = re.sub(r'[\\/*?:"<>|]', '_', title)[:60]
    text_path = os.path.join(output_dir, f"{video_id}_{safe_title}.txt")

    # すでに取得済みならスキップ
    if os.path.exists(text_path):
        print(f"  [スキップ] {title[:40]}")
        return True

    # 字幕をダウンロード
    vtt_pattern = os.path.join(output_dir, f"{video_id}_*.ja.vtt")
    result = subprocess.run([
        sys.executable, "-m", "yt_dlp",
        "--write-auto-sub",
        "--sub-lang", "ja",
        "--skip-download",
        "--no-warnings",
        "--output", os.path.join(output_dir, f"{video_id}_%(title).60s.%(ext)s"),
        url
    ], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=60)

    # VTTファイルを探してテキスト変換
    vtt_files = glob.glob(vtt_pattern)
    if vtt_files:
        try:
            text = vtt_to_text(vtt_files[0])
        except PermissionError as e:
            print(f"  [スキップ/権限エラー] {e}")
            for vtt in vtt_files:
                try:
                    os.remove(vtt)
                except Exception:
                    pass
            return False
        with open(text_path, 'w', encoding='utf-8') as f:
            f.write(f"# {title}\n\n")
            f.write(f"動画ID: {video_id}\n")
            f.write(f"URL: {url}\n\n")
            f.write("## 文字起こし\n\n")
            f.write(text)

        # VTTは削除（テキストだけ残す）
        for vtt in vtt_files:
            os.remove(vtt)

        print(f"  [完了] {title[:40]} ({len(text)}字)")
        return True
    else:
        print(f"  [字幕なし] {title[:40]}")
        return False


# ============================================
# メイン処理
# ============================================
def main(teacher_key=None, limit=None):
    targets = {teacher_key: CHANNELS[teacher_key]} if teacher_key else CHANNELS

    for key, channel_url in targets.items():
        output_dir = os.path.join(BASE_DIR, key)
        os.makedirs(output_dir, exist_ok=True)

        print(f"\n{'='*50}")
        print(f"先生: {key}")
        print(f"チャンネル: {channel_url}")
        print(f"{'='*50}")

        print("動画リストを取得中...")
        videos = get_video_list(channel_url)
        print(f"合計 {len(videos)} 本")

        if limit:
            videos = videos[:limit]
            print(f"（先頭 {limit} 本に制限）")

        success = 0
        for i, v in enumerate(videos):
            print(f"\n[{i+1}/{len(videos)}] {v['title'][:50]}")
            if fetch_subtitle(v['id'], v['title'], output_dir):
                success += 1
            time.sleep(SLEEP_BETWEEN)

        print(f"\n完了: {success}/{len(videos)} 本取得")

        # インデックスファイルを生成
        index_path = os.path.join(output_dir, "_index.md")
        txt_files = glob.glob(os.path.join(output_dir, "*.txt"))
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(f"# {key} 動画インデックス\n\n")
            f.write(f"取得済み: {len(txt_files)}本\n\n")
            for v in videos:
                status = "✅" if os.path.exists(
                    os.path.join(output_dir, f"{v['id']}_{re.sub(r'[\\/*?:\"<>|]', '_', v['title'])[:60]}.txt")
                ) else "❌"
                f.write(f"- {status} [{v['title']}](https://www.youtube.com/watch?v={v['id']})\n")

        print(f"インデックス生成: {index_path}")


if __name__ == "__main__":
    # 使い方:
    # python youtube-fetch.py                  → 全チャンネル取得
    # python youtube-fetch.py yamamoto         → yamamoto先生のみ
    # python youtube-fetch.py yamamoto 10      → yamamoto先生の最初の10本

    teacher = sys.argv[1] if len(sys.argv) > 1 else None
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
    main(teacher, limit)
