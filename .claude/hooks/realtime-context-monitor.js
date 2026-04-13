#!/usr/bin/env node
/**
 * Real-time Context Monitor - リアルタイム監視フック
 *
 * Claude Codeのフックシステムと統合し、
 * 各ツール実行後にコンテキスト使用率をチェック
 *
 * 統合先: PreToolUse / PostToolUse
 *
 * @version 1.0.0
 * @date 2026-01-31
 */

const fs = require('fs');
const path = require('path');

// Auto Compact Manager を読み込み
let autoCompactManager;
try {
  autoCompactManager = require('./auto-compact-manager.js');
} catch (e) {
  // フォールバック: 基本機能のみ
  autoCompactManager = null;
}

// ===== 設定 =====
const CONFIG = {
  // 監視対象ツール（これらのツール使用後にチェック）
  monitoredTools: [
    'Read',
    'Bash',
    'WebFetch',
    'WebSearch',
    'Task',
    'Grep',
    'Glob'
  ],

  // 高コストツール（より積極的に監視）
  highCostTools: [
    'Read',    // 大きなファイル読み込み
    'Bash',    // 長い出力
    'WebFetch' // Web コンテンツ
  ],

  // 軽量チェック間隔（ミリ秒）
  lightCheckInterval: 5000,

  // 詳細チェック間隔（ミリ秒）
  deepCheckInterval: 30000,

  // ファイルパス
  files: {
    lastCheck: '.claude/temp/last-context-check.json',
    monitorLog: '.claude/temp/monitor-events.log'
  }
};

// ===== ユーティリティ =====

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadLastCheck() {
  try {
    const filePath = path.join(process.cwd(), CONFIG.files.lastCheck);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) { /* ignore */ }

  return {
    timestamp: 0,
    usage: 0,
    tool: null
  };
}

function saveLastCheck(data) {
  try {
    const filePath = path.join(process.cwd(), CONFIG.files.lastCheck);
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) { /* ignore */ }
}

function logMonitorEvent(event, details) {
  try {
    const filePath = path.join(process.cwd(), CONFIG.files.monitorLog);
    ensureDir(path.dirname(filePath));

    const entry = `[${new Date().toISOString()}] ${event}: ${JSON.stringify(details)}\n`;
    fs.appendFileSync(filePath, entry);

    // ログファイルが大きくなりすぎたら切り詰め
    const stats = fs.statSync(filePath);
    if (stats.size > 1024 * 1024) { // 1MB超過
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const recentLines = lines.slice(-1000); // 最新1000行のみ保持
      fs.writeFileSync(filePath, recentLines.join('\n'));
    }
  } catch (e) { /* ignore */ }
}

// ===== コンテキスト使用率推定 =====

function estimateContextUsage(input) {
  // 方法1: inputに含まれている場合
  if (input && input.context_usage !== undefined) {
    return input.context_usage;
  }

  // 方法2: 環境変数
  if (process.env.CLAUDE_CONTEXT_USAGE) {
    return parseFloat(process.env.CLAUDE_CONTEXT_USAGE);
  }

  // 方法3: ツール出力サイズから推定
  if (input && input.tool_response) {
    const responseSize = typeof input.tool_response === 'string'
      ? input.tool_response.length
      : JSON.stringify(input.tool_response).length;

    // 累積サイズから推定
    const lastCheck = loadLastCheck();
    const cumulativeSize = (lastCheck.cumulativeSize || 0) + responseSize;

    // 概算: 200KB = 100%
    const maxContextBytes = 200 * 1024;
    const estimated = Math.min((cumulativeSize / maxContextBytes) * 100, 100);

    // 累積サイズを保存
    saveLastCheck({
      ...lastCheck,
      cumulativeSize,
      lastResponseSize: responseSize
    });

    return estimated;
  }

  // 方法4: Auto Compact Manager から取得
  if (autoCompactManager) {
    return autoCompactManager.getContextUsage();
  }

  return 0;
}

