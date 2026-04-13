# YouTubeサムネイル作成スキル

YouTubeサムネイルをNanoBanana Pro (Gemini)を使用して作成するスキルです。
高CTR（クリック率）を実現するサムネイルを効率的に生成します。

## 使用方法

```
/youtube-thumbnail
```

---

## サムネイル作成プロセス

### Step 1: ヒアリング

以下の情報を確認してください：

1. **動画タイトル/内容**: どんな動画のサムネイル？
2. **ターゲット視聴者**: 誰に見てほしい？
3. **パターン選択**:
   - A. 人物フォーカス型（表情重視）
   - B. Before/After型（変化を見せる）
   - C. テキスト主体型（キャッチコピー重視）
   - D. 数字インパクト型（数字で訴求）
4. **キーワード/数字**: サムネイルに入れたい文字は？
5. **カラー**: チャンネルのブランドカラーは？

---

### Step 2: パターン別プロンプト生成

#### パターンA: 人物フォーカス型

```
Create a YouTube thumbnail image.

Subject: Japanese [male/female] in [age]s
Expression: [Surprised/Shocked/Happy/Confused/Determined]
- Large, expressive face taking up 40-50% of frame
- Direct eye contact with camera
- [具体的な表情の詳細]

Background:
- [Gradient/Blurred office/Abstract] - [色指定]
- High contrast with subject

Composition:
- Subject on [left/right] third
- Space for text on opposite side
- Clean, uncluttered

Style:
- High contrast, saturated colors
- Japanese YouTube style
- Eye-catching for small display

Size: 1280x720px
No text - leave space for text overlay.
```

#### パターンB: Before/After型

```
Create a YouTube thumbnail showing transformation.

Split composition:
LEFT SIDE (Before):
- [ネガティブな状態の説明]
- Darker, desaturated colors
- [表情: 疲労/困惑/悲しみ]

RIGHT SIDE (After):
- [ポジティブな状態の説明]
- Bright, vibrant colors
- [表情: 笑顔/成功/自信]

Divider: Clear visual separation
Arrow or transformation indicator space

Same person in both sides.
Japanese YouTube style.

Size: 1280x720px
No text.
```

#### パターンC: テキスト主体型

```
Create a YouTube thumbnail background for text-focused design.

Style: [選択]
□ Gradient - [色1] to [色2], modern feel
□ Abstract shapes - geometric, vibrant
□ Blurred image - [イメージの説明]

Requirements:
- Large central area for big text
- High contrast background
- Eye-catching colors
- Professional quality

Size: 1280x720px
No text or people - pure background for text overlay.
```

#### パターンD: 数字インパクト型

```
Create a YouTube thumbnail for number-focused content.

Key number display area: Center-left for large number
Supporting visual: [関連するイメージ]

Elements:
- [成功/お金/成長のイメージ]
- Dramatic, impactful presentation
- Space for big number and unit

Color scheme: [指定色] - success/wealth aesthetic

Size: 1280x720px
No text - leave number area empty.
```

---

### Step 3: 補助要素の生成（必要に応じて）

#### アイコン・マーク

```
Create a simple icon for YouTube thumbnail.

Type: [Arrow up/Checkmark/X mark/Question/Exclamation/Yen symbol]

Style:
- Bold, simple design
- Single color: [#22C55E green / #EF4444 red / #FBBF24 yellow]
- Clean edges

Size: 500x500px
Transparent background (PNG).
```

#### 背景のみ

```
Create a YouTube thumbnail background (no people).

Style: [Gradient/Office/Abstract/Money-themed]

Requirements:
- Space for subject on [left/right]
- Space for text on opposite side
- High contrast, eye-catching
- Not too busy

Size: 1280x720px
No text or people.
```

---

### Step 4: テキスト追加（Canva）

#### フォント推奨

| 用途 | フォント |
|------|---------|
| メインコピー | ヒラギノ角ゴ StdN W8 |
| 数字 | Impact / Bebas Neue |
| 補足 | Noto Sans JP Medium |

#### テキスト設定

```
【サイズ目安】
- メインコピー: 72-120pt
- サブコピー: 48-72pt
- 補足: 36-48pt

【装飾】
- 縁取り: 黒4-6px（白文字の場合）
- 影: ドロップシャドウ（控えめに）

【配置】
- 3行以内
- 人物の反対側
```

---

### Step 5: 確認・書き出し

```
チェックリスト:
□ 小さいサイズ（120x68px）でも内容がわかる
□ 3秒で何の動画かわかる
□ 顔の表情がはっきり見える
□ テキストが読める
□ 競合と差別化できている

書き出し:
- サイズ: 1280x720px
- 形式: JPG or PNG
- ファイルサイズ: 2MB以下推奨
```

---

## カラーパレット早見表

| 印象 | 背景 | テキスト | アクセント |
|------|------|---------|----------|
| 信頼・ビジネス | #1E3A5F | #FFFFFF | #22C55E |
| 緊急・重要 | #DC2626 | #FFFFFF | #FBBF24 |
| 成功・お金 | #065F46 | #FBBF24 | #FFFFFF |
| エネルギー | #F97316 | #FFFFFF | #1E3A5F |

---

## 効果的なコピー例

```
【数字系】「月収100万円」「たった3日で」「5つの方法」
【疑問系】「なぜ○○は失敗するのか」「知ってた？」
【否定系】「やってはいけない」「実は間違い」
【煽り系】「衝撃」「驚愕」「まだ○○してるの？」
```

---

## 参照ドキュメント

- `content/creative/youtube-thumbnail-guide.md` - 詳細マニュアル
