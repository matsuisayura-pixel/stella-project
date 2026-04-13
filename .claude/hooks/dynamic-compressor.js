#!/usr/bin/env node
/**
 * Dynamic Compressor - T3.2 コンテンツ動的圧縮
 *
 * 機能:
 * - 使用頻度に応じたコンテンツ詳細度調整
 * - スキル/MCP/ルール内容の動的要約
 * - キャッシュ機構
 *
 * Usage:
 *   node dynamic-compressor.js compress <file>  # ファイル動的圧縮
 *   node dynamic-compressor.js status           # 圧縮状態表示
 *   node dynamic-compressor.js cache-stats      # キャッシュ統計
 *
 * @version 1.0.0
 * @date 2026-02-15
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const DATA_DIR = path.join(PROJECT_DIR, '.claude/hooks/data');
const CACHE_FILE = path.join(DATA_DIR, 'dynamic-cache.json');
const METRICS_FILE = path.join(DATA_DIR, 'dynamic-compressor-metrics.jsonl');

// Import usage tracker
let usageTracker;
try {
  usageTracker = require('./usage-tracker.js');
} catch {
  usageTracker = null;
}

const DETAIL_LEVELS = {
  full: { maxLines: Infinity, keepExamples: true, keepComments: true },
  standard: { maxLines: 100, keepExamples: true, keepComments: false },
  summary: { maxLines: 40, keepExamples: false, keepComments: false },
  minimal: { maxLines: 15, keepExamples: false, keepComments: false }
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      // Expire entries older than 1 hour
      const now = Date.now();
      const entries = {};
      for (const [key, entry] of Object.entries(data.entries || {})) {
        if (now - new Date(entry.cached).getTime() < 3600000) {
          entries[key] = entry;
        }
      }
      return { ...data, entries };
    } catch {
      return { version: '1.0.0', entries: {} };
    }
  }
  return { version: '1.0.0', entries: {} };
}

function saveCache(cache) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function getDetailLevel(filePath) {
  if (!usageTracker) return 'standard';

  const data = usageTracker.loadUsageData();
  const name = path.basename(filePath, path.extname(filePath));

  // Check all types for this name
  for (const entry of Object.values(data.entries)) {
    if (entry.name === name || entry.name === path.basename(filePath)) {
      const freq = usageTracker.getFrequencyTier(entry.count);
      return freq.detail;
    }
  }

  return 'standard'; // default
}

function compressContent(content, detailLevel) {
  const config = DETAIL_LEVELS[detailLevel] || DETAIL_LEVELS.standard;
  let lines = content.split('\n');
  const originalSize = content.length;

  // Remove comments if configured
  if (!config.keepComments) {
    lines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('<!--');
    });
  }

  // Remove code examples if configured
  if (!config.keepExamples) {
    let inCodeBlock = false;
    lines = lines.filter(line => {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return false;
      }
      return !inCodeBlock;
    });
  }

  // Remove excessive blank lines
  const filtered = [];
  let prevEmpty = false;
  for (const line of lines) {
    const isEmpty = line.trim() === '';
    if (isEmpty && prevEmpty) continue;
    filtered.push(line);
    prevEmpty = isEmpty;
  }
  lines = filtered;

  // Truncate to max lines
  if (lines.length > config.maxLines) {
    lines = lines.slice(0, config.maxLines);
    lines.push(`\n... (truncated to ${config.maxLines} lines, use /help-advanced or /help-expert for full content)`);
  }

  const compressed = lines.join('\n');
  return {
    content: compressed,
    originalSize,
    compressedSize: compressed.length,
    saved: originalSize - compressed.length,
    detailLevel,
    linesOriginal: content.split('\n').length,
    linesCompressed: lines.length
  };
}

function compressFile(filePath) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_DIR, filePath);
  if (!fs.existsSync(absPath)) {
    console.log(`File not found: ${absPath}`);
    return null;
  }

  // Check cache
  const cache = loadCache();
  const stat = fs.statSync(absPath);
  const cacheKey = absPath;

  if (cache.entries[cacheKey] && cache.entries[cacheKey].mtime === stat.mtimeMs.toString()) {
    console.log(`[CACHE HIT] ${path.basename(filePath)}`);
    return cache.entries[cacheKey].result;
  }

  const content = fs.readFileSync(absPath, 'utf8');
  const detailLevel = getDetailLevel(absPath);
  const result = compressContent(content, detailLevel);

  // Save to cache
  cache.entries[cacheKey] = {
    cached: new Date().toISOString(),
    mtime: stat.mtimeMs.toString(),
    result
  };
  saveCache(cache);

  return result;
}

function runCompress() {
  const filePath = process.argv[3];
  if (!filePath) {
    console.log('Usage: node dynamic-compressor.js compress <file>');
    return;
  }

  const result = compressFile(filePath);
  if (result) {
    console.log(`\nDynamic Compressor - Result`);
    console.log(`===========================`);
    console.log(`File: ${filePath}`);
    console.log(`Detail level: ${result.detailLevel}`);
    console.log(`Original: ${result.originalSize}B (${result.linesOriginal} lines)`);
    console.log(`Compressed: ${result.compressedSize}B (${result.linesCompressed} lines)`);
    console.log(`Saved: ${result.saved}B (${((result.saved / result.originalSize) * 100).toFixed(1)}%)`);
  }
}

function runStatus() {
  console.log('\nDynamic Compressor - Status');
  console.log('============================\n');

  // Scan auto-loaded files
  const rulesDir = path.join(PROJECT_DIR, '.claude/rules');
  const files = [];

  if (fs.existsSync(rulesDir)) {
    for (const f of fs.readdirSync(rulesDir)) {
      if (f.endsWith('.md')) {
        files.push(path.join(rulesDir, f));
      }
    }
  }
  const claudeMd = path.join(PROJECT_DIR, '.claude/CLAUDE.md');
  if (fs.existsSync(claudeMd)) files.push(claudeMd);

  let totalOriginal = 0;
  let totalCompressed = 0;

  for (const fp of files) {
    const result = compressFile(fp);
    if (result) {
      const name = path.basename(fp);
      const level = result.detailLevel;
      const pct = result.originalSize > 0 ? ((result.saved / result.originalSize) * 100).toFixed(0) : 0;
      console.log(`  [${level.toUpperCase().padEnd(8)}] ${name}: ${result.originalSize}B -> ${result.compressedSize}B (-${pct}%)`);
      totalOriginal += result.originalSize;
      totalCompressed += result.compressedSize;
    }
  }

  const totalSaved = totalOriginal - totalCompressed;
  console.log(`\nTotal: ${totalOriginal}B -> ${totalCompressed}B`);
  console.log(`Saved: ${totalSaved}B (~${Math.floor(totalSaved / 4)} tokens)`);

  // Write metrics
  ensureDir(DATA_DIR);
  const metric = JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'dynamic_compression_status',
    original_bytes: totalOriginal,
    compressed_bytes: totalCompressed,
    saved_bytes: totalSaved,
    file_count: files.length
  }) + '\n';
  fs.appendFileSync(METRICS_FILE, metric);
}

function runCacheStats() {
  const cache = loadCache();
  const entries = Object.entries(cache.entries || {});

  console.log('\nDynamic Compressor - Cache Stats');
  console.log('=================================\n');
  console.log(`Cache entries: ${entries.length}`);

  let totalSaved = 0;
  for (const [key, entry] of entries) {
    if (entry.result) {
      console.log(`  ${path.basename(key)}: ${entry.result.detailLevel} (saved ${entry.result.saved}B)`);
      totalSaved += entry.result.saved;
    }
  }

  console.log(`\nTotal cached savings: ${totalSaved}B (~${Math.floor(totalSaved / 4)} tokens)`);
}

function main() {
  const cmd = process.argv[2] || 'status';
  switch (cmd) {
    case 'compress': runCompress(); break;
    case 'status': runStatus(); break;
    case 'cache-stats': runCacheStats(); break;
    default:
      console.log('Usage: node dynamic-compressor.js [compress|status|cache-stats]');
  }
}

module.exports = { compressContent, compressFile, getDetailLevel, DETAIL_LEVELS };

if (require.main === module) {
  main();
}
