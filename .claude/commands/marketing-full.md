---
name: marketing-full
description: マーケティングキャンペーン一括作成パイプライン（要件定義→LP→コピー→画像）
---

# Marketing Full Pipeline

マーケティングキャンペーンを一括で作成する統合パイプライン。

## 使用方法

```
/marketing-full <商品名またはプロジェクト概要>
```

## パイプライン構成

### Phase 1: 要件定義（SDD-REQ100）
- 100点満点スコアリング付き要件定義書を作成
- ターゲット顧客、価値提案、競合優位性を明確化
- スキル: `/sdd-req100`

### Phase 2: LP構造設計（太陽スタイル）
- 成約率4.3倍を実現するLP構造を設計
- ヘッドライン、ベネフィット、CTA配置を最適化
- スキル: `/taiyo-style-lp`

### Phase 3: セールスコピー作成
- 176パターンの太陽スタイルコピーライティング
- 心理トリガー、キラーワードを適切に配置
- スキル: `/taiyo-style-sales-letter`

### Phase 4: ビジュアル生成（NanoBanana）
- ヒーロー画像、セクション画像を生成
- ブランドイメージに合わせたビジュアル
- スキル: `/nanobanana-pro`

### Phase 5: 最終チェック（LP分析）
- 太陽スタイル基準での分析・スコアリング
- 改善点の洗い出しと修正提案
- スキル: `/lp-analysis`

## 出力構造

```
marketing-package/
├── 01-requirements/
│   └── requirements.md          # 100点要件定義書
├── 02-lp-structure/
│   └── lp-structure.json        # LP構造定義
├── 03-copy/
│   ├── sales-letter.md          # セールスレター
│   ├── headline.md              # ヘッドライン候補
│   └── bullets.md               # ブレット・ベネフィット
├── 04-visuals/
│   ├── hero-image.png           # ヒーロー画像
│   └── section-images/          # セクション画像
└── 05-analysis/
    └── analysis-report.md       # LP分析レポート
```

## 実行手順

1. このコマンドを実行すると、各フェーズを順番に実行します
2. 各フェーズ完了後、確認を求めます（自動進行も可能）
3. 全フェーズ完了後、`marketing-package/` に成果物が出力されます

## オプション

- `--auto`: 確認なしで全フェーズを自動実行
- `--skip-visuals`: 画像生成をスキップ
- `--output <dir>`: 出力ディレクトリを指定

## 関連スキル

- `/sdd-req100` - 要件定義
- `/taiyo-style` - 太陽スタイル
- `/taiyo-style-lp` - LP設計
- `/taiyo-style-sales-letter` - セールスレター
- `/nanobanana-pro` - 画像生成
- `/lp-analysis` - LP分析

## コスト

- 基本: **無料**（ローカルスキルのみ）
- 画像生成: **無料**（NanoBanana/Gemini）
- リサーチ追加時: $0.10-1.00（オプション）
