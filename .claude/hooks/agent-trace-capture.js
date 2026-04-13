#!/usr/bin/env node
/**
 * Agent Trace Capture Hook
 *
 * PostToolUseフック: Edit/Write操作を検出してAgent Traceを自動記録
 *
 * 使用方法:
 *   settings.jsonのhooks.PostToolUseに追加
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================
// Configuration
// ============================================

const CONFIG = {
  // トレース対象のツール
  TARGET_TOOLS: ['Edit', 'Write', 'NotebookEdit'],

  // 除外するファイルパターン
  EXCLUDE_PATTERNS: [
    /node_modules/,
    /\.git\//,
    /\.agent-trace\//,
    /\.env$/,
    /\.env\./,
    /secrets?\//i,
    /credentials/i,
    /\.pem$/,
    /\.key$/
  ],

  // Agent Trace仕様バージョン
  SPEC_VERSION: '0.1.0',

  // ツール情報
  TOOL_NAME: 'taisun-agent',
  TOOL_VERSION: process.env.TAISUN_VERSION || '2.10.1',

  // デフォルトのモデル
  DEFAULT_MODEL: 'anthropic/claude-opus-4-5-20251101'
};

// ============================================
// Utility Functions
// ============================================

/**
 * UUIDを生成
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * プロジェクトルートを検出
 */
function findProjectRoot(startPath) {
  let current = startPath || process.cwd();

  while (current !== path.dirname(current)) {
    // .git または package.json があればプロジェクトルート
    if (
      fs.existsSync(path.join(current, '.git')) ||
      fs.existsSync(path.join(current, 'package.json'))
    ) {
      return current;
    }
    current = path.dirname(current);
  }

  return process.cwd();
}

/**
 * ファイルが除外パターンに一致するか確認
 */
function shouldExclude(filePath) {
  return CONFIG.EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * 現在のGitコミットハッシュを取得
 */
function getGitCommit(projectRoot) {
  try {
    const gitDir = path.join(projectRoot, '.git');
    if (!fs.existsSync(gitDir)) return undefined;

    const headPath = path.join(gitDir, 'HEAD');
    const headContent = fs.readFileSync(headPath, 'utf-8').trim();

    if (headContent.startsWith('ref: ')) {
      const refPath = path.join(gitDir, headContent.slice(5));
      if (fs.existsSync(refPath)) {
        return fs.readFileSync(refPath, 'utf-8').trim().slice(0, 40);
      }
    }
    return headContent.slice(0, 40);
  } catch {
    return undefined;
  }
}

/**
 * 現在のGitブランチ名を取得
 */
function getGitBranch(projectRoot) {
  try {
    const gitDir = path.join(projectRoot, '.git');
    const headPath = path.join(gitDir, 'HEAD');
    const headContent = fs.readFileSync(headPath, 'utf-8').trim();

    if (headContent.startsWith('ref: refs/heads/')) {
      return headContent.slice('ref: refs/heads/'.length);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * トレースディレクトリを作成
 */
function ensureTraceDir(projectRoot) {
  const traceDir = path.join(projectRoot, '.agent-trace', 'traces');
  if (!fs.existsSync(traceDir)) {
    fs.mkdirSync(traceDir, { recursive: true });
  }
  return traceDir;
}

// ============================================
// Main Logic
// ============================================

/**
 * Agent Traceレコードを作成
 */
function createTraceRecord(filePath, projectRoot, toolName, description) {
  const relativePath = path.isAbsolute(filePath)
    ? path.relative(projectRoot, filePath)
    : filePath;

  const trace = {
    version: CONFIG.SPEC_VERSION,
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    files: [{
      path: relativePath,
      conversations: [{
        contributor_type: 'ai',
        model: CONFIG.DEFAULT_MODEL,
        ranges: [{ start_line: 1, end_line: -1 }],
        description: description || `${toolName} operation`
      }]
    }],
    tool: {
      name: CONFIG.TOOL_NAME,
      version: CONFIG.TOOL_VERSION
    },
    metadata: {
      'dev.taisun': {
        hook: 'agent-trace-capture',
        tool_used: toolName
      }
    }
  };

  // VCS情報を追加
  const commit = getGitCommit(projectRoot);
  const branch = getGitBranch(projectRoot);
  if (commit) {
    trace.vcs = {
      type: 'git',
      commit,
      branch
    };
  }

  return trace;
}

/**
 * トレースを保存
 */
function saveTrace(trace, traceDir) {
  const date = trace.timestamp.split('T')[0];
  const shortId = trace.id.slice(0, 8);
  const filename = `${date}_${shortId}.json`;
  const filepath = path.join(traceDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(trace, null, 2), 'utf-8');
  return filepath;
}

/**
 * メイン処理
 */
async function main() {
  let inputData = '';

  // stdinからイベントデータを読み取り
  for await (const chunk of process.stdin) {
    inputData += chunk;
  }

  try {
    const event = JSON.parse(inputData);

    // ツール名を取得
    const toolName = event.tool_name || event.tool?.name;

    // 対象ツールでない場合はスキップ
    if (!CONFIG.TARGET_TOOLS.includes(toolName)) {
      process.exit(0);
    }

    // ファイルパスを取得
    const filePath = event.tool_input?.file_path ||
                     event.tool_input?.notebook_path ||
                     event.input?.file_path;

    if (!filePath) {
      process.exit(0);
    }

    // 除外パターンに一致する場合はスキップ
    if (shouldExclude(filePath)) {
      process.exit(0);
    }

    // プロジェクトルートを検出
    const projectRoot = findProjectRoot(path.dirname(filePath));

    // トレースディレクトリを確保
    const traceDir = ensureTraceDir(projectRoot);

    // 説明を生成
    let description = `${toolName} operation`;
    if (event.tool_input?.old_string && event.tool_input?.new_string) {
      description = 'Edit: text replacement';
    } else if (toolName === 'Write') {
      description = 'Write: file creation/overwrite';
    } else if (toolName === 'NotebookEdit') {
      description = 'NotebookEdit: Jupyter notebook modification';
    }

    // トレースレコードを作成
    const trace = createTraceRecord(filePath, projectRoot, toolName, description);

    // 保存
    saveTrace(trace, traceDir);

    // 成功
    process.exit(0);
  } catch (error) {
    // エラーでも処理を止めない（フックはサイレントに失敗すべき）
    // デバッグ用にエラーログを出力（必要に応じてコメントアウト）
    // console.error('[Agent Trace Hook Error]', error.message);
    process.exit(0);
  }
}

// 実行
main();
