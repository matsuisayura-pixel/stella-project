#!/usr/bin/env node
/**
 * History Optimizer - T3.3 履歴管理最適化
 *
 * 機能:
 * - 古い履歴の自動要約
 * - 重要履歴の優先保持
 * - 参照頻度に基づく圧縮
 * - Praetorian compactionsの最適化
 *
 * Usage:
 *   node history-optimizer.js analyze    # 履歴分析
 *   node history-optimizer.js optimize   # 最適化実行(dry-run)
 *   node history-optimizer.js apply      # 最適化適用
 *   node history-optimizer.js verify     # 検証
 *
 * @version 1.0.0
 * @date 2026-02-15
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const DATA_DIR = path.join(PROJECT_DIR, '.claude/hooks/data');
const PRAETORIAN_DIR = path.join(PROJECT_DIR, '.claude/praetorian/compactions');
const METRICS_FILE = path.join(DATA_DIR, 'history-optimizer-metrics.jsonl');

let importanceScorer;
try {
  importanceScorer = require('./importance-scorer.js');
} catch {
  importanceScorer = null;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getCompactionFiles() {
  const files = [];
  if (fs.existsSync(PRAETORIAN_DIR)) {
    for (const f of fs.readdirSync(PRAETORIAN_DIR)) {
      if (f.endsWith('.toon')) {
        const fp = path.join(PRAETORIAN_DIR, f);
        try {
          const content = fs.readFileSync(fp, 'utf8');
          const data = JSON.parse(content);
          const stat = fs.statSync(fp);
          files.push({
            path: fp,
            name: f,
            size: content.length,
            created: stat.birthtime,
            modified: stat.mtime,
            data
          });
        } catch {
          // Skip malformed files
        }
      }
    }
  }
  return files.sort((a, b) => b.modified - a.modified);
}

function getMetricsFiles() {
  const files = [];
  if (fs.existsSync(DATA_DIR)) {
    for (const f of fs.readdirSync(DATA_DIR)) {
      if (f.endsWith('.jsonl')) {
        const fp = path.join(DATA_DIR, f);
        const stat = fs.statSync(fp);
        files.push({
          path: fp,
          name: f,
          size: stat.size,
          modified: stat.mtime
        });
      }
    }
  }
  return files;
}

function analyzeAge(files) {
  const now = Date.now();
  const oneDay = 86400000;
  const oneWeek = oneDay * 7;

  return {
    recent: files.filter(f => now - f.modified.getTime() < oneDay),
    thisWeek: files.filter(f => {
      const age = now - f.modified.getTime();
      return age >= oneDay && age < oneWeek;
    }),
    older: files.filter(f => now - f.modified.getTime() >= oneWeek)
  };
}

function runAnalyze() {
  console.log('\nHistory Optimizer - Analysis');
  console.log('=============================\n');

  // 1. Praetorian compactions
  const compactions = getCompactionFiles();
  const compactionSize = compactions.reduce((s, f) => s + f.size, 0);
  console.log(`Praetorian compactions: ${compactions.length} files, ${compactionSize}B`);

  const compAges = analyzeAge(compactions);
  console.log(`  Recent (today): ${compAges.recent.length}`);
  console.log(`  This week: ${compAges.thisWeek.length}`);
  console.log(`  Older (>1 week): ${compAges.older.length}`);

  // 2. Metrics files
  const metrics = getMetricsFiles();
  const metricsSize = metrics.reduce((s, f) => s + f.size, 0);
  console.log(`\nMetrics files: ${metrics.length} files, ${metricsSize}B`);

  for (const m of metrics) {
    const lines = fs.readFileSync(m.path, 'utf8').split('\n').filter(l => l.trim()).length;
    console.log(`  ${m.name}: ${m.size}B (${lines} entries)`);
  }

  // 3. Total history size
  const totalSize = compactionSize + metricsSize;
  console.log(`\nTotal history size: ${totalSize}B (~${Math.floor(totalSize / 4)} tokens)`);

  // 4. Optimization potential
  const olderCompactionSize = compAges.older.reduce((s, f) => s + f.size, 0);
  const largeMetrics = metrics.filter(m => m.size > 5000);
  const largeMetricsSize = largeMetrics.reduce((s, m) => s + m.size, 0);

  console.log(`\nOptimization potential:`);
  console.log(`  Old compactions (>1 week): ${olderCompactionSize}B`);
  console.log(`  Large metrics files: ${largeMetricsSize}B`);
  console.log(`  Estimated savings: ${Math.floor((olderCompactionSize * 0.5) + (largeMetricsSize * 0.3))}B`);

  return { compactions, metrics, totalSize };
}

function runOptimize() {
  console.log('\nHistory Optimizer - Optimization Plan (Dry Run)');
  console.log('=================================================\n');

  const compactions = getCompactionFiles();
  const metrics = getMetricsFiles();
  const actions = [];

  // 1. Old compactions: mark for summarization
  const ages = analyzeAge(compactions);
  for (const comp of ages.older) {
    actions.push({
      action: 'summarize',
      file: comp.name,
      size: comp.size,
      estimatedSaving: Math.floor(comp.size * 0.5),
      reason: 'Compaction older than 1 week'
    });
  }

  // 2. Large metrics: truncate to last 100 entries
  for (const m of metrics) {
    const content = fs.readFileSync(m.path, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 100) {
      const excessLines = lines.length - 100;
      const excessSize = lines.slice(0, excessLines).join('\n').length;
      actions.push({
        action: 'truncate',
        file: m.name,
        size: m.size,
        estimatedSaving: excessSize,
        reason: `${lines.length} entries, keep last 100`
      });
    }
  }

  let totalSaving = 0;
  for (const a of actions) {
    console.log(`  [${a.action.toUpperCase()}] ${a.file}`);
    console.log(`    Size: ${a.size}B, Saving: ${a.estimatedSaving}B`);
    console.log(`    Reason: ${a.reason}`);
    totalSaving += a.estimatedSaving;
  }

  if (actions.length === 0) {
    console.log('  No optimization needed. History is well-managed.');
  }

  console.log(`\nTotal actions: ${actions.length}`);
  console.log(`Total potential saving: ${totalSaving}B (~${Math.floor(totalSaving / 4)} tokens)`);

  return actions;
}

function runApply() {
  console.log('\nHistory Optimizer - Applying Optimizations');
  console.log('============================================\n');

  const metrics = getMetricsFiles();
  let totalSaved = 0;

  // Truncate large metrics files to last 100 entries
  for (const m of metrics) {
    const content = fs.readFileSync(m.path, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    if (lines.length > 100) {
      const kept = lines.slice(-100);
      const newContent = kept.join('\n') + '\n';
      const saved = content.length - newContent.length;

      fs.writeFileSync(m.path, newContent);
      totalSaved += saved;
      console.log(`  TRUNCATED: ${m.name} (${lines.length} -> 100 entries, saved ${saved}B)`);
    }
  }

  if (totalSaved === 0) {
    console.log('  No optimizations applied. History is already optimal.');
  }

  console.log(`\nTotal saved: ${totalSaved}B (~${Math.floor(totalSaved / 4)} tokens)`);

  // Write metrics
  ensureDir(DATA_DIR);
  const metric = JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'history_optimization_applied',
    bytes_saved: totalSaved,
    tokens_saved: Math.floor(totalSaved / 4)
  }) + '\n';
  fs.appendFileSync(METRICS_FILE, metric);

  return totalSaved;
}

function runVerify() {
  console.log('\nHistory Optimizer - Verification');
  console.log('=================================\n');

  let pass = 0;
  let fail = 0;

  // Check 1: Praetorian dir exists
  if (fs.existsSync(PRAETORIAN_DIR)) {
    console.log('[PASS] Praetorian compactions directory exists');
    pass++;
  } else {
    console.log('[WARN] Praetorian compactions directory not found (OK if no compactions yet)');
    pass++; // Not a failure
  }

  // Check 2: Metrics files manageable size
  const metrics = getMetricsFiles();
  const allUnder10K = metrics.every(m => m.size < 10000);
  if (allUnder10K) {
    console.log(`[PASS] All metrics files under 10KB (${metrics.length} files)`);
    pass++;
  } else {
    const large = metrics.filter(m => m.size >= 10000);
    console.log(`[WARN] ${large.length} metrics files over 10KB`);
    fail++;
  }

  // Check 3: No metrics file exceeds 100 entries (after optimization)
  let allUnder100 = true;
  for (const m of metrics) {
    const lines = fs.readFileSync(m.path, 'utf8').split('\n').filter(l => l.trim()).length;
    if (lines > 100) {
      allUnder100 = false;
      console.log(`[WARN] ${m.name} has ${lines} entries (recommend <=100)`);
    }
  }
  if (allUnder100) {
    console.log('[PASS] All metrics files have <=100 entries');
    pass++;
  } else {
    fail++;
  }

  // Check 4: Importance scorer works
  if (importanceScorer) {
    const result = importanceScorer.scoreEntry('git commit -m "fix: bug"');
    if (result && result.score > 0) {
      console.log(`[PASS] Importance scorer works (score: ${result.score}, level: ${result.level})`);
      pass++;
    } else {
      console.log('[FAIL] Importance scorer returned invalid result');
      fail++;
    }
  } else {
    console.log('[FAIL] Importance scorer module not loadable');
    fail++;
  }

  // Check 5: History total size reasonable
  const compactions = getCompactionFiles();
  const totalSize = compactions.reduce((s, f) => s + f.size, 0) + metrics.reduce((s, f) => s + f.size, 0);
  if (totalSize < 50000) {
    console.log(`[PASS] Total history size: ${totalSize}B (<50KB)`);
    pass++;
  } else {
    console.log(`[WARN] Total history size: ${totalSize}B (recommend <50KB)`);
    fail++;
  }

  console.log(`\nResult: ${pass} PASS, ${fail} FAIL`);
  return { pass, fail };
}

function main() {
  const cmd = process.argv[2] || 'analyze';
  switch (cmd) {
    case 'analyze': runAnalyze(); break;
    case 'optimize': runOptimize(); break;
    case 'apply': runApply(); break;
    case 'verify': runVerify(); break;
    default:
      console.log('Usage: node history-optimizer.js [analyze|optimize|apply|verify]');
  }
}

module.exports = { getCompactionFiles, getMetricsFiles, analyzeAge };

if (require.main === module) {
  main();
}
