#!/usr/bin/env node
/**
 * Usage Tracker - T3.2 使用頻度トラッキング
 *
 * 機能:
 * - スキル/コマンド/MCP使用頻度の記録
 * - 参照パターン分析
 * - 頻度ベースのランキング
 *
 * Usage:
 *   node usage-tracker.js track <type> <name>  # 使用記録
 *   node usage-tracker.js report               # レポート出力
 *   node usage-tracker.js ranking              # ランキング表示
 *
 * @version 1.0.0
 * @date 2026-02-15
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const DATA_DIR = path.join(PROJECT_DIR, '.claude/hooks/data');
const USAGE_FILE = path.join(DATA_DIR, 'usage-tracking.json');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function loadUsageData() {
  ensureDir(DATA_DIR);
  if (fs.existsSync(USAGE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    } catch {
      return createEmptyData();
    }
  }
  return createEmptyData();
}

function createEmptyData() {
  return {
    version: '1.0.0',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    entries: {}
  };
}

function saveUsageData(data) {
  ensureDir(DATA_DIR);
  const updated = { ...data, updated: new Date().toISOString() };
  fs.writeFileSync(USAGE_FILE, JSON.stringify(updated, null, 2));
}

function trackUsage(type, name) {
  const data = loadUsageData();
  const key = `${type}:${name}`;

  if (!data.entries[key]) {
    data.entries[key] = {
      type,
      name,
      count: 0,
      firstUsed: new Date().toISOString(),
      lastUsed: null,
      sessions: []
    };
  }

  const entry = data.entries[key];
  const newEntry = {
    ...entry,
    count: entry.count + 1,
    lastUsed: new Date().toISOString()
  };

  // Track session (keep last 10)
  const sessionId = process.env.CLAUDE_SESSION_ID || 'unknown';
  const sessions = [...entry.sessions];
  if (!sessions.includes(sessionId)) {
    sessions.push(sessionId);
    if (sessions.length > 10) sessions.shift();
  }
  newEntry.sessions = sessions;

  data.entries[key] = newEntry;
  saveUsageData(data);

  return newEntry;
}

function getFrequencyTier(count) {
  if (count >= 20) return { tier: 'hot', label: 'HOT', detail: 'full' };
  if (count >= 10) return { tier: 'warm', label: 'WARM', detail: 'standard' };
  if (count >= 3) return { tier: 'cool', label: 'COOL', detail: 'summary' };
  return { tier: 'cold', label: 'COLD', detail: 'minimal' };
}

function runReport() {
  const data = loadUsageData();
  const entries = Object.values(data.entries);

  console.log('\nUsage Tracker - Report');
  console.log('======================\n');

  if (entries.length === 0) {
    console.log('No usage data recorded yet.');
    console.log('Track usage with: node usage-tracker.js track <type> <name>');
    return;
  }

  // Group by type
  const byType = {};
  for (const entry of entries) {
    if (!byType[entry.type]) byType[entry.type] = [];
    byType[entry.type].push(entry);
  }

  for (const [type, items] of Object.entries(byType)) {
    console.log(`--- ${type.toUpperCase()} ---`);
    const sorted = items.sort((a, b) => b.count - a.count);
    for (const item of sorted) {
      const freq = getFrequencyTier(item.count);
      console.log(`  [${freq.label}] ${item.name}: ${item.count} uses (detail: ${freq.detail})`);
    }
    console.log('');
  }

  console.log(`Total entries: ${entries.length}`);
  console.log(`Last updated: ${data.updated}`);
}

function runRanking() {
  const data = loadUsageData();
  const entries = Object.values(data.entries);

  console.log('\nUsage Tracker - Ranking');
  console.log('=======================\n');

  if (entries.length === 0) {
    console.log('No usage data recorded yet.');
    return { hot: [], warm: [], cool: [], cold: [] };
  }

  const sorted = entries.sort((a, b) => b.count - a.count);
  const ranking = { hot: [], warm: [], cool: [], cold: [] };

  for (const entry of sorted) {
    const freq = getFrequencyTier(entry.count);
    ranking[freq.tier].push(entry);
  }

  console.log(`HOT (>=20 uses, full detail): ${ranking.hot.length} items`);
  for (const e of ranking.hot) console.log(`  ${e.type}:${e.name} (${e.count})`);

  console.log(`WARM (>=10, standard detail): ${ranking.warm.length} items`);
  for (const e of ranking.warm) console.log(`  ${e.type}:${e.name} (${e.count})`);

  console.log(`COOL (>=3, summary detail): ${ranking.cool.length} items`);
  for (const e of ranking.cool) console.log(`  ${e.type}:${e.name} (${e.count})`);

  console.log(`COLD (<3, minimal detail): ${ranking.cold.length} items`);
  for (const e of ranking.cold) console.log(`  ${e.type}:${e.name} (${e.count})`);

  return ranking;
}

function main() {
  const cmd = process.argv[2] || 'report';

  switch (cmd) {
    case 'track': {
      const type = process.argv[3];
      const name = process.argv[4];
      if (!type || !name) {
        console.log('Usage: node usage-tracker.js track <type> <name>');
        console.log('Types: skill, command, mcp, rule, reference');
        process.exit(1);
      }
      const result = trackUsage(type, name);
      console.log(`Tracked: ${type}:${name} (count: ${result.count})`);
      break;
    }
    case 'report': runReport(); break;
    case 'ranking': runRanking(); break;
    default:
      console.log('Usage: node usage-tracker.js [track|report|ranking]');
  }
}

module.exports = { loadUsageData, trackUsage, getFrequencyTier };

if (require.main === module) {
  main();
}
