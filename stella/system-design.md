# プロジェクト・ステラ システム設計図

version: 1.0
updated: 2026-03-31

---

## 全体構成図

```
【素材（インプット）】
  動画（メイン） + PDF + テキスト
       ↓
【知識ベース】
  文字起こし → チャンク分割 → インデックス化
       ↓
【ステラエンジン（コア）】
  キャラ定義 + RAG検索 + 多次元統合ロジック
       ↓
【コンテンツ生成パイプライン】
  ┌──────────────────────────────────┐
  │  note記事      ショート動画台本   音声スクリプト  │
  │ (1500〜2000字)  (15〜30秒)       (3〜5分)       │
  └──────────────────────────────────┘
       ↓
【LINE誘導CTA自動挿入】
  すべての出力末尾に「魂の現在地診断」誘導を挿入
       ↓
【配信】
  note / TikTok・Reels / Voicy など
```

---

## フォルダ構成

```
stella/
├── system-design.md          ← この設計図
├── core/
│   ├── character.md          ← ステラのキャラ・プロンプト定義
│   ├── brand-constitution.md ← ブランド憲法（出力ルール）
│   └── cta-templates.md      ← LINE誘導CTAテンプレート集
├── content/
│   ├── note-template.md      ← note記事テンプレート
│   ├── shorts-template.md    ← ショート動画台本テンプレート
│   └── voice-template.md     ← 音声スクリプトテンプレート
├── knowledge-base/
│   ├── README.md             ← 素材の整理ルール
│   ├── videos/               ← 動画の文字起こし・要約
│   ├── pdfs/                 ← PDF素材（テキスト抽出済み）
│   └── texts/                ← テキスト素材
├── pipeline/
│   ├── daily-generator.md    ← 毎日のコンテンツ生成手順
│   └── rag-design.md         ← RAG設計（API接続後に有効化）
└── line/
    └── diagnosis-flow.md     ← 魂の現在地診断フロー
```

---

## フェーズ計画

| フェーズ | 内容 | APIキー | 状態 |
|---------|------|---------|------|
| Phase 0 | 設計・テンプレート整備 | 不要 | ✅ 今ここ |
| Phase 1 | 手動でステラが動く（Claude Codeで生成） | Anthropic | 次 |
| Phase 2 | 知識ベース構築（動画文字起こし自動化） | Whisper等 | 後で |
| Phase 3 | RAG検索・完全自動化 | 複数API | 最後 |

---

## 素材の種類と処理方針

| 素材 | 処理方法 | 保存先 |
|------|---------|-------|
| 動画（メイン） | 文字起こし → テキスト化 | knowledge-base/videos/ |
| PDF | テキスト抽出 | knowledge-base/pdfs/ |
| テキスト | そのまま整理 | knowledge-base/texts/ |

---

## 今できること（APIなし）

1. ステラのキャラクター完全定義
2. 3媒体のコンテンツテンプレート作成
3. Claude Codeに素材を貼り付けて手動でコンテンツ生成
4. LINE診断フローの設計
5. 知識ベースへの素材登録ルール整備
