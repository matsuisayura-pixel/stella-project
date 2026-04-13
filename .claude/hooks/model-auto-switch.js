#!/usr/bin/env node
/**
 * Model Auto-Switch Hook v2.0 - 実質的な自動切替システム
 *
 * UserPromptSubmit で実行。ユーザー入力を解析して最適なモデルを判定し、
 * recommendation.json に書き出す。AIはサブエージェント起動時にこのファイルを
 * 読み取り、model パラメータを自動設定する。
 *
 * v2.0 変更点:
 * - recommendation.json に状態を書き出し（AIが自動参照）
 * - Opus 4.6 / Sonnet 4.5 / Haiku 4.5 / Codex CLI 対応
 * - 切替報告を毎回 stderr 出力（作業はブロックしない）
 * - switched フラグを実態に合わせて更新
 */

const fs = require('fs')
const path = require('path')
const { readStdin } = require('./utils/read-stdin')

const DATA_DIR = path.join(__dirname, 'data')
const RECOMMENDATION_PATH = path.join(DATA_DIR, 'model-recommendation.json')
const LOG_PATH = path.join(DATA_DIR, 'model-switch.log')

// Claude Code で使用可能なモデル短縮名
// Task ツールの model パラメータ: 'opus' | 'sonnet' | 'haiku'
// litellmModel: LiteLLM proxy 経由で呼び出す外部モデル
const ROUTING_RULES = [
  {
    complexity: 'trivial',
    taskModel: 'haiku',
    claudeCodeModel: 'haiku',
    litellmModel: null,
    description: '挨拶・確認・単純応答',
  },
  {
    complexity: 'simple',
    taskModel: 'haiku',
    claudeCodeModel: 'haiku',
    litellmModel: null,
    description: '検索・一覧表示・状況確認',
  },
  {
    complexity: 'moderate',
    taskModel: 'sonnet',
    claudeCodeModel: 'sonnet',
    litellmModel: null,
    description: 'ファイル修正・関数追加・テスト作成',
  },
  {
    complexity: 'complex',
    taskModel: 'sonnet',
    claudeCodeModel: 'sonnet',
    litellmModel: 'minimax-m2-5',
    description: '新機能実装・API構築・マルチファイル変更',
  },
  {
    complexity: 'expert',
    taskModel: 'opus',
    claudeCodeModel: 'opus',
    litellmModel: 'minimax-m2-5',
    description: 'アーキテクチャ設計・セキュリティ監査・大規模リファクタリング',
  },
]

const COMPLEXITY_KEYWORDS = {
  expert: [
    'アーキテクチャ', 'architecture', 'リファクタリング', 'refactor',
    'セキュリティ監査', 'security audit', 'パフォーマンス最適化',
    'performance optimization', '設計', 'design system',
    'マイクロサービス', 'microservice', '分散システム', 'distributed',
    'スケーリング', 'scaling', 'インフラ', 'infrastructure',
    '統合実装', 'full implementation', 'ゼロから構築', 'build from scratch',
    '移行', 'migration', 'セキュリティ', 'security review',
    'threat model', '脅威モデル', '全体設計', 'system design',
  ],
  complex: [
    '新機能', 'new feature', '実装して', 'implement',
    'テスト作成', 'write tests', 'API', 'エンドポイント', 'endpoint',
    'データベース', 'database', 'CI/CD', 'デプロイ', 'deploy',
    'ワークフロー', 'workflow', 'パイプライン', 'pipeline',
    '統合', 'integration', 'フック', 'hook', 'MCP',
    'エージェント', 'agent', 'スキル', 'skill',
    '複数ファイル', 'multi-file', 'バグ修正', 'bug fix',
    '自動切替', 'auto-switch', 'システム',
  ],
  moderate: [
    '修正', 'fix', '更新', 'update', '変更', 'change',
    '追加', 'add', '編集', 'edit', '改善', 'improve',
    'コンポーネント', 'component', '関数', 'function',
    'テスト', 'test', 'ドキュメント', 'document',
    'リネーム', 'rename', 'ファイル', 'file',
  ],
  simple: [
    '確認', 'check', '表示', 'show', '状況', 'status',
    '読んで', 'read', '見て', 'look', '教えて', 'tell',
    'ヘルプ', 'help', '説明', 'explain', 'どう', 'how',
    '一覧', 'list', '検索', 'search', '探して', 'find',
    'リサーチ', 'research', '調べて', '調査',
  ],
  trivial: [
    'こんにちは', 'hello', 'hi', 'ありがとう', 'thanks',
    'はい', 'yes', 'いいえ', 'no', 'ok', 'OK',
    '了解', '承知', 'わかった', '次', 'next', '進めて', 'proceed',
  ],
}

