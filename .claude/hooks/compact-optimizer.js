#!/usr/bin/env node
/**
 * Compact Optimizer - T2.2 セッション時間・ツールコール数ベースのcompact提案
 *
 * 機能:
 * - セッション経過時間トラッキング（30分で提案）
 * - ツールコール数カウント（50回で提案）
 * - Praetorian連携による重要情報保持ヒント
 * - メトリクスJSONL出力
 *
 * Hook: PostToolUse (全ツール) - 各ツール呼び出し後に軽量チェック
 *
 * @version 1.0.0
 * @date 2026-02-15
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();

const CONFIG = {
  sessionCompactMinutes: 20,
  toolCallThreshold: 30,
  cooldownMs: 120000,
  stateFile: path.join(PROJECT_DIR, '.claude/temp/compact-optimizer-state.json'),
  metricsFile: path.join(PROJECT_DIR, '.claude/hooks/data/compact-metrics.jsonl'),
  logFile: path.join(PROJECT_DIR, '.claude/temp/compact-optimizer.log')
};

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) { /* ignore */ }

  return {
    sessionStart: Date.now(),
    toolCallCount: 0,
    lastCompactSuggestion: 0,
    compactCount: 0,
    suggestedAt: []
  };
}

function saveState(state) {
  try {
    ensureDir(CONFIG.stateFile);
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (e) { /* ignore */ }
}

function appendMetric(entry) {
  try {
    ensureDir(CONFIG.metricsFile);
    const line = JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString()
    }) + '\n';
    fs.appendFileSync(CONFIG.metricsFile, line);
  } catch (e) { /* ignore */ }
}

function log(msg) {
  try {
    ensureDir(CONFIG.logFile);
    fs.appendFileSync(CONFIG.logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) { /* ignore */ }
}

function readStdin(timeout = 500) {
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
    if (process.stdin.isTTY) finish();
  });
}

function getSessionMinutes(state) {
  return (Date.now() - state.sessionStart) / 60000;
}

function shouldSuggestCompact(state) {
  const now = Date.now();
  const sessionMin = getSessionMinutes(state);
  const inCooldown = (now - state.lastCompactSuggestion) < CONFIG.cooldownMs;

  // 動的閾値（提案ごとに倍増される）
  const timeThreshold = state.dynamicTimeThreshold || CONFIG.sessionCompactMinutes;
  const callThreshold = state.dynamicCallThreshold || CONFIG.toolCallThreshold;

  if (inCooldown) return { suggest: false, reason: 'cooldown' };

  if (sessionMin >= timeThreshold) {
    return {
      suggest: true,
      reason: 'time',
      detail: `セッション経過: ${sessionMin.toFixed(0)}分 (閾値: ${timeThreshold}分)`
    };
  }

  if (state.toolCallCount >= callThreshold) {
    return {
      suggest: true,
      reason: 'tool_calls',
      detail: `ツールコール: ${state.toolCallCount}回 (閾値: ${callThreshold}回)`
    };
  }

  return { suggest: false, reason: 'ok' };
}

function outputSuggestion(check, state) {
  const sessionMin = getSessionMinutes(state);
  console.error('');
  console.error('\x1b[36m┌────────────────────────────────────────────────┐\x1b[0m');
  console.error('\x1b[36m│  Compact Optimizer: /compact 推奨              │\x1b[0m');
  console.error('\x1b[36m├────────────────────────────────────────────────┤\x1b[0m');
  console.error(`\x1b[36m│  理由: ${check.detail.padEnd(39)}│\x1b[0m`);
  console.error(`\x1b[36m│  経過: ${sessionMin.toFixed(0)}分 / コール数: ${String(state.toolCallCount).padEnd(17)}│\x1b[0m`);
  console.error('\x1b[36m│  推奨: /compact を実行してコンテキスト整理    │\x1b[0m');
  console.error('\x1b[36m└────────────────────────────────────────────────┘\x1b[0m');
  console.error('');
  // stdout: AI向け指示（コンテキストに注入）
  console.log('[Compact] /compact前にPraetorian compactで重要情報を保存してください');
}

async function main() {
  try {
    const args = process.argv.slice(2);

    // CLIモード: status
    if (args[0] === 'status') {
      const state = loadState();
      const sessionMin = getSessionMinutes(state);
      console.log('\nCompact Optimizer Status');
      console.log('========================');
      console.log(`Session duration: ${sessionMin.toFixed(1)} min`);
      console.log(`Tool calls: ${state.toolCallCount}`);
      console.log(`Compact suggestions: ${state.suggestedAt.length}`);
      console.log(`Compact count: ${state.compactCount}`);
      const dynTime = state.dynamicTimeThreshold || CONFIG.sessionCompactMinutes;
      const dynCalls = state.dynamicCallThreshold || CONFIG.toolCallThreshold;
      console.log(`Next suggestion at: ${dynTime} min or ${dynCalls} calls`);
      process.exit(0);
      return;
    }

    // CLIモード: reset
    if (args[0] === 'reset') {
      saveState({
        sessionStart: Date.now(),
        toolCallCount: 0,
        lastCompactSuggestion: 0,
        compactCount: 0,
        suggestedAt: []
      });
      console.log('State reset.');
      process.exit(0);
      return;
    }

    // Hook mode: stdin から入力を読む
    const stdinData = await readStdin();
    let toolName = 'unknown';

    if (stdinData) {
      try {
        const input = JSON.parse(stdinData);
        toolName = input.tool_name || input.toolName || 'unknown';
      } catch (e) { /* not JSON, ignore */ }
    }

    // 状態更新
    const state = loadState();
    state.toolCallCount++;

    // compact提案チェック
    const check = shouldSuggestCompact(state);

    if (check.suggest) {
      outputSuggestion(check, state);

      state.lastCompactSuggestion = Date.now();
      // 閾値を倍増して次回提案を延伸（永久true問題の防止）
      const prevTime = state.dynamicTimeThreshold || CONFIG.sessionCompactMinutes;
      const prevCalls = state.dynamicCallThreshold || CONFIG.toolCallThreshold;
      state.dynamicTimeThreshold = prevTime * 2;
      state.dynamicCallThreshold = prevCalls + CONFIG.toolCallThreshold;

      state.suggestedAt.push({
        at: Date.now(),
        reason: check.reason,
        toolCallCount: state.toolCallCount,
        sessionMinutes: getSessionMinutes(state)
      });

      appendMetric({
        event: 'compact_suggestion',
        reason: check.reason,
        session_minutes: getSessionMinutes(state),
        tool_calls: state.toolCallCount,
        compact_count: state.compactCount
      });

      log(`Compact suggested: ${check.reason} (${check.detail})`);
    }

    saveState(state);
    process.exit(0);
  } catch (error) {
    log(`Error: ${error.message}`);
    process.exit(0); // エラーでもブロックしない
  }
}

module.exports = { loadState, saveState, shouldSuggestCompact, CONFIG };

if (require.main === module) {
  main();
}
