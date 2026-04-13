#!/usr/bin/env node
/**
 * Agent Enforcement Guard - エージェント推奨ガード [ADVISORY MODE]
 *
 * 複雑なタスクでTask toolが使用されていない場合、警告を出力します（ブロックしません）。
 * 多人数共有システムのため、強制ブロックは廃止しました。
 *
 * 検出する複雑タスクパターン:
 * - 3ファイル以上の編集
 * - バグ修正、機能追加、リファクタリング
 * - API実装、テスト作成
 * - レビュー、セキュリティスキャン
 *
 * 防止する問題:
 * - 80個のエージェントが稼働しない
 * - 専門エージェントの知識が活用されない
 * - 品質ゲートがスキップされる
 */

const fs = require('fs');
const path = require('path');
const { readStdin } = require('./utils/read-stdin');

// エージェント使用を要求する複雑タスクパターン
const COMPLEX_TASK_PATTERNS = [
  // 開発タスク
  /バグ(?:修正|を直|をfix)/gi,
  /機能(?:追加|実装|を作)/gi,
  /リファクタ(?:リング|する)/gi,
  /API(?:を)?(?:実装|作成|開発)/gi,
  /テスト(?:を)?(?:作成|書|追加)/gi,
  /コード(?:レビュー|を確認)/gi,
  /セキュリティ(?:スキャン|チェック|確認)/gi,

  // 英語パターン
  /(?:fix|debug|resolve)\s+(?:bug|issue|error)/gi,
  /(?:add|implement|create)\s+(?:feature|function|api)/gi,
  /refactor/gi,
  /(?:write|create|add)\s+tests?/gi,
  /(?:code\s+)?review/gi,
  /security\s+(?:scan|check|audit)/gi,

  // 設計タスク
  /アーキテクチャ(?:設計|を設計)/gi,
  /(?:DB|データベース)(?:設計|スキーマ)/gi,
  /(?:design|architect)/gi,

  // インフラタスク
  /(?:CI|CD|パイプライン)(?:を)?(?:設定|構築)/gi,
  /(?:Docker|Kubernetes|K8s)/gi,
  /デプロイ(?:設定|自動化)/gi,

  // マルチメディア・動画パイプラインタスク
  /(?:インタラクティブ)?動画(?:を)?(?:生成|作成|制作)/gi,
  /(?:VSL|ビデオセールスレター)(?:を)?(?:作|生成)/gi,
  /TTS(?:音声)?(?:を)?(?:生成|作成)/gi,
  /音声(?:を)?(?:生成|合成|作成)/gi,
  /画像(?:を)?(?:一括|バッチ|大量に)?生成/gi,
  /(?:Remotion|リモーション)(?:で)?(?:動画|ビデオ)/gi,
  /ナレーション(?:を)?(?:生成|録音|作成)/gi,
  /(?:Fish\s*Audio|Style-Bert)/gi,
  /分岐(?:動画|VSL|コンテンツ)/gi,

  // 品質検証パイプライン
  /(?:品質|クオリティ)(?:チェック|検証|検査)/gi,
  /(?:agentic.vision|ビジュアルQA)/gi,
  /(?:OCR|テキスト検証|日本語検証)/gi,
];

// 除外パターン（単純タスク）
const SIMPLE_TASK_PATTERNS = [
  /typo/gi,
  /誤字/gi,
  /コメント(?:追加|修正)/gi,
  /README/gi,
  /ログ(?:を)?(?:確認|見)/gi,
  /状態(?:を)?確認/gi,
  /(?:git\s+)?status/gi,
];

// 状態ファイルのパス
const STATE_FILE = '.agent_usage_state.json';

function loadState(cwd) {
  const statePath = path.join(cwd, STATE_FILE);
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return {
    sessionId: Date.now().toString(),
    taskToolUsed: false,
    filesEdited: [],
    complexTaskDetected: false,
    detectedPatterns: [],
    lastUpdated: new Date().toISOString()
  };
}