const COMPLEXITY_WEIGHTS = { expert: 5, complex: 4, moderate: 3, simple: 2, trivial: 1 }

function estimateComplexity(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return { complexity: 'moderate', confidence: 0.3, reason: 'デフォルト（入力なし）' }
  }

  const input = userInput.toLowerCase()
  const scores = { expert: 0, complex: 0, moderate: 0, simple: 0, trivial: 0 }
  const matchedKeywords = {}

  for (const [level, keywords] of Object.entries(COMPLEXITY_KEYWORDS)) {
    const matches = keywords.filter(kw => input.includes(kw.toLowerCase()))
    if (matches.length > 0) {
      scores[level] = matches.length * COMPLEXITY_WEIGHTS[level]
      matchedKeywords[level] = matches
    }
  }

  const inputLength = userInput.length
  if (inputLength > 500) {
    scores.complex += 2
    scores.expert += 1
  } else if (inputLength > 200) {
    scores.moderate += 1
  } else if (inputLength < 20) {
    scores.trivial += 2
    scores.simple += 1
  }

  let maxScore = 0
  let bestComplexity = 'moderate'
  for (const [level, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      bestComplexity = level
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const confidence = totalScore > 0 ? Math.min(maxScore / totalScore + 0.3, 1.0) : 0.3

  const topKeywords = matchedKeywords[bestComplexity] || []
  const reason = topKeywords.length > 0
    ? `キーワード検出: ${topKeywords.slice(0, 3).join(', ')}`
    : `入力長 ${inputLength}文字による推定`

  return { complexity: bestComplexity, confidence, reason }
}

function getRecommendedModel(complexity) {
  return ROUTING_RULES.find(r => r.complexity === complexity) || ROUTING_RULES[2]
}

function loadPreviousRecommendation() {
  try {
    if (fs.existsSync(RECOMMENDATION_PATH)) {
      return JSON.parse(fs.readFileSync(RECOMMENDATION_PATH, 'utf8'))
    }
  } catch {
    // ignore
  }
  return null
}

function saveRecommendation(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(RECOMMENDATION_PATH, JSON.stringify(data, null, 2))
  } catch {
    // ignore
  }
}

function logMetric(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.appendFileSync(LOG_PATH, JSON.stringify(data) + '\n')
  } catch {
    // ignore
  }
}

async function main() {
  const startTime = Date.now()

  let input = {}
  try {
    const stdinData = await readStdin()
    if (stdinData) {
      input = JSON.parse(stdinData)
    }
  } catch {
    process.exit(0)
    return
  }

  const userPrompt = input.user_prompt || input.prompt || ''

  if (!userPrompt.trim()) {
    process.exit(0)
    return
  }

  const { complexity, confidence, reason } = estimateComplexity(userPrompt)
  const recommendation = getRecommendedModel(complexity)
  const previous = loadPreviousRecommendation()
  const elapsed = Date.now() - startTime

  const switched = previous
    ? previous.taskModel !== recommendation.taskModel
    : false

  const recommendationData = {
    timestamp: new Date().toISOString(),
    complexity,
    confidence: Math.round(confidence * 100),
    taskModel: recommendation.taskModel,
    claudeCodeModel: recommendation.claudeCodeModel,
    litellmModel: recommendation.litellmModel,
    description: recommendation.description,
    reason,
    previousModel: previous ? previous.taskModel : null,
    switched,
  }

  saveRecommendation(recommendationData)

  // 毎回報告を出力（作業はブロックしない）
  const report = []
  report.push(`[Auto-Switch] ${complexity} → ${recommendation.taskModel} (信頼度${Math.round(confidence * 100)}%)`)
  if (switched) {
    report.push(`  切替: ${previous.taskModel} → ${recommendation.taskModel}`)
  }
  report.push(`  (${reason}, ${elapsed}ms)`)

  process.stderr.write(report.join('\n') + '\n')

  logMetric({
    ...recommendationData,
    processingTimeMs: elapsed,
  })

  process.exit(0)
}

if (typeof module !== 'undefined') {
  module.exports = {
    estimateComplexity,
    getRecommendedModel,
    ROUTING_RULES,
    COMPLEXITY_KEYWORDS,
  }
}

main().catch(() => process.exit(0))
