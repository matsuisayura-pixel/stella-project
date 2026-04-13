#!/usr/bin/env node
/**
 * Auto Compact Manager - 安全設計版
 *
 * コンテキスト使用率に応じた段階的な対応:
 * - 70%: 警告のみ
 * - 80%: 強い警告 + /compact提案
 * - 85%: 確認ダイアログ後にcompact
 * - 90%: 強制compact（クラッシュ防止）
 *
 * @version 1.0.0
 * @date 2026-01-31
 */

const fs = require('fs');
const path = require('path');

// ===== 設定 =====
const CONFIG = {
  thresholds: {
    WARNING: 70,      // 警告のみ
    STRONG_WARNING: 80, // 強い警告 + 提案
    CONFIRM_COMPACT: 85, // 確認付きcompact
    FORCE_COMPACT: 90    // 強制compact
  },
  cooldown: {
    warningInterval: 60000,  // 警告間隔: 1分
    compactInterval: 300000  // compact間隔: 5分
  },
  files: {
    state: '.claude/temp/compact-state.json',
    log: '.claude/temp/compact-history.log'
  }
};

// ===== 状態管理 =====
function loadState() {
  try {
    const statePath = path.join(process.cwd(), CONFIG.files.state);
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (e) { /* ignore */ }

  return {
    lastWarning: 0,
    lastCompact: 0,
    compactCount: 0,
    sessionStart: Date.now(),
    pendingConfirmation: false
  };
}

function saveState(state) {
  try {
    const statePath = path.join(process.cwd(), CONFIG.files.state);
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (e) { /* ignore */ }
}

function logEvent(event, details) {
  try {
    const logPath = path.join(process.cwd(), CONFIG.files.log);
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const entry = `[${new Date().toISOString()}] ${event}: ${JSON.stringify(details)}\n`;
    fs.appendFileSync(logPath, entry);
  } catch (e) { /* ignore */ }
}

// ===== コンテキスト使用率取得 =====
function getContextUsage() {
  // 方法1: 環境変数から取得
  if (process.env.CLAUDE_CONTEXT_USAGE) {
    return parseFloat(process.env.CLAUDE_CONTEXT_USAGE);
  }

  // 方法2: stdin JSONから取得
  // (Claude Codeフックシステム経由)

  // 方法3: 推定（会話履歴ファイルサイズから）
  try {
    const historyFiles = [
      '.claude/temp/conversation-history.json',
      '.claude/temp/session-context.json'
    ];

    let totalSize = 0;
    for (const file of historyFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        totalSize += fs.statSync(filePath).size;
      }
    }

    // 概算: 200KB = 100% (Claude Codeの典型的なコンテキストサイズ)
    const maxContextBytes = 200 * 1024;
    return Math.min((totalSize / maxContextBytes) * 100, 100);
  } catch (e) {
    return 0;
  }
}

// ===== アクション定義 =====

/**
 * 70% - 警告のみ
 */
function handleWarning(usage, state) {
  const now = Date.now();

  // クールダウンチェック
  if (now - state.lastWarning < CONFIG.cooldown.warningInterval) {
    return { action: 'skip', reason: 'cooldown' };
  }

  state.lastWarning = now;
  saveState(state);

  console.error('\n');
  console.error('\x1b[33m┌─────────────────────────────────────────────┐\x1b[0m');
  console.error('\x1b[33m│  ⚠️  コンテキスト使用率: ' + usage.toFixed(1) + '%              │\x1b[0m');
  console.error('\x1b[33m├─────────────────────────────────────────────┤\x1b[0m');
  console.error('\x1b[33m│  状態: 警告レベル (70%超過)                 │\x1b[0m');
  console.error('\x1b[33m│  推奨: 作業を継続しつつ、進捗を確認        │\x1b[0m');
  console.error('\x1b[33m└─────────────────────────────────────────────┘\x1b[0m');
  console.error('');

  logEvent('WARNING', { usage, threshold: 70 });

  return { action: 'warned', usage };
}

/**
 * 80% - 強い警告 + /compact提案
 */
function handleStrongWarning(usage, state) {
  const now = Date.now();

  if (now - state.lastWarning < CONFIG.cooldown.warningInterval) {
    return { action: 'skip', reason: 'cooldown' };
  }

  state.lastWarning = now;
  saveState(state);

  console.error('\n');
  console.error('\x1b[38;5;208m╔═════════════════════════════════════════════╗\x1b[0m');
  console.error('\x1b[38;5;208m║  🔶 コンテキスト使用率: ' + usage.toFixed(1) + '%              ║\x1b[0m');
  console.error('\x1b[38;5;208m╠═════════════════════════════════════════════╣\x1b[0m');
  console.error('\x1b[38;5;208m║  状態: 高負荷レベル (80%超過)               ║\x1b[0m');
  console.error('\x1b[38;5;208m║                                             ║\x1b[0m');
  console.error('\x1b[38;5;208m║  💡 推奨アクション:                         ║\x1b[0m');
  console.error('\x1b[38;5;208m║     /compact を実行してください             ║\x1b[0m');
  console.error('\x1b[38;5;208m║                                             ║\x1b[0m');
  console.error('\x1b[38;5;208m║  ⏱️  85%到達時: 自動compact確認が表示      ║\x1b[0m');
  console.error('\x1b[38;5;208m╚═════════════════════════════════════════════╝\x1b[0m');
  console.error('');

  logEvent('STRONG_WARNING', { usage, threshold: 80 });

  return { action: 'strong_warned', usage, suggestion: '/compact' };
}

/**
 * 85% - 確認ダイアログ後にcompact
 */
function handleConfirmCompact(usage, state) {
  const now = Date.now();

  // 直近でcompactした場合はスキップ
  if (now - state.lastCompact < CONFIG.cooldown.compactInterval) {
    return { action: 'skip', reason: 'recent_compact' };
  }

  console.error('\n');
  console.error('\x1b[31m╔═══════════════════════════════════════════════════╗\x1b[0m');
  console.error('\x1b[31m║  🚨 コンテキスト使用率: ' + usage.toFixed(1) + '%                  ║\x1b[0m');
  console.error('\x1b[31m╠═══════════════════════════════════════════════════╣\x1b[0m');
  console.error('\x1b[31m║  状態: 危険レベル (85%超過)                       ║\x1b[0m');
  console.error('\x1b[31m║                                                   ║\x1b[0m');
  console.error('\x1b[31m║  ⚡ 自動compact推奨                               ║\x1b[0m');
  console.error('\x1b[31m║                                                   ║\x1b[0m');
  console.error('\x1b[31m║  このまま続けると、90%でコンテキストが           ║\x1b[0m');
  console.error('\x1b[31m║  自動的にcompactされます。                        ║\x1b[0m');
  console.error('\x1b[31m║                                                   ║\x1b[0m');
  console.error('\x1b[31m║  💡 今すぐ /compact を実行することを推奨         ║\x1b[0m');
  console.error('\x1b[31m╚═══════════════════════════════════════════════════╝\x1b[0m');
  console.error('');

  // 確認フラグを設定（次のユーザー入力で確認）
  state.pendingConfirmation = true;
  state.pendingUsage = usage;
  saveState(state);

  logEvent('CONFIRM_COMPACT_REQUESTED', { usage, threshold: 85 });

  // Claude Codeへの指示を返す
  return {
    action: 'confirm_requested',
    usage,
    message: 'コンテキストが85%に達しました。/compact を実行しますか？'
  };
}

/**
 * 90% - 強制compact
 */
function handleForceCompact(usage, state) {
  const now = Date.now();

  console.error('\n');
  console.error('\x1b[41m\x1b[37m╔═══════════════════════════════════════════════════╗\x1b[0m');
  console.error('\x1b[41m\x1b[37m║  🆘 緊急: コンテキスト使用率 ' + usage.toFixed(1) + '%              ║\x1b[0m');
  console.error('\x1b[41m\x1b[37m╠═══════════════════════════════════════════════════╣\x1b[0m');
  console.error('\x1b[41m\x1b[37m║  クラッシュ防止のため、自動compactを実行します   ║\x1b[0m');
  console.error('\x1b[41m\x1b[37m╚═══════════════════════════════════════════════════╝\x1b[0m');
  console.error('');

  // 状態更新
  state.lastCompact = now;
  state.compactCount++;
  state.pendingConfirmation = false;
  saveState(state);

  logEvent('FORCE_COMPACT', { usage, threshold: 90, count: state.compactCount });

  // 強制compactの指示を返す
  // Note: 実際のcompact実行はClaude Code側で行う必要がある
  return {
    action: 'force_compact',
    usage,
    command: '/compact',
    reason: 'Context usage exceeded 90% - crash prevention'
  };
}

// ===== メイン処理 =====

async function checkAndAct(inputUsage = null) {
  const state = loadState();
  const usage = inputUsage !== null ? inputUsage : getContextUsage();

  if (usage === 0) {
    return { action: 'skip', reason: 'no_usage_data' };
  }

  const { thresholds } = CONFIG;

  // 閾値に応じたアクション
  if (usage >= thresholds.FORCE_COMPACT) {
    return handleForceCompact(usage, state);
  } else if (usage >= thresholds.CONFIRM_COMPACT) {
    return handleConfirmCompact(usage, state);
  } else if (usage >= thresholds.STRONG_WARNING) {
    return handleStrongWarning(usage, state);
  } else if (usage >= thresholds.WARNING) {
    return handleWarning(usage, state);
  }

  return { action: 'ok', usage };
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
      const result = await checkAndAct();
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
      return;
    }

    // 状態表示
    if (args[0] === 'status') {
      const state = loadState();
      const usage = getContextUsage();
      console.log('\n📊 Auto Compact Manager Status');
      console.log('================================');
      console.log(`Current usage: ${usage.toFixed(1)}%`);
      console.log(`Compact count: ${state.compactCount}`);
      console.log(`Last compact: ${state.lastCompact ? new Date(state.lastCompact).toISOString() : 'Never'}`);
      console.log(`Pending confirmation: ${state.pendingConfirmation}`);
      console.log('');
      process.exit(0);
      return;
    }

    // 閾値設定表示
    if (args[0] === 'thresholds') {
      console.log('\n⚙️  Auto Compact Thresholds');
      console.log('============================');
      console.log(`70%: Warning only`);
      console.log(`80%: Strong warning + /compact suggestion`);
      console.log(`85%: Confirmation dialog`);
      console.log(`90%: Force compact`);
      console.log('');
      process.exit(0);
      return;
    }

    // stdin からJSON入力（フックモード）
    const stdinData = await readStdin();

    if (stdinData) {
      try {
        const input = JSON.parse(stdinData);

        // コンテキスト使用率が含まれている場合
        if (input.context_usage !== undefined) {
          const result = await checkAndAct(input.context_usage);

          // 強制compactの場合、exit code 2でブロック
          if (result.action === 'force_compact') {
            console.error(JSON.stringify({
              decision: 'block',
              reason: result.reason,
              message: '90%超過: /compact を実行してください'
            }));
            process.exit(2);
            return;
          }
        }
      } catch (e) {
        // JSONパースエラーは無視
      }
    }

    // 通常チェック
    await checkAndAct();
    process.exit(0);

  } catch (error) {
    logEvent('ERROR', { message: error.message });
    process.exit(0); // エラーでもClaude Codeをブロックしない
  }
}

// エクスポート
module.exports = {
  checkAndAct,
  getContextUsage,
  loadState,
  CONFIG
};

// 直接実行
if (require.main === module) {
  main();
}
