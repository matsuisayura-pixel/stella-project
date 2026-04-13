# OmniHuman1 AIアバター動画作成スキル

1枚の画像と音声からリップシンク動画を生成するスキルです。
VSL動画、プレゼン動画、説明動画に活用できます。

> **注意**: このスキルは指定された場合にのみ使用します。

## 使用方法

```
/omnihuman1-video
```

---

## ヒアリング

以下の情報を確認してください：

1. **動画の用途**: VSL / プレゼン / 説明動画 / その他
2. **長さ**: 何分程度？（推奨: 1-7分）
3. **アバターの希望**: 性別、年代、雰囲気
4. **音声の準備**: 自分で録音 / AI音声を使用
5. **台本の有無**: ある / これから作成

---

## 制作プロセス

### Step 1: 台本準備

```
【台本がない場合】
以下のテンプレートで作成:

[00:00-00:30] オープニング
「[ターゲットの悩み]で困っていませんか？」

[00:30-02:00] 問題提起
[共感ストーリー]

[02:00-03:30] 解決策
「その解決策が○○です」

[03:30-05:00] 詳細説明
[ステップバイステップ]

[05:00-06:00] オファー
[価格・特典]

[06:00-07:00] CTA
「今すぐ○○してください」

【目安】1分 = 150-180文字
```

### Step 2: 音声収録

#### 自分で録音する場合

```
【収録環境】
- 静かな部屋
- エアコンOFF
- 反響の少ない場所

【収録方法】
1. スマホのボイスメモ or Audacity
2. 台本を読み上げ
3. クリアな発声
4. 適度なペース

【編集】
Audacityで:
1. ノイズ除去
2. 音量正規化（-3dB）
3. 無音をカット
4. MP3/WAVで書き出し
```

#### AI音声を使用する場合

```
【VOICEVOX（無料）】
1. https://voicevox.hiroshiba.jp/
2. テキスト入力
3. キャラクター選択
4. 書き出し

【ElevenLabs（有料・高品質）】
1. https://elevenlabs.io/
2. 台本をペースト
3. 声を選択
4. 生成・ダウンロード

【CoeFont（有料・日本語特化）】
1. https://coefont.cloud/
2. ビジネス向け声多数
```

### Step 3: アバター画像生成

#### NanoBanana Proプロンプト

```
【ビジネスパーソン（男性）】
Professional Japanese businessman portrait,
age 35-40, wearing dark navy suit with tie,
confident and trustworthy expression,
looking directly at camera,
clean white studio background,
professional headshot style,
upper body visible,
high quality, realistic

【ビジネスパーソン（女性）】
Professional Japanese businesswoman portrait,
age 30-35, wearing elegant blouse,
warm and professional expression,
looking directly at camera,
clean studio background,
professional headshot style,
upper body visible,
high quality, realistic

【親しみやすい講師（男性）】
Friendly Japanese male instructor,
age 35-45, smart casual outfit,
approachable and warm smile,
eye contact with camera,
soft lighting, neutral background,
upper body shot,
high quality, realistic

【親しみやすい講師（女性）】
Friendly Japanese female instructor,
age 30-40, casual professional outfit,
warm and engaging smile,
looking at camera,
soft studio lighting,
upper body visible,
high quality, realistic
```

### Step 4: OmniHuman1で動画生成

```
【SousakuAIでの手順】

1. https://sousakuai.jp/ にアクセス

2. OmniHuman 1.5を選択

3. 画像をアップロード
   - 生成したアバター画像
   - PNG/JPG形式

4. 音声をアップロード
   - 収録/生成した音声
   - MP3/WAV形式

5. プロンプト入力（下記参照）

6. 生成開始
   - 処理時間: 1-5分

7. 確認・ダウンロード
   - リップシンク確認
   - MP4でダウンロード
```

### Step 5: プロンプト設定

#### VSL用プロンプト

```
【信頼感重視】
Medium shot, professional presentation style,
subtle hand gestures emphasizing key points,
confident and trustworthy expression,
occasional slight nod,
speaking directly to camera,
soft professional lighting

【親しみやすさ重視】
Close to medium shot,
natural conversational style,
warm and friendly expression,
gentle hand movements,
engaging eye contact,
soft natural lighting

【緊急性・インパクト重視】
Dynamic medium shot,
expressive hand gestures,
serious but approachable expression,
energetic delivery,
slightly forward leaning posture,
dramatic lighting
```

#### 説明動画用プロンプト

```
【教育・解説】
Medium shot, instructional style,
clear and patient expression,
pointing gestures for emphasis,
professional but approachable,
clean background,
even lighting
```

### Step 6: 動画編集

```
【CapCut or Canva動画で編集】

1. テロップ追加
   - キーポイントを表示
   - フォント: Noto Sans JP Bold
   - 背景付き（視認性向上）

2. BGM追加
   - 著作権フリー素材
   - 音量: 話し声の20-30%
   - 雰囲気に合った曲

3. オープニング（5秒）
   - ロゴ
   - タイトル
   - フック

4. エンディング（10秒）
   - CTA画面
   - URL/QRコード
   - ボタンデザイン

5. 書き出し
   - 1920x1080px
   - MP4 (H.264)
   - 30fps
```

---

## 品質チェックリスト

```
□ リップシンクが自然
□ 表情が内容に合っている
□ ジェスチャーが自然
□ 音声がクリア
□ テロップが読みやすい
□ BGMが邪魔していない
□ CTAが明確
```

---

## トラブルシューティング

```
【口の動きが不自然】
→ 音声のノイズを除去
→ 発音をよりクリアに再録音

【動きが硬い】
→ プロンプトに "natural movement" 追加
→ "relaxed posture" を追加

【表情が暗い】
→ プロンプトに "warm expression" 追加
→ 画像の照明を調整

【生成に失敗】
→ 画像を正面向きに変更
→ 音声を短く分割して再試行
```

---

## 出力仕様

```
【推奨設定】
- 解像度: 1920x1080px (Full HD)
- フレームレート: 30fps
- 形式: MP4 (H.264)
- 音声: AAC 128kbps以上
- ファイルサイズ: 100MB以下

【アップロード先】
- YouTube（限定公開）
- Vimeo（限定公開）
- 自社サーバー
```

---

## 参照ドキュメント

- `content/creative/omnihuman1-guide.md` - OmniHuman1完全ガイド
- `content/creative/video/production-guide.md` - 動画制作ガイド
- `.claude/commands/kindle-line-vsl.md` - Kindle-LINE-VSLスキル
