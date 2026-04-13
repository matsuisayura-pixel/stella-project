# 図解・解説画像挿入スキル

Kindle本やnote記事に図解・解説画像をNanoBanana Proで生成して挿入するスキルです。

## 使用方法

```
/diagram-insert
```

---

## 図解挿入プロセス

### Step 1: ヒアリング

以下の情報を確認してください：

1. **媒体**: Kindle本 or note記事？
2. **挿入箇所**: どの章/セクションに挿入？
3. **説明したい内容**: 何を図解化したい？
4. **図解タイプ**:
   - A. フロー図（プロセス・手順）
   - B. 比較図（Before/After）
   - C. 構造図（階層・関係性）
   - D. リスト図（ポイント列挙）
   - E. サイクル図（循環プロセス）
   - F. ファネル図（絞り込み）
5. **要素**: 含める項目は？（3-7個程度）

---

### Step 2: 図解タイプ別プロンプト

#### A. フロー図（プロセス・手順）

```
Create a flow chart infographic.

Process: [プロセス名]

Steps (left to right or top to bottom):
1. [ステップ1] - Icon: [アイコン説明]
2. [ステップ2] - Icon: [アイコン説明]
3. [ステップ3] - Icon: [アイコン説明]
4. [ステップ4] - Icon: [アイコン説明]
5. [ステップ5] - Icon: [アイコン説明]

Connecting arrows between steps
Progress indication

Style:
- Clean, modern flat design
- Color scheme: Blue (#1E3A5F) + Green (#22C55E) accent
- [Kindle: High contrast for e-ink / note: Colorful for web]

Size: [Kindle: 1400x800px / note: 1080x1080px]
Background: White
No text - leave labels empty.
```

#### B. 比較図（Before/After）

```
Create a comparison infographic.

Comparing: [比較タイトル]

LEFT SIDE ([Before/Option A]):
- Header area
- Item 1: [項目] - X mark (negative)
- Item 2: [項目] - X mark
- Item 3: [項目] - X mark
- Color: Gray/Red tones

RIGHT SIDE ([After/Option B]):
- Header area
- Item 1: [項目] - Checkmark (positive)
- Item 2: [項目] - Checkmark
- Item 3: [項目] - Checkmark
- Color: Green/Blue tones

Clear visual separation/divider
Arrow indicating transformation (optional)

Style: Clean, high contrast
Size: [Kindle: 1400x800px / note: 1080x1080px]
No text.
```

#### C. 構造図（階層・関係性）

```
Create a structure/hierarchy infographic.

Topic: [トピック]

Structure:
CENTER: [中心要素]

BRANCHES (surrounding):
1. [要素1] - brief description
2. [要素2] - brief description
3. [要素3] - brief description
4. [要素4] - brief description

Layout: [Radial/Tree/Mind map]
Lines connecting center to branches

Style: Organized, clear hierarchy
Size: [Kindle: 1200x900px / note: 1080x1080px]
No text.
```

#### D. リスト図（ポイント列挙）

```
Create a numbered list infographic.

Title area: [タイトル用スペース]

Items (5 items):
1. [項目1] - Icon: [アイコン]
2. [項目2] - Icon: [アイコン]
3. [項目3] - Icon: [アイコン]
4. [項目4] - Icon: [アイコン]
5. [項目5] - Icon: [アイコン]

Layout: Vertical list
Number prominently displayed
Icon left, description space right

Style: Scannable, clean
Size: [Kindle: 800x1200px / note: 1080x1350px]
No text.
```

#### E. サイクル図（循環プロセス）

```
Create a cycle diagram infographic.

Cycle: [サイクル名]

Stages (clockwise, 4 stages):
1. [ステージ1] - Icon - Color 1
2. [ステージ2] - Icon - Color 2
3. [ステージ3] - Icon - Color 3
4. [ステージ4] - Icon - Color 4

Center: Space for cycle name
Curved arrows between stages

Style: Circular, smooth transitions
Size: 1080x1080px
No text.
```

#### F. ファネル図（絞り込み）

```
Create a funnel infographic.

Stages (top to bottom):
1. [最上部] - Width: 100% - Light color
2. [第2層] - Width: 70%
3. [第3層] - Width: 50%
4. [第4層] - Width: 30%
5. [最下部] - Width: 15% - Dark color

Side: Space for percentages/labels
3D effect optional

Style: Clear funnel shape, gradient colors
Size: [Kindle: 800x1000px / note: 1080x1350px]
No text.
```

---

### Step 3: Kindle専用設定

```
【E-ink対応のコツ】
- 色だけでなく明度の差で区別
- グレースケールでも読める設計
- 太い線（2px以上）を使用
- 大きなフォント（最小14px）
- シンプルなデザイン

【推奨サイズ】
- 横長: 1400x800px
- 正方形: 1000x1000px
- 縦長: 800x1200px

【配置】
- 章の冒頭: 概要図解
- 本文中: 説明補足
- 章末: まとめ図解
```

---

### Step 4: note専用設定

```
【Web最適化】
- 鮮やかな色使い
- モバイルファースト
- SNSシェア対応

【推奨サイズ】
- アイキャッチ: 1280x670px
- 本文図解: 1080x1080px
- 縦長: 1080x1350px

【配置】
- アイキャッチ: 記事トップ
- 各セクション見出し下: 内容の先取り
- まとめ: シェア誘導
```

---

### Step 5: テキスト追加

```
Canvaでテキスト追加:

1. 生成した画像をアップロード
2. ラベルエリアにテキスト追加
3. フォント: Noto Sans JP
4. サイズ: 最小16px（読みやすさ確認）
5. 色: 背景とのコントラスト確保
6. 書き出し: PNG形式
```

---

### Step 6: 挿入・確認

```
【Kindle】
1. epub/mobiフォーマットに画像挿入
2. 各デバイスでプレビュー確認
3. E-ink表示を確認

【note】
1. 記事編集画面で画像挿入
2. PC/スマホプレビュー確認
3. 公開前にSNSシェア画像確認
```

---

## 図解配置の目安

### Kindle本（10章の場合）

| 章 | 図解数 | タイプ |
|----|--------|--------|
| 1章 導入 | 2枚 | 問題可視化、ベネフィット |
| 2-5章 本編 | 各2-3枚 | プロセス、概念、比較 |
| 最終章 まとめ | 2枚 | サマリー、アクション |
| **合計** | **約20-25枚** | |

### note記事

| 箇所 | 図解数 | タイプ |
|------|--------|--------|
| アイキャッチ | 1枚 | 目を引くデザイン |
| 本文中 | 2-4枚 | 説明補足 |
| まとめ | 1枚 | シェア用 |
| **合計** | **4-6枚** | |

---

## 参照ドキュメント

- `content/creative/diagram-illustration-guide.md` - 図解制作マニュアル
- `content/content-creation/kindle/illustration-guide.md` - Kindle図解ガイド
- `content/content-creation/note/illustration-guide.md` - note図解ガイド