// ===== 監視ロジック =====

function shouldCheck(toolName, lastCheck) {
  const now = Date.now();

  // 高コストツールは常にチェック
  if (CONFIG.highCostTools.includes(toolName)) {
    return true;
  }

  // 監視対象ツールは間隔をあけてチェック
  if (CONFIG.monitoredTools.includes(toolName)) {
    return (now - lastCheck.timestamp) >= CONFIG.lightCheckInterval;
  }

  // その他は詳細チェック間隔
  return (now - lastCheck.timestamp) >= CONFIG.deepCheckInterval;
}

async function performCheck(input) {
  const toolName = input.tool_name || 'unknown';
  const lastCheck = loadLastCheck();

  // チェック不要な場合はスキップ
  if (!shouldCheck(toolName, lastCheck)) {
    return { action: 'skip', reason: 'interval' };
  }

  // コンテキスト使用率を推定
  const usage = estimateContextUsage(input);

  // 最終チェック情報を更新
  saveLastCheck({
    timestamp: Date.now(),
    usage,
    tool: toolName,
    cumulativeSize: lastCheck.cumulativeSize || 0
  });

  // ログ記録
  logMonitorEvent('CHECK', { tool: toolName, usage: usage.toFixed(1) });

  // Auto Compact Manager に委譲
  if (autoCompactManager && usage > 0) {
    const result = await autoCompactManager.checkAndAct(usage);

    if (result.action !== 'ok' && result.action !== 'skip') {
      logMonitorEvent('ACTION', result);
    }

    return result;
  }

  return { action: 'checked', usage };
}

// ===== stdin読み込み =====

function readStdin(timeout = 1000) {
  return new Promise((resolve) => {
    let data = '';
    let resolved = false;

    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve(data);
      }
    };

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', finish);
    process.stdin.on('error', finish);

    setTimeout(finish, timeout);

    if (process.stdin.isTTY) {
      finish();
    }
  });
}

// ===== エントリーポイント =====

async function main() {
  try {
    const args = process.argv.slice(2);

    // 手動チェック
    if (args[0] === 'check') {
      const result = await performCheck({ tool_name: 'manual' });
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
      return;
    }

    // 状態リセット
    if (args[0] === 'reset') {
      saveLastCheck({
        timestamp: 0,
        usage: 0,
        tool: null,
        cumulativeSize: 0
      });
      console.log('✅ Monitor state reset');
      process.exit(0);
      return;
    }

    // ログ表示
    if (args[0] === 'logs') {
      const logPath = path.join(process.cwd(), CONFIG.files.monitorLog);
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n').slice(-50); // 最新50行
        console.log(lines.join('\n'));
      } else {
        console.log('No logs found');
      }
      process.exit(0);
      return;
    }

    // stdin からJSON入力（フックモード）
    const stdinData = await readStdin();

    if (stdinData) {
      try {
        const input = JSON.parse(stdinData);

        // PostToolUse イベントの場合
        if (input.hook_event_name === 'PostToolUse' || input.tool_response) {
          const result = await performCheck(input);

          // 強制compactの場合
          if (result.action === 'force_compact') {
            console.error(JSON.stringify({
              decision: 'block',
              reason: result.reason,
              message: '⚠️ コンテキスト90%超過: 自動compactを実行してください'
            }));
            // Note: exit 2 でブロックすると作業が中断するため、警告のみ
            // ユーザーが手動で /compact を実行することを期待
          }
        }
      } catch (e) {
        // JSONパースエラーは無視
      }
    }

    process.exit(0);

  } catch (error) {
    logMonitorEvent('ERROR', { message: error.message });
    process.exit(0); // エラーでもClaude Codeをブロックしない
  }
}

// エクスポート
module.exports = {
  performCheck,
  estimateContextUsage,
  shouldCheck,
  CONFIG
};

// 直接実行
if (require.main === module) {
  main();
}
