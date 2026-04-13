#!/usr/bin/env node
/**
 * Unified Guard - パフォーマンス最適化された統合ガード
 *
 * 複数のガードを1つに統合し、ファイルI/Oを最小化:
 * - copy-safety-guard
 * - input-sanitizer-guard (軽量版)
 * - workflow-fidelity-guard (キャッシュ付き)
 * - deviation-approval-guard (軽量版)
 *
 * 最適化:
 * - 正規表現パターンを事前コンパイル
 * - 状態ファイルの読み込みを1回に統合
 * - SHA256ハッシュをキャッシュ
 * - 不要なチェックをスキップ
 *
 * exit code:
 * - 0: 許可
 * - 2: ブロック
 */

const fs = require('fs');
const path = require('path');
const { readStdin } = require('./utils/read-stdin');

// === キャッシュシステム ===
const CACHE = {
  state: null,
  stateLoadedAt: 0,
  stateFile: null,
  regexPatterns: null,
  hashCache: new Map()
};

const CACHE_TTL_MS = 5000; // 5秒間キャッシュ

// === 事前コンパイルされた正規表現パターン ===
const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+[\/~]/,
  /rm\s+-rf\s+\*/,
  />\s*\/dev\/sd[a-z]/,
  /mkfs\./,
  /dd\s+if=.*of=\/dev/,
  /:(){:|:&};:/
];

const COPY_MARKER_PATTERNS = [
  /\uFFFD/,                    // U+FFFD (replacement character)
  /\u3000{3,}/,                // 全角スペース連続
  /[\u200B-\u200F\u2028\u2029\uFEFF]/ // ゼロ幅文字
];

const INJECTION_PATTERNS = [
  /\$\(.*\)/,                  // Command substitution
  /`.*`/,                      // Backtick execution
  /;\s*rm\s/,                  // Command chaining with rm
  /\|\s*sh/,                   // Pipe to shell
  /eval\s/                     // eval command
];

// === Phase 1: Intent Parser Integration ===

/**
 * Tool の入力から自然言語の Intent を構築
 */
function buildUserInputFromContext(toolName, toolInput) {
  switch (toolName) {
    case 'Edit':
      const oldPreview = (toolInput.old_string || '').split('\n')[0]?.substring(0, 50) || '';
      return `edit file ${toolInput.file_path} line ${oldPreview}...`;

    case 'Write':
      return `write file ${toolInput.file_path}`;

    case 'Bash':
      const cmd = (toolInput.command || '').substring(0, 100);
      return `run bash command: ${cmd}`;

    case 'Read':
      return `read file ${toolInput.file_path}`;

    case 'Glob':
      return `search files with pattern ${toolInput.pattern}`;

    case 'Grep':
      return `search content with pattern ${toolInput.pattern} in ${toolInput.path || 'cwd'}`;

    case 'Skill':
      return `invoke skill ${toolInput.skill}`;

    default:
      const keys = Object.keys(toolInput).join(', ');
      return `tool ${toolName} with input keys: ${keys}`;
  }
}

/**
 * Intent 検出を実行 (Phase 2: EXISTING_FILE_REFERENCE 対応)
 */
