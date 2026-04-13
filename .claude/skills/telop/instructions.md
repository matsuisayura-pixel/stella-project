# テロップスキル (Telop Skill)

SNS縦型動画（Reels/TikTok/Shorts）向けの高品質テロップ作成スキル。

## When to Use This Skill

- 縦型ショート動画のテロップを作成する時
- Instagram Reels、TikTok、YouTube Shortsの字幕を作成する時
- 動画編集でテロップのスタイルを決める時
- Remotionでテロップコンポーネントを実装する時

## テロップの種類 (Telop Types)

### 1. フックテキスト (Hook Text)
**用途**: 冒頭で注意を引く、重要なメッセージ
```
スタイル:
- 色: ライム/イエロー (#CCFF00, #FFFF00)
- フォント: 太字ゴシック (900 weight)
- サイズ: 特大 (72-96px)
- 効果: 黒アウトライン (3-4px stroke)
- 配置: 画面中央
```

**Remotionコード例:**
```tsx
<div style={{
  fontFamily: '"Hiragino Sans", "Noto Sans JP", sans-serif',
  fontSize: '80px',
  fontWeight: 900,
  color: '#CCFF00',
  textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000',
  textAlign: 'center',
}}>
  12月新ルール出ましたね
</div>
```

### 2. 吹き出し (Speech Bubble)
**用途**: 会話調、質問、導入フレーズ
```
スタイル:
- 背景: 白 (#FFFFFF)
- 文字色: 黒 (#000000)
- フォント: 中太ゴシック (700 weight)
- サイズ: 中 (32-40px)
- 形状: 角丸の吹き出し形状
- 配置: 人物の横
```

**Remotionコード例:**
```tsx
<div style={{
  backgroundColor: '#FFFFFF',
  padding: '12px 20px',
  borderRadius: '20px',
  position: 'relative',
}}>
  <span style={{
    fontFamily: '"Hiragino Sans", sans-serif',
    fontSize: '36px',
    fontWeight: 700,
    color: '#000000',
  }}>最近</span>
  {/* 吹き出しの尖り部分 */}
  <div style={{
    position: 'absolute',
    bottom: '-10px',
    left: '20px',
    width: 0,
    height: 0,
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderTop: '15px solid #FFFFFF',
  }} />
</div>
```

### 3. ボックステキスト (Box Text)
**用途**: 説明文、ポイント解説、リスト項目
```
スタイル:
- 背景: パープル/マゼンタ (#8B5CF6, #C026D3)
- 文字色: 白 (#FFFFFF) または ライム (#CCFF00)
- フォント: 太字ゴシック (700-800 weight)
- サイズ: 中～大 (40-56px)
- 角丸: 8-12px
- 配置: 画面下部1/3
```

**Remotionコード例:**
```tsx
<div style={{
  backgroundColor: '#8B5CF6',
  padding: '16px 24px',
  borderRadius: '10px',
}}>
  <span style={{
    fontFamily: '"Hiragino Sans", sans-serif',
    fontSize: '48px',
    fontWeight: 700,
    color: '#FFFFFF',
  }}>リールの再生回数が急に落ちた</span>
</div>
```

### 4. シンプルテキスト (Simple Text)
**用途**: 通常の字幕、説明
```
スタイル:
- 文字色: 白 (#FFFFFF)
- フォント: 中太ゴシック (600-700 weight)
- サイズ: 中 (40-48px)
- 効果: ドロップシャドウ
- 配置: 画面下部
```

**Remotionコード例:**
```tsx
<div style={{
  fontFamily: '"Hiragino Sans", sans-serif',
  fontSize: '44px',
  fontWeight: 600,
  color: '#FFFFFF',
  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
}}>
  アップデートで
</div>
```

### 5. ブラケットハイライト (Bracket Highlight)
**用途**: 重要キーワード、強調ワード
```
スタイル:
- 文字色: レッド/ピンク (#EF4444, #EC4899)
- ブラケット: 【】
- フォント: 太字ゴシック (800 weight)
- サイズ: 大 (52-60px)
- 効果: グロー/シャドウ
```

