#!/usr/bin/env node
/**
 * Hook Profiler - T2.3 Hook実行時間計測・最適化分析
 *
 * 機能:
 * - 全登録hookの実行時間計測
 * - ボトルネック特定
 * - 統合・非同期化の推奨
 * - メトリクスJSONL出力
 *
 * Usage:
 *   node hook-profiler.js profile    # 全hookをプロファイル
 *   node hook-profiler.js report     # レポート生成
 *   node hook-profiler.js optimize   # 最適化推奨を表示
 *
 * @version 1.0.0
 * @date 2026-02-15
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const SETTINGS_PATH = path.join(PROJECT_DIR, '.claude/settings.json');
const METRICS_PATH = path.join(PROJECT_DIR, '.claude/hooks/data/hook-profile-metrics.jsonl');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadSettings() {
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
}

function getAllHooks(settings) {
  const hooks = [];
  const hookConfig = settings.hooks || {};

  for (const [event, entries] of Object.entries(hookConfig)) {
    for (const entry of entries) {
      const matcher = entry.matcher || '(all)';
      for (const hook of entry.hooks || []) {
        hooks.push({
          event,
          matcher,
          command: hook.command,
          timeout: hook.timeout || 5,
          type: hook.type || 'command'
        });
      }
    }
  }
  return hooks;
}

function profileHook(hook) {
  const scriptPath = hook.command.replace('node ', '');
  const fullPath = path.join(PROJECT_DIR, scriptPath);

  if (!fs.existsSync(fullPath)) {
    return { ...hook, status: 'missing', ms: -1 };
  }

  const fileSize = fs.statSync(fullPath).size;

  try {
    const start = process.hrtime.bigint();
    // Dry-run: just require and measure startup time
    execSync(`node -e "require('./${scriptPath}')"`, {
      cwd: PROJECT_DIR,
      timeout: 5000,
      stdio: 'pipe',
      env: { ...process.env, HOOK_PROFILER_MODE: 'true' }
    });
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;

    return { ...hook, status: 'ok', ms: Math.round(ms), fileSize };
  } catch (e) {
    return { ...hook, status: 'error', ms: -1, error: e.message.slice(0, 100), fileSize };
  }
}

function findDuplicates(hooks) {
  const cmdMap = {};
  for (const h of hooks) {
    const key = h.command;
    if (!cmdMap[key]) cmdMap[key] = [];
    cmdMap[key].push(h);
  }

  const duplicates = [];
  for (const [cmd, entries] of Object.entries(cmdMap)) {
    if (entries.length > 1) {
      duplicates.push({
        command: cmd,
        count: entries.length,
        events: entries.map(e => `${e.event}[${e.matcher}]`)
      });
    }
  }
  return duplicates;
}

function generateOptimizations(hooks, profileResults) {
  const optimizations = [];

  // 1. Duplicate detection
  const duplicates = findDuplicates(hooks);
  for (const dup of duplicates) {
    if (dup.events.every(e => e.startsWith('PreToolUse'))) {
      optimizations.push({
        type: 'merge',
        priority: 'HIGH',
        description: `${dup.command} が${dup.count}回登録。matcherを統合可能。`,
        events: dup.events
      });
    } else {
      optimizations.push({
        type: 'review',
        priority: 'MEDIUM',
        description: `${dup.command} が複数イベントに登録 (${dup.events.join(', ')})。意図的か確認。`,
        events: dup.events
      });
    }
  }

  // 2. Slow hooks (>100ms)
  for (const r of profileResults) {
    if (r.ms > 100) {
      optimizations.push({
        type: 'slow',
        priority: 'HIGH',
        description: `${r.command} は${r.ms}ms (目標: <100ms)。最適化推奨。`,
        ms: r.ms
      });
    }
  }

  // 3. Large files (>10KB)
  for (const r of profileResults) {
    if (r.fileSize && r.fileSize > 10000) {
      optimizations.push({
        type: 'large',
        priority: 'LOW',
        description: `${r.command} は${(r.fileSize / 1024).toFixed(1)}KB。分割またはコード削減を検討。`,
        fileSize: r.fileSize
      });
    }
  }

  return optimizations;
}

async function runProfile() {
  const settings = loadSettings();
  const hooks = getAllHooks(settings);

  console.log('\nHook Profiler - Execution Time Analysis');
  console.log('========================================\n');
  console.log(`Registered hooks: ${hooks.length}\n`);

  const results = [];
  for (const hook of hooks) {
    const result = profileHook(hook);
    results.push(result);

    const status = result.ms >= 0
      ? (result.ms > 100 ? `\x1b[31m${result.ms}ms\x1b[0m` : `\x1b[32m${result.ms}ms\x1b[0m`)
      : '\x1b[33mN/A\x1b[0m';

    const size = result.fileSize ? `${(result.fileSize / 1024).toFixed(1)}KB` : '?';
    console.log(`  ${result.event.padEnd(20)} | ${result.matcher.padEnd(25)} | ${status.padEnd(20)} | ${size.padEnd(8)} | ${result.command}`);
  }

  // Save metrics
  ensureDir(METRICS_PATH);
  const metric = JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'profile',
    hooks_count: hooks.length,
    results: results.map(r => ({
      command: r.command,
      event: r.event,
      matcher: r.matcher,
      ms: r.ms,
      status: r.status
    }))
  }) + '\n';
  fs.appendFileSync(METRICS_PATH, metric);

  return results;
}

function runOptimize() {
  const settings = loadSettings();
  const hooks = getAllHooks(settings);
  const results = hooks.map(h => profileHook(h));
  const optimizations = generateOptimizations(hooks, results);

  console.log('\nHook Optimization Recommendations');
  console.log('===================================\n');

  if (optimizations.length === 0) {
    console.log('  No optimizations needed. All hooks are efficient.');
    return;
  }

  for (const opt of optimizations) {
    const icon = opt.priority === 'HIGH' ? '\x1b[31m[HIGH]\x1b[0m'
      : opt.priority === 'MEDIUM' ? '\x1b[33m[MED]\x1b[0m'
      : '\x1b[36m[LOW]\x1b[0m';
    console.log(`  ${icon} [${opt.type.toUpperCase()}] ${opt.description}`);
  }

  console.log(`\n  Total recommendations: ${optimizations.length}`);
}

function runReport() {
  if (!fs.existsSync(METRICS_PATH)) {
    console.log('No profile data yet. Run: node hook-profiler.js profile');
    return;
  }

  const lines = fs.readFileSync(METRICS_PATH, 'utf8').trim().split('\n');
  const latest = JSON.parse(lines[lines.length - 1]);

  console.log('\nHook Profile Report (Latest)');
  console.log('=============================\n');
  console.log(`  Timestamp: ${latest.timestamp}`);
  console.log(`  Hooks: ${latest.hooks_count}`);
  console.log('');

  const okHooks = latest.results.filter(r => r.status === 'ok');
  const slowHooks = okHooks.filter(r => r.ms > 100);
  const avgMs = okHooks.length > 0
    ? (okHooks.reduce((s, r) => s + r.ms, 0) / okHooks.length).toFixed(0)
    : 0;

  console.log(`  Average: ${avgMs}ms`);
  console.log(`  Under 100ms: ${okHooks.length - slowHooks.length}/${okHooks.length}`);
  console.log(`  Slow (>100ms): ${slowHooks.length}`);

  if (slowHooks.length > 0) {
    console.log('\n  Slow hooks:');
    for (const h of slowHooks) {
      console.log(`    - ${h.command}: ${h.ms}ms`);
    }
  }
}

async function main() {
  const cmd = process.argv[2] || 'profile';

  switch (cmd) {
    case 'profile':
      await runProfile();
      break;
    case 'optimize':
      runOptimize();
      break;
    case 'report':
      runReport();
      break;
    default:
      console.log('Usage: node hook-profiler.js [profile|optimize|report]');
  }
}

module.exports = { getAllHooks, profileHook, findDuplicates, generateOptimizations };

if (require.main === module) {
  main();
}
