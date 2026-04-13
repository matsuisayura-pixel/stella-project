---
name: meta-ads
description: Meta広告システム統合コマンド - キャンペーン管理・分析・最適化
---

# Meta Ads Command

Meta広告（Facebook/Instagram）の統合管理コマンド。

## 使用方法

```bash
/meta-ads <subcommand> [options]
```

## サブコマンド

### キャンペーン管理

```bash
# キャンペーン一覧取得
/meta-ads campaigns list

# キャンペーン詳細
/meta-ads campaigns get <campaign_id>

# キャンペーン作成
/meta-ads campaigns create --name "キャンペーン名" --objective CONVERSIONS --budget 10000

# キャンペーン更新
/meta-ads campaigns update <campaign_id> --status PAUSED
```

### パフォーマンス分析

```bash
# 日次レポート
/meta-ads report daily

# 週次レポート
/meta-ads report weekly

# カスタム期間
/meta-ads report --from 2026-01-01 --to 2026-01-31

# 詳細分析（breakdown付き）
/meta-ads report --breakdown age,gender,placement
```

### 競合分析

```bash
# 競合広告検索
/meta-ads competitors search "競合社名"

# Ad Library分析
/meta-ads competitors analyze --page-id <page_id>

# トレンド分析
/meta-ads competitors trends --category "EC"
```

### クリエイティブ生成

```bash
# 広告画像生成
/meta-ads creative image --product "商品名" --style "modern"

# 広告コピー生成
/meta-ads creative copy --product "商品名" --target "30代女性"

# フルセット生成（画像+コピー）
/meta-ads creative full --product "商品名"
```

### 自動最適化

```bash
# 予算最適化実行
/meta-ads optimize budget

# クリエイティブローテーション
/meta-ads optimize creative

# A/Bテスト開始
/meta-ads optimize abtest --campaign <campaign_id>
```

### バルク操作

```bash
# バルク入稿
/meta-ads bulk upload --file ads.csv

# バルク更新
/meta-ads bulk update --file updates.csv

# テンプレートからバルク生成
/meta-ads bulk generate --template template.json --variations 10
```

## 環境変数（必須）

```bash
export META_ACCESS_TOKEN="your_access_token"
export META_APP_SECRET="your_app_secret"
export META_AD_ACCOUNT_ID="act_123456789"
```

## 関連スキル

- `/meta-ads-analyze` - 詳細分析スキル
- `/meta-ads-creative` - クリエイティブ生成スキル
- `/meta-ads-optimize` - 自動最適化スキル
- `/meta-ads-bulk` - バルク操作スキル

## MCP連携

このコマンドは以下のMCPサーバーを使用します：
- `meta-ads` - Meta Marketing API連携
- `facebook-ads-library` - 競合分析
- `apify` - Ad Libraryスクレイピング（オプション）