**Remotionコード例:**
```tsx
<span style={{
  fontFamily: '"Hiragino Sans", sans-serif',
  fontSize: '56px',
  fontWeight: 800,
  color: '#EC4899',
  textShadow: '0 0 10px rgba(236,72,153,0.5)',
}}>
  【自動でリセット】
</span>
```

### 6. 3D数字 (3D Number)
**用途**: 統計、数値強調、カウント
```
スタイル:
- 色: メタリックグレー/ゴールド/ライム
- フォント: 極太 (900 weight)
- サイズ: 超特大 (100-140px)
- 効果: 3D押し出し、グラデーション
- 配置: テキストの中に埋め込み
```

**Remotionコード例:**
```tsx
<span style={{
  fontFamily: '"Hiragino Sans", sans-serif',
  fontSize: '120px',
  fontWeight: 900,
  color: '#CCFF00',
  textShadow: `
    2px 2px 0 #000,
    4px 4px 0 #666,
    6px 6px 0 #333
  `,
}}>
  10個
</span>
```

### 7. 3Dテキスト (3D Text)
**用途**: CTA、警告、インパクトメッセージ
```
スタイル:
- 色: パープル/ピンク (#A855F7, #EC4899)
- フォント: 極太 (900 weight)
- サイズ: 特大 (64-80px)
- 効果: 3D押し出し、ひび割れテクスチャ
- 配置: 画面中央下
```

**Remotionコード例:**
```tsx
<div style={{
  fontFamily: '"Hiragino Sans", sans-serif',
  fontSize: '72px',
  fontWeight: 900,
  color: '#A855F7',
  textShadow: `
    3px 3px 0 #581C87,
    6px 6px 0 #3B0764,
    9px 9px 15px rgba(0,0,0,0.5)
  `,
  letterSpacing: '0.05em',
}}>
  アカウント終わります
</div>
```

### 8. アンダーラインテキスト (Underline Text)
**用途**: トピック導入、セクション見出し
```
スタイル:
- 文字色: 白 (#FFFFFF)
- アンダーライン: 白または強調色
- フォント: 中太 (600 weight)
- サイズ: 中 (44-52px)
```

**Remotionコード例:**
```tsx
<div style={{
  borderBottom: '3px solid #FFFFFF',
  paddingBottom: '8px',
  display: 'inline-block',
}}>
  <span style={{
    fontFamily: '"Hiragino Sans", sans-serif',
    fontSize: '48px',
    fontWeight: 600,
    color: '#FFFFFF',
  }}>おさるの受講生でも</span>
</div>
```

### 9. 段差レイアウト (Staggered Layout)
**用途**: 動的な読み進め、リズム感のある表示
```
スタイル:
- 複数行をオフセット配置
- 各行で異なる色使い
- 斜めに読む視線誘導
```

**Remotionコード例:**
```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
  <div style={{ marginLeft: '0px' }}>
    <span style={{ color: '#CCFF00', fontSize: '48px' }}>画質を</span>
  </div>
  <div style={{ marginLeft: '60px' }}>
    <span style={{ color: '#CCFF00', fontSize: '48px' }}>保ったまま</span>
  </div>
  <div style={{ marginLeft: '120px' }}>
    <span style={{ color: '#FFFFFF', fontSize: '48px' }}>投稿できて</span>
  </div>
</div>
```

### 10. ナンバーバッジ (Number Badge)
**用途**: リスト番号、順序表示、ステップ
```
スタイル:
- 形状: 「No.1」「①」などのバッジ
- 色: パープル3D (#8B5CF6)
- サイズ: 大 (80-100px)
- 配置: 画面右下または左下
```

