---
name: meta-ads-full
description: Meta広告フルパイプライン - 分析→クリエイティブ生成→入稿→最適化の一括実行
---

# Meta Ads Full Pipeline

Meta広告の分析・クリエイティブ生成・入稿・最適化を一括実行する統合パイプライン。

## 使用方法

```bash
/meta-ads-full <商品名> [オプション]
```

## パイプライン構成

### Phase 1: 現状分析
- 既存キャンペーンのパフォーマンス分析
- 競合広告の調査
- ターゲットオーディエンスの特定
- スキル: `/meta-ads-analyze`, `/meta-ads-competitors`

### Phase 2: クリエイティブ生成
- 広告画像の生成（NanoBanana）
- 広告コピーの生成（太陽スタイル）
- 複数バリエーションの作成
- スキル: `/meta-ads-creative`, `/nanobanana-pro`, `/taiyo-style-headline`

### Phase 3: キャンペーン構築
- キャンペーン構造の設計
- ターゲティング設定
- 予算配分
- スキル: `/meta-ads`

### Phase 4: バルク入稿
- CSV生成
- バリデーション
- API経由で入稿
- スキル: `/meta-ads-bulk`

### Phase 5: 最適化設定
- 自動予算調整ルールの設定
- A/Bテストの設計
- モニタリングアラートの設定
- スキル: `/meta-ads-optimize`

## 出力構造

```
meta-ads-package/
├── 01-analysis/
│   ├── performance-report.md    # 現状分析レポート
│   ├── competitor-analysis.md   # 競合分析
│   └── target-audience.json     # ターゲット定義
├── 02-creative/
│   ├── images/
│   │   ├── feed-*.png           # フィード用画像
│   │   ├── story-*.png          # ストーリー用画像
│   │   └── square-*.png         # 正方形画像
│   ├── copy/
│   │   ├── headlines.json       # ヘッドライン候補
│   │   ├── primary-text.json    # 本文候補
│   │   └── descriptions.json    # 説明文候補
│   └── variations/              # バリエーションセット
├── 03-campaign/
│   ├── campaign-structure.json  # キャンペーン構造
│   ├── targeting.json           # ターゲティング設定
│   └── budget-allocation.json   # 予算配分
├── 04-upload/
│   ├── bulk-upload.csv          # 入稿用CSV
│   ├── upload-result.json       # 入稿結果
│   └── created-ads.json         # 作成された広告ID
└── 05-optimization/
    ├── rules.json               # 最適化ルール
    ├── abtest-design.json       # A/Bテスト設計
    └── alerts.json              # アラート設定
```

## 実行例

```bash
# 基本実行
/meta-ads-full "ダイエットサプリ"

# オプション付き
/meta-ads-full "ダイエットサプリ" --target "30代女性" --budget 50000 --objective conversion

# 自動進行モード
/meta-ads-full "ダイエットサプリ" --auto

# ドライラン（入稿をスキップ）
/meta-ads-full "ダイエットサプリ" --dry-run
```

## オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--target` | ターゲット層 | 自動分析 |
| `--budget` | 日予算（円） | 10000 |
| `--objective` | 目的（awareness/traffic/conversion） | conversion |
| `--variations` | バリエーション数 | 5 |
| `--auto` | 確認なしで自動進行 | false |
| `--dry-run` | 実際の入稿をスキップ | false |
| `--output` | 出力ディレクトリ | meta-ads-package/ |

## 使用MCP

- `meta-ads` - キャンペーン管理
- `facebook-ads-library` - 競合分析
- `apify` - Ad Libraryスクレイピング（オプション）

## 使用スキル

1. `/meta-ads-analyze` - パフォーマンス分析
2. `/meta-ads-competitors` - 競合分析
3. `/meta-ads-creative` - クリエイティブ生成
4. `/nanobanana-pro` - 画像生成
5. `/taiyo-style-headline` - ヘッドライン生成
6. `/taiyo-style` - コピーライティング
7. `/meta-ads-bulk` - バルク入稿
8. `/meta-ads-optimize` - 自動最適化

## 使用エージェント

- `meta-ads-agent` - Meta広告統合エージェント
- `data-analyst` - データ分析
- `automation-architect` - 自動化設計

## コスト

- 基本: **無料**（ローカルスキル + meta-ads MCP）
- 画像生成: **無料**（NanoBanana/Gemini）
- 競合分析（Apify使用時）: **$0.01-0.10/検索**
- 深層リサーチ追加時: **$0.10-1.00**

## 注意事項

- Meta Developer Appの作成とアクセストークンの設定が必要
- 環境変数 `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` の設定が必須
- 初回実行時は `--dry-run` での確認を推奨
- 予算上限を超える設定は自動でブロックされます
