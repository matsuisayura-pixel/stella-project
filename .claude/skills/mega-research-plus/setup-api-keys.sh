#!/bin/bash

# ===========================================
# Research API Keys Setup Script
# ===========================================
# このスクリプトはAPIキーを.envファイルに追加します
# 実行方法: bash setup-api-keys.sh
# ===========================================

echo "================================================"
echo "  Research API Keys Setup"
echo "================================================"
echo ""
echo "このスクリプトは.envファイルにAPIキーを追加します。"
echo "（.envは.gitignoreに含まれているため安全です）"
echo ""

# プロジェクトルートを検出
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

echo "設定ファイル: $ENV_FILE"
echo ""

# 確認
read -p ".envファイルにAPIキーを追加しますか？ (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "キャンセルしました"
    exit 0
fi

# .envファイルが存在しない場合は作成
if [[ ! -f "$ENV_FILE" ]]; then
    echo "# TAISUN v2 Environment Configuration" > "$ENV_FILE"
    echo "✓ .envファイルを作成しました"
fi

# バックアップ
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ .envのバックアップを作成しました"

echo ""
echo "APIキーを入力してください（Enterでスキップ）:"
echo ""

# Tavily
read -p "Tavily API Key (https://tavily.com/): " TAVILY_KEY
if [[ -n "$TAVILY_KEY" ]]; then
    # 既存のキーを削除して追加
    grep -v "^TAVILY_API_KEY=" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "TAVILY_API_KEY=$TAVILY_KEY" >> "$ENV_FILE"
    echo "  ✓ Tavily API Key を設定しました"
fi

# SerpAPI
read -p "SerpAPI Key (https://serpapi.com/): " SERPAPI_KEY
if [[ -n "$SERPAPI_KEY" ]]; then
    grep -v "^SERPAPI_KEY=" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "SERPAPI_KEY=$SERPAPI_KEY" >> "$ENV_FILE"
    echo "  ✓ SerpAPI Key を設定しました"
fi

# Brave
read -p "Brave Search API Key (https://brave.com/search/api/): " BRAVE_KEY
if [[ -n "$BRAVE_KEY" ]]; then
    grep -v "^BRAVE_SEARCH_API_KEY=" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "BRAVE_SEARCH_API_KEY=$BRAVE_KEY" >> "$ENV_FILE"
    echo "  ✓ Brave Search API Key を設定しました"
fi

# NewsAPI
read -p "NewsAPI Key (https://newsapi.org/): " NEWS_KEY
if [[ -n "$NEWS_KEY" ]]; then
    grep -v "^NEWSAPI_KEY=" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "NEWSAPI_KEY=$NEWS_KEY" >> "$ENV_FILE"
    echo "  ✓ NewsAPI Key を設定しました"
fi

# Perplexity
read -p "Perplexity API Key (https://perplexity.ai/settings/api): " PERPLEXITY_KEY
if [[ -n "$PERPLEXITY_KEY" ]]; then
    grep -v "^PERPLEXITY_API_KEY=" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    echo "PERPLEXITY_API_KEY=$PERPLEXITY_KEY" >> "$ENV_FILE"
    echo "  ✓ Perplexity API Key を設定しました"
fi

echo ""
echo "================================================"
echo "  セットアップ完了！"
echo "================================================"
echo ""
echo "設定ファイル: $ENV_FILE"
echo ""
echo "注意: .envファイルは.gitignoreに含まれているため、"
echo "      GitHubにプッシュされません（安全）。"
echo ""
echo "使い方:"
echo "  /mega-research-plus AIエージェント市場 --mode=deep"
echo ""