**Remotionコード例:**
```tsx
<div style={{
  fontFamily: '"Hiragino Sans", sans-serif',
  fontSize: '90px',
  fontWeight: 900,
  color: '#8B5CF6',
  textShadow: '4px 4px 0 #4C1D95, 8px 8px 0 #2E1065',
}}>
  No.1
</div>
```

### 11. カラーミックス (Mixed Color Inline)
**用途**: 一文中の部分強調
```
スタイル:
- 複数色を1行内で使用
- 強調部分だけ色変更
- フォントサイズも変更可
```

**Remotionコード例:**
```tsx
<div>
  <span style={{ color: '#FFFFFF', fontSize: '40px' }}>この設定</span>
  <span style={{ color: '#CCFF00', fontSize: '60px', fontWeight: 900 }}>10個</span>
  <span style={{ color: '#EF4444', fontSize: '48px' }}>やり直した</span>
  <span style={{ color: '#FFFFFF', fontSize: '40px' }}>だけで</span>
</div>
```

## アニメーション (Animations)

### 1. フェードイン/アウト
```tsx
const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
  extrapolateRight: 'clamp',
});
```

### 2. ポップイン (スケール)
```tsx
const scale = spring({
  frame: frame - startFrame,
  fps: 30,
  config: { damping: 10, stiffness: 100 },
});
```

### 3. スライドイン
```tsx
const translateX = interpolate(
  frame,
  [startFrame, startFrame + 15],
  [-100, 0],
  { extrapolateRight: 'clamp' }
);
```

### 4. タイプライター効果
```tsx
const visibleChars = Math.floor(
  interpolate(frame, [startFrame, endFrame], [0, text.length])
);
const displayText = text.slice(0, visibleChars);
```

### 5. シェイク/バウンス
```tsx
const shake = Math.sin(frame * 0.5) * 3;
```

## トランジション効果 (Transitions)

### ゴールデンワイプ
画面を横切る金色の光線エフェクト

### ページめくり
次のセクションへの切り替え時に使用

### モーションブラー
高速テキスト登場時の残像効果

## カラーパレット

| 名前 | HEX | 用途 |
|------|-----|------|
| ライム | #CCFF00 | フック、強調、数字 |
| パープル | #8B5CF6 | ボックス背景、バッジ |
| マゼンタ | #C026D3 | ボックス背景 |
| ピンク | #EC4899 | ブラケット、警告 |
| レッド | #EF4444 | 強調、警告 |
| ホワイト | #FFFFFF | 標準テキスト |
| ブラック | #000000 | アウトライン |

## フォント設定

```css
font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
```

### ウェイト使い分け
- 900: フック、3D、数字
- 800: 強調テキスト
- 700: ボックステキスト、標準強調
- 600: 標準テキスト

## 配置ガイド

```
┌─────────────────────┐
│     Safe Zone       │  ← 上部100px余白
│                     │
│                     │
│    [メインテロップ]  │  ← 画面下1/3～1/2
│                     │
│ [吹き出し] [バッジ]  │  ← 補助要素
│                     │
│     Safe Zone       │  ← 下部150px余白 (UIのため)
└─────────────────────┘
```

## 使用例

### Instagram Reels風テロップ
```
/テロップ スタイル=フック テキスト="12月新ルール出ましたね"
/テロップ スタイル=ボックス テキスト="リールの再生回数が急に落ちた" 背景色=パープル
/テロップ スタイル=3D数字 テキスト="10個"
```

## 実装サンプル

完全なRemotionコンポーネントは `/src/AIGoldRush/` を参照:
- `SubtitleBox.tsx` - ボックステロップ
- `TopTitle.tsx` - 固定タイトル
- `Composition.tsx` - タイミング制御

## ベストプラクティス

1. **視認性**: 背景との コントラストを確保
2. **一貫性**: 動画内でスタイルを統一
3. **タイミング**: 音声と同期（30fps基準）
4. **長さ**: 1テロップ最大2行、15文字/行
5. **強調**: 1画面で強調は1-2箇所まで