function saveState(state, cwd) {
  const statePath = path.join(cwd, STATE_FILE);
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function isComplexTask(prompt) {
  // 単純タスクなら除外
  for (const pattern of SIMPLE_TASK_PATTERNS) {
    if (pattern.test(prompt)) {
      return { isComplex: false, patterns: [] };
    }
  }

  // 複雑タスクパターンをチェック
  const matchedPatterns = [];
  for (const pattern of COMPLEX_TASK_PATTERNS) {
    const match = prompt.match(pattern);
    if (match) {
      matchedPatterns.push(match[0]);
    }
  }

  return {
    isComplex: matchedPatterns.length > 0,
    patterns: matchedPatterns
  };
}

async function main() {
  let input = {};

  try {
    const stdinData = await readStdin();
    if (stdinData) {
      input = JSON.parse(stdinData);
    }
  } catch (e) {
    process.exit(0);
    return;
  }

  const cwd = input.cwd || process.cwd();
  const toolName = input.tool_name || '';
  const toolInput = input.tool_input || {};

  // Bootstrap Safe Mode: ワークフロー未開始ならスキップ
  if (!fs.existsSync(path.join(cwd, '.workflow_state.json'))) {
    process.exit(0);
    return;
  }

  let state = loadState(cwd);

  // Task tool使用を記録
  if (toolName === 'Task') {
    state.taskToolUsed = true;
    state.lastTaskToolAt = new Date().toISOString();
    saveState(state, cwd);
    process.exit(0);
    return;
  }

  // UserPromptSubmit時の複雑タスク検出
  if (input.prompt) {
    const { isComplex, patterns } = isComplexTask(input.prompt);
    if (isComplex) {
      state.complexTaskDetected = true;
      state.detectedPatterns = patterns;
      state.taskToolUsed = false; // リセット
      state.filesEdited = [];
      saveState(state, cwd);

      // v2.0: コンテキスト最適化 - stdoutは1-2行、詳細はJSONファイル
      const detailData = {
        timestamp: new Date().toISOString(),
        patterns,
        agents: {
          dev: ['bug-fixer', 'feature-builder', 'refactor-specialist', 'api-developer', 'test-generator', 'code-reviewer', 'security-scanner', 'frontend-developer'],
          media: ['interactive-video-platform', 'nanobanana-pro', 'agentic-vision', 'japanese-text-verifier', 'video-agent']
        }
      };

      try {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(path.join(dataDir, 'agent-guard-detail.json'), JSON.stringify(detailData, null, 2));
      } catch (e) { /* ignore */ }

      // stdoutは最小限の1行サマリー
      console.log(`[Agent Guard] 複雑タスク検出(${patterns.join(', ')}) → Task toolで専門エージェント使用推奨。3ファイル超編集時ブロック。詳細: .claude/hooks/data/agent-guard-detail.json`);
    }
    process.exit(0);
    return;
  }

  // Write/Edit時のファイル数チェック
  if ((toolName === 'Write' || toolName === 'Edit') && state.complexTaskDetected) {
    const filePath = toolInput.file_path || toolInput.path || '';

    if (filePath && !state.filesEdited.includes(filePath)) {
      state.filesEdited.push(filePath);
      saveState(state, cwd);
    }

    // 3ファイル以上の編集でTask tool未使用なら警告（ブロックしない）
    if (state.filesEdited.length >= 3 && !state.taskToolUsed) {
      console.error('');
      console.error('[agent-enforcement-guard] ⚠️  ADVISORY: 複雑タスクでTask toolが未使用です（ブロックしません）');
      console.error(`検出タスク: ${state.detectedPatterns.join(', ')} | 編集ファイル数: ${state.filesEdited.length}`);
      console.error('推奨: Task tool → subagent_type: "bug-fixer" | "feature-builder" | "refactor-specialist"');
      console.error('');
      // 多人数共有システム: 警告のみ、ブロックしない
      process.exit(0);
      return;
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