async function performIntentCheck(toolName, toolInput) {
  const startTime = Date.now();

  try {
    // Skill tool の場合は高確信度で SKILL_INVOCATION
    if (toolName === 'Skill') {
      return {
        shouldSkip: true,
        intent: 'SKILL_INVOCATION',
        confidence: 95,
        skipLayers: [2, 3, 4, 6], // Permission/Read-before-Write/Baseline/Deviation
        riskLevel: 'low',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // SESSION_HANDOFF.md の読み込みは SESSION_CONTINUATION
    if (toolName === 'Read' && toolInput.file_path?.includes('SESSION_HANDOFF.md')) {
      return {
        shouldSkip: true,
        intent: 'SESSION_CONTINUATION',
        confidence: 92,
        skipLayers: [1], // SessionStart Injector
        riskLevel: 'low',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // .workflow_state.json の読み込みもセッション継続
    if (toolName === 'Read' && toolInput.file_path?.includes('.workflow_state.json')) {
      return {
        shouldSkip: true,
        intent: 'SESSION_CONTINUATION',
        confidence: 90,
        skipLayers: [1],
        riskLevel: 'low',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // ===== Phase 2: EXISTING_FILE_REFERENCE 検出 =====

    // Read tool: 既存ファイルの読み込み
    if (toolName === 'Read' && toolInput.file_path) {
      const filePath = toolInput.file_path;
      const isExisting = fs.existsSync(filePath);

      if (isExisting) {
        return {
          shouldSkip: true,
          intent: 'EXISTING_FILE_REFERENCE',
          confidence: 98,
          skipLayers: [3, 4], // Read-before-Write, Baseline Lock
          riskLevel: 'low',
          filePath: filePath,
          processingTimeMs: Date.now() - startTime,
        };
      }
    }

    // Edit tool: 既存ファイルの編集
    if (toolName === 'Edit' && toolInput.file_path) {
      const filePath = toolInput.file_path;
      const isExisting = fs.existsSync(filePath);

      if (isExisting) {
        return {
          shouldSkip: true,
          intent: 'EXISTING_FILE_EDIT',
          confidence: 98,
          skipLayers: [3, 4], // Read-before-Write, Baseline Lock
          riskLevel: 'low',
          filePath: filePath,
          operation: 'edit',
          processingTimeMs: Date.now() - startTime,
        };
      }
    }

    // Write tool: 新規作成 or 上書き
    if (toolName === 'Write' && toolInput.file_path) {
      const filePath = toolInput.file_path;
      const isExisting = fs.existsSync(filePath);

      if (isExisting) {
        // 既存ファイルの上書き（高リスク）
        return {
          shouldSkip: true,
          intent: 'EXISTING_FILE_OVERWRITE',
          confidence: 95,
          skipLayers: [4], // Baseline Lock のみスキップ（Read-before-Write は必要）
          riskLevel: 'high',
          filePath: filePath,
          operation: 'write',
          isNew: false,
          processingTimeMs: Date.now() - startTime,
        };
      } else {
        // 新規ファイル作成
        return {
          shouldSkip: true,
          intent: 'NEW_FILE_CREATION',
          confidence: 95,
          skipLayers: [4], // Baseline Lock（新規ファイルはベースラインに存在しない）
          riskLevel: 'low',
          filePath: filePath,
          operation: 'write',
          isNew: true,
          processingTimeMs: Date.now() - startTime,
        };
      }
    }

    // その他は低確信度
    return {
      shouldSkip: false,
      intent: 'UNKNOWN',
      confidence: 0,
      skipLayers: [],
      riskLevel: 'medium',
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      shouldSkip: false,
      intent: 'ERROR',
      confidence: 0,
      skipLayers: [],
      riskLevel: 'high',
      error: error.message,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// === メイン処理 ===
async function main() {
  const startTime = Date.now();

  let input = {};
  try {
    const stdinData = await readStdin(500); // 500msタイムアウト
    if (stdinData) {
      input = JSON.parse(stdinData);
    }
  } catch (e) {
    process.exit(0);
    return;
  }

  const toolName = input.tool_name || '';
  const toolInput = input.tool_input || {};
  const cwd = input.cwd || process.cwd();

  // === Bootstrap Safe Mode ===
  // .workflow_state.json が存在しない = ワークフロー未開始（新規インストール等）
  // → 危険パターン検出のみ実行し、ワークフロー系チェックはスキップ
  const workflowStateExists = fs.existsSync(path.join(cwd, '.workflow_state.json'));
  if (!workflowStateExists) {
    // 最低限の安全チェック（rm -rf等）のみ実行
    const quickResult = performQuickChecks(toolName, toolInput);
    if (quickResult.blocked) {
      outputBlock(quickResult);
      process.exit(2);
    }
    process.exit(0);
    return;
  }

  // PHASE 1: Intent Parser チェック (confidence >= 85% で layer skip)
  const intentCheck = await performIntentCheck(toolName, toolInput);

  if (intentCheck.shouldSkip && intentCheck.confidence >= 85 && intentCheck.skipLayers.length > 0) {
    // Intent が検出され、高確信度の場合は許可
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: `\n[Intent Parser] ${intentCheck.intent} を検出しました（信頼度: ${intentCheck.confidence}%）\nLayer Skip: ${intentCheck.skipLayers.join(', ')}\n`,
      },
    };
    console.log(JSON.stringify(output));

    if (process.env.TAISUN_HOOK_DEBUG) {
      console.error(`[unified-guard] Intent detected in ${Date.now() - startTime}ms`);
    }

    process.exit(0);
    return;
  }

  // PHASE 2: 既存の高速チェック（危険パターン検査）
  const result = performQuickChecks(toolName, toolInput);

  if (result.blocked) {
    outputBlock(result);
    process.exit(2);
    return;
  }

  if (result.warning) {
    outputWarning(result);
  }

  // デバッグ: 処理時間を記録（環境変数で有効化）
  if (process.env.TAISUN_HOOK_DEBUG) {
    console.error(`[unified-guard] Completed in ${Date.now() - startTime}ms`);
  }

  process.exit(0);
}

// === 高速チェック ===
function performQuickChecks(toolName, toolInput) {
  const result = { blocked: false, warning: false, reason: '', suggestion: '' };

  if (toolName === 'Bash') {
    const command = toolInput.command || '';

    // 1. 危険なコマンドパターン
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        result.blocked = true;
        result.reason = `危険なコマンドパターンを検出: ${command.substring(0, 80)}`;
        result.suggestion = 'このコマンドは安全上の理由でブロックされました。';
        return result;
      }
    }

    // 2. コピーマーカー（文字化け）
    for (const pattern of COPY_MARKER_PATTERNS) {
      if (pattern.test(command)) {
        result.blocked = true;
        result.reason = 'コピーペースト由来の不正文字を検出';
        result.suggestion = 'コマンドを手動で再入力してください。';
        return result;
      }
    }

    // 3. インジェクションパターン（警告のみ）
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(command)) {
        result.warning = true;
        result.reason = `潜在的なコマンドインジェクションパターン: ${pattern.source}`;
        result.suggestion = '意図した操作か確認してください。';
        // 警告のみ、ブロックしない
      }
    }
  }

  if (toolName === 'Write' || toolName === 'Edit') {
    const filePath = toolInput.file_path || '';
    const content = toolInput.content || toolInput.new_string || '';

    // 重要ファイルの保護
    const protectedPaths = ['.env', '.git/', 'node_modules/', 'secrets/'];
    for (const protPath of protectedPaths) {
      if (filePath.includes(protPath)) {
        result.blocked = true;
        result.reason = `保護されたパス「${protPath}」への書き込みはブロックされました`;
        result.suggestion = 'このファイルは直接編集できません。';
        return result;
      }
    }

    // コピーマーカー検出
    for (const pattern of COPY_MARKER_PATTERNS) {
      if (pattern.test(content)) {
        result.blocked = true;
        result.reason = 'コンテンツに不正文字（文字化け）を検出';
        result.suggestion = 'コンテンツを再入力してください。';
        return result;
      }
    }
  }

  return result;
}

// === 出力関数 ===
function outputBlock(result) {
  const output = {
    decision: 'block',
    reason: result.reason,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: `\n[BLOCKED] ${result.reason}\n提案: ${result.suggestion}\n`
    }
  };
  console.log(JSON.stringify(output));
}

function outputWarning(result) {
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: `\n[WARNING] ${result.reason}\n提案: ${result.suggestion}\n`
    }
  };
  console.log(JSON.stringify(output));
}

// CLI として実行された場合のみ main() を呼ぶ
if (require.main === module) {
  main().catch(() => process.exit(0));
}

// テスト用の export（CommonJS 形式）
module.exports = {
  buildUserInputFromContext,
  performIntentCheck,
  performQuickChecks,
};
