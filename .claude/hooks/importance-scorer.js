#!/usr/bin/env node
/**
 * Importance Scorer - T3.3 重要度スコアリング
 *
 * 機能:
 * - セッション履歴エントリの重要度判定
 * - エラー/成功/設定変更などのイベント分類
 * - 重要度ベースの保持判定
 *
 * @version 1.0.0
 * @date 2026-02-15
 */

const IMPORTANCE_RULES = {
  critical: {
    score: 100,
    retain: true,
    patterns: [
      /error|exception|fail|crash/i,
      /security|vulnerability|CVE/i,
      /deploy|release|production/i,
      /config.*change|設定変更/i
    ]
  },
  high: {
    score: 75,
    retain: true,
    patterns: [
      /commit|push|merge|PR/i,
      /test.*pass|テスト.*成功/i,
      /fix|resolve|修正/i,
      /create.*file|新規.*作成/i
    ]
  },
  medium: {
    score: 50,
    retain: false,
    patterns: [
      /read|grep|glob|search/i,
      /edit|update|変更/i,
      /install|setup|設定/i
    ]
  },
  low: {
    score: 25,
    retain: false,
    patterns: [
      /status|list|確認/i,
      /help|info|情報/i,
      /cd|ls|pwd/i
    ]
  }
};

function scoreEntry(entry) {
  const text = typeof entry === 'string' ? entry : JSON.stringify(entry);

  for (const [level, config] of Object.entries(IMPORTANCE_RULES)) {
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        return {
          level,
          score: config.score,
          retain: config.retain,
          matchedPattern: pattern.source
        };
      }
    }
  }

  return { level: 'low', score: 25, retain: false, matchedPattern: null };
}

function scoreEntries(entries) {
  return entries.map((entry, index) => ({
    index,
    entry,
    ...scoreEntry(entry)
  }));
}

function filterByImportance(entries, minScore) {
  const scored = scoreEntries(entries);
  return scored.filter(e => e.score >= (minScore || 50));
}

function summarizeEntries(entries) {
  const scored = scoreEntries(entries);
  const summary = {
    total: entries.length,
    critical: scored.filter(e => e.level === 'critical').length,
    high: scored.filter(e => e.level === 'high').length,
    medium: scored.filter(e => e.level === 'medium').length,
    low: scored.filter(e => e.level === 'low').length,
    retainable: scored.filter(e => e.retain).length,
    compressible: scored.filter(e => !e.retain).length
  };

  return summary;
}

function main() {
  const cmd = process.argv[2] || 'test';

  if (cmd === 'test') {
    console.log('\nImportance Scorer - Self Test');
    console.log('==============================\n');

    const testEntries = [
      'git commit -m "fix: authentication bug"',
      'Error: Cannot read property of undefined',
      'npm install express',
      'ls -la',
      'Deploy to production succeeded',
      'Read file: src/index.ts',
      'Security vulnerability found in dependency',
      'git status',
      'Created new file: api/routes.ts',
      'help command executed'
    ];

    for (const entry of testEntries) {
      const result = scoreEntry(entry);
      const icon = result.level === 'critical' ? '\x1b[31m[CRIT]\x1b[0m'
        : result.level === 'high' ? '\x1b[33m[HIGH]\x1b[0m'
        : result.level === 'medium' ? '\x1b[36m[MED]\x1b[0m'
        : '\x1b[90m[LOW]\x1b[0m';
      const retain = result.retain ? '(RETAIN)' : '(compress)';
      console.log(`  ${icon} ${result.score.toString().padStart(3)} ${retain} ${entry}`);
    }

    const summary = summarizeEntries(testEntries);
    console.log(`\nSummary: ${summary.total} entries`);
    console.log(`  Retainable: ${summary.retainable} (${((summary.retainable/summary.total)*100).toFixed(0)}%)`);
    console.log(`  Compressible: ${summary.compressible} (${((summary.compressible/summary.total)*100).toFixed(0)}%)`);
  }
}

module.exports = { scoreEntry, scoreEntries, filterByImportance, summarizeEntries, IMPORTANCE_RULES };

if (require.main === module) {
  main();
}
