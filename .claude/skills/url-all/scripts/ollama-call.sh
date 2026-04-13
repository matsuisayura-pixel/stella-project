#!/bin/bash
# ollama-call.sh - Ollama API 呼び出しヘルパー
# Usage: ./ollama-call.sh <model> <system_prompt> <user_prompt> [json]
#
# Arguments:
#   model:         qwen2.5:32b | qwen3:8b | qwen3-coder:30b
#   system_prompt: システムプロンプト（文字列）
#   user_prompt:   ユーザープロンプト（データ含む文字列）
#   json:          "json" を指定するとJSON形式で返す（オプション）
#
# Returns: Ollama の応答テキスト（.message.content）
#
# Examples:
#   ./ollama-call.sh "qwen2.5:32b" "あなたは分析の専門家です" "以下を要約: ..."
#   ./ollama-call.sh "qwen3-coder:30b" "技術分析" "データ: ..." json

set -euo pipefail

MODEL="${1:?Error: model is required (qwen2.5:32b | qwen3:8b | qwen3-coder:30b)}"
SYSTEM="${2:?Error: system_prompt is required}"
USER="${3:?Error: user_prompt is required}"
FORMAT="${4:-}"

OLLAMA_URL="http://localhost:11434/api/chat"

# Ollama接続確認
if ! curl -s --max-time 3 http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "Error: Ollama is not running. Start with: ollama serve" >&2
  exit 1
fi

# JSON mode 設定
if [ "$FORMAT" = "json" ]; then
  FORMAT_PARAM=',"format":"json"'
else
  FORMAT_PARAM=""
fi

# プロンプトをjqで安全にエスケープ
SYSTEM_ESCAPED=$(printf '%s' "$SYSTEM" | jq -Rs .)
USER_ESCAPED=$(printf '%s' "$USER" | jq -Rs .)

# Ollama API呼び出し（タイムアウト: 5分）
RESPONSE=$(curl -s --max-time 300 "$OLLAMA_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$MODEL\",
    \"stream\": false,
    \"messages\": [
      {\"role\": \"system\", \"content\": $SYSTEM_ESCAPED},
      {\"role\": \"user\", \"content\": $USER_ESCAPED}
    ]
    $FORMAT_PARAM
  }")

# エラーチェック
if [ -z "$RESPONSE" ]; then
  echo "Error: Empty response from Ollama" >&2
  exit 1
fi

# エラーレスポンスチェック
ERROR=$(echo "$RESPONSE" | jq -r '.error // empty' 2>/dev/null)
if [ -n "$ERROR" ]; then
  echo "Ollama Error: $ERROR" >&2
  exit 1
fi

# 応答からメッセージ内容を抽出
CONTENT=$(echo "$RESPONSE" | jq -r '.message.content // empty')
if [ -z "$CONTENT" ]; then
  echo "Error: No content in Ollama response" >&2
  echo "Raw response: $RESPONSE" >&2
  exit 1
fi

echo "$CONTENT"
