#!/usr/bin/env node
/**
 * Context Compressor - T3.1 コンテキスト圧縮ツール
 *
 * 機能:
 * - auto-loaded rulesファイルの冗長性分析
 * - 重複コンテンツ検出
 * - 圧縮実行（compress）と検証（verify）
 * - メトリクス出力
 *
 * Usage:
 *   node context-compressor.js analyze    # 冗長性分析
 *   node context-compressor.js compress   # 圧縮実行（dry-run）
 *   node context-compressor.js apply      # 圧縮適用
 *   node context-compressor.js verify     # 圧縮後の検証
 *
 * @version 1.0.0
 * @date 2026-02-15
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const RULES_DIR = path.join(PROJECT_DIR, '.claude/rules');
const REFS_DIR = path.join(PROJECT_DIR, '.claude/references');
const METRICS_FILE = path.join(PROJECT_DIR, '.claude/hooks/data/compression-metrics.jsonl');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getAutoLoadedFiles() {
  const files = [];
  // .claude/rules/*.md - all auto-loaded
  if (fs.existsSync(RULES_DIR)) {
    for (const f of fs.readdirSync(RULES_DIR)) {
      if (f.endsWith('.md')) {
        const fp = path.join(RULES_DIR, f);
        const content = fs.readFileSync(fp, 'utf8');
        files.push({
          path: fp,
          name: f,
          size: content.length,
          lines: content.split('\n').length,
          content
        });
      }
    }
  }
  // .claude/CLAUDE.md - auto-loaded
  const claudeMd = path.join(PROJECT_DIR, '.claude/CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf8');
    files.push({
      path: claudeMd,
      name: 'CLAUDE.md',
      size: content.length,
      lines: content.split('\n').length,
      content
    });
  }
  return files;
}

function findRedundancy(files) {
  const issues = [];

  // 1. L2/L3 in rules/ (should be on-demand only)
  for (const f of files) {
    if (f.name === 'CLAUDE-L2.md' || f.name === 'CLAUDE-L3.md') {
      issues.push({
        type: 'misplaced_progressive',
        file: f.name,
        size: f.size,
        severity: 'HIGH',
        description: `${f.name} は rules/ にあるため自動ロードされる。Progressive Disclosureの目的（オンデマンド読み込み）と矛盾。.claude/references/ に移動すべき。`,
        saving: f.size
      });
    }
  }

  // 2. Nearly empty files
  for (const f of files) {
    if (f.size < 200 && f.name !== 'CLAUDE.md') {
      issues.push({
        type: 'near_empty',
        file: f.name,
        size: f.size,
        severity: 'LOW',
        description: `${f.name} はほぼ空（${f.size}B）。削除または統合を検討。`,
        saving: f.size
      });
    }
  }

  // 3. Verbose content (lines with mostly whitespace or repetition)
  for (const f of files) {
    const lines = f.content.split('\n');
    const emptyLines = lines.filter(l => l.trim() === '').length;
    const ratio = emptyLines / lines.length;
    if (ratio > 0.3 && f.lines > 20) {
      issues.push({
        type: 'verbose',
        file: f.name,
        size: f.size,
        severity: 'MEDIUM',
        description: `${f.name} の空行比率が${(ratio * 100).toFixed(0)}%。圧縮の余地あり。`,
        saving: Math.floor(f.size * 0.15)
      });
    }
  }

  // 4. Duplicate section headers across files
  const headers = {};
  for (const f of files) {
    const matches = f.content.match(/^#{1,3}\s+.+$/gm) || [];
    for (const h of matches) {
      const normalized = h.replace(/^#+\s+/, '').toLowerCase().trim();
      if (!headers[normalized]) headers[normalized] = [];
      headers[normalized].push(f.name);
    }
  }
  for (const [header, fileList] of Object.entries(headers)) {
    if (fileList.length > 1) {
      issues.push({
        type: 'duplicate_section',
        files: fileList,
        severity: 'MEDIUM',
        description: `セクション「${header}」が複数ファイルに存在: ${fileList.join(', ')}`,
        saving: 100
      });
    }
  }

  return issues;
}

function compressFile(content) {
  let compressed = content;

  // Remove consecutive blank lines (keep max 1)
  compressed = compressed.replace(/\n{3,}/g, '\n\n');

  // Remove trailing whitespace
  compressed = compressed.replace(/[ \t]+$/gm, '');

  // Remove empty code blocks
  compressed = compressed.replace(/```\s*\n\s*```/g, '');

  return compressed;
}

function runAnalyze() {
  const files = getAutoLoadedFiles();
  const issues = findRedundancy(files);
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const totalSaving = issues.reduce((s, i) => s + (i.saving || 0), 0);

  console.log('\nContext Compressor - Redundancy Analysis');
  console.log('=========================================\n');
  console.log(`Auto-loaded files: ${files.length}`);
  console.log(`Total size: ${totalSize} bytes (~${Math.floor(totalSize / 4)} tokens)\n`);

  console.log('Files:');
  for (const f of files.sort((a, b) => b.size - a.size)) {
    console.log(`  ${f.size.toString().padStart(6)} B | ${f.lines.toString().padStart(4)} lines | ${f.name}`);
  }

  console.log(`\nIssues found: ${issues.length}\n`);
  for (const issue of issues.sort((a, b) => {
    const sev = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (sev[a.severity] || 3) - (sev[b.severity] || 3);
  })) {
    const icon = issue.severity === 'HIGH' ? '\x1b[31m[HIGH]\x1b[0m'
      : issue.severity === 'MEDIUM' ? '\x1b[33m[MED]\x1b[0m'
      : '\x1b[36m[LOW]\x1b[0m';
    console.log(`  ${icon} ${issue.description}`);
    if (issue.saving) console.log(`        Potential saving: ${issue.saving} bytes`);
  }

  console.log(`\nTotal potential saving: ${totalSaving} bytes (~${Math.floor(totalSaving / 4)} tokens)`);
  console.log(`Compression ratio: ${((totalSaving / totalSize) * 100).toFixed(1)}%`);

  return { files, issues, totalSize, totalSaving };
}

function runCompress() {
  const files = getAutoLoadedFiles();
  console.log('\nContext Compressor - Dry Run');
  console.log('============================\n');

  let totalBefore = 0;
  let totalAfter = 0;

  for (const f of files) {
    const compressed = compressFile(f.content);
    const saved = f.size - compressed.length;
    totalBefore += f.size;
    totalAfter += compressed.length;

    if (saved > 0) {
      console.log(`  ${f.name}: ${f.size}B -> ${compressed.length}B (saved ${saved}B)`);
    } else {
      console.log(`  ${f.name}: ${f.size}B (no change)`);
    }
  }

  console.log(`\nTotal: ${totalBefore}B -> ${totalAfter}B (saved ${totalBefore - totalAfter}B)`);

  // L2/L3 move suggestion
  const l2 = files.find(f => f.name === 'CLAUDE-L2.md');
  const l3 = files.find(f => f.name === 'CLAUDE-L3.md');
  if (l2 || l3) {
    const moveSaving = (l2 ? l2.size : 0) + (l3 ? l3.size : 0);
    console.log(`\nL2/L3 move to references/: additional ${moveSaving}B saving`);
    console.log(`Grand total saving: ${(totalBefore - totalAfter) + moveSaving}B`);
  }
}

function runApply() {
  const files = getAutoLoadedFiles();
  ensureDir(REFS_DIR);

  let totalSaved = 0;

  // 1. Move L2/L3 to references/
  for (const f of files) {
    if (f.name === 'CLAUDE-L2.md' || f.name === 'CLAUDE-L3.md') {
      const dest = path.join(REFS_DIR, f.name);
      fs.writeFileSync(dest, f.content);
      fs.unlinkSync(f.path);
      totalSaved += f.size;
      console.log(`  MOVED: ${f.name} -> .claude/references/ (${f.size}B saved from auto-load)`);
    }
  }

  // 2. Compress remaining files
  for (const f of files) {
    if (f.name === 'CLAUDE-L2.md' || f.name === 'CLAUDE-L3.md') continue;
    const compressed = compressFile(f.content);
    const saved = f.size - compressed.length;
    if (saved > 0) {
      fs.writeFileSync(f.path, compressed);
      totalSaved += saved;
      console.log(`  COMPRESSED: ${f.name} (${saved}B saved)`);
    }
  }

  console.log(`\nTotal saved: ${totalSaved}B (~${Math.floor(totalSaved / 4)} tokens)`);

  // 3. Write metrics
  ensureDir(path.dirname(METRICS_FILE));
  const metric = JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'compression_applied',
    bytes_saved: totalSaved,
    tokens_saved: Math.floor(totalSaved / 4)
  }) + '\n';
  fs.appendFileSync(METRICS_FILE, metric);

  return totalSaved;
}

function runVerify() {
  console.log('\nContext Compressor - Verification');
  console.log('==================================\n');

  const files = getAutoLoadedFiles();
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  let pass = 0;
  let fail = 0;

  // Check L2/L3 NOT in rules/
  const l2InRules = files.some(f => f.name === 'CLAUDE-L2.md');
  const l3InRules = files.some(f => f.name === 'CLAUDE-L3.md');

  if (!l2InRules) { console.log('[PASS] L2 not in auto-load path'); pass++; }
  else { console.log('[FAIL] L2 still in auto-load path'); fail++; }

  if (!l3InRules) { console.log('[PASS] L3 not in auto-load path'); pass++; }
  else { console.log('[FAIL] L3 still in auto-load path'); fail++; }

  // Check L2/L3 exist in references/
  const l2Ref = path.join(REFS_DIR, 'CLAUDE-L2.md');
  const l3Ref = path.join(REFS_DIR, 'CLAUDE-L3.md');

  if (fs.existsSync(l2Ref)) { console.log('[PASS] L2 in references/'); pass++; }
  else { console.log('[FAIL] L2 not in references/'); fail++; }

  if (fs.existsSync(l3Ref)) { console.log('[PASS] L3 in references/'); pass++; }
  else { console.log('[FAIL] L3 not in references/'); fail++; }

  // Check total auto-load size reduced
  if (totalSize < 14000) {
    console.log(`[PASS] Auto-load size: ${totalSize}B (reduced from ~16KB)`);
    pass++;
  } else {
    console.log(`[WARN] Auto-load size: ${totalSize}B (target: <14KB)`);
    fail++;
  }

  // Check help commands still reference correct paths
  const helpAdv = path.join(PROJECT_DIR, '.claude/commands/help-advanced.md');
  const helpExp = path.join(PROJECT_DIR, '.claude/commands/help-expert.md');

  if (fs.existsSync(helpAdv)) { console.log('[PASS] /help-advanced command exists'); pass++; }
  else { console.log('[FAIL] /help-advanced missing'); fail++; }

  if (fs.existsSync(helpExp)) { console.log('[PASS] /help-expert command exists'); pass++; }
  else { console.log('[FAIL] /help-expert missing'); fail++; }

  console.log(`\nResult: ${pass} PASS, ${fail} FAIL`);
  console.log(`Auto-load size: ${totalSize}B (~${Math.floor(totalSize / 4)} tokens)`);
}

async function main() {
  const cmd = process.argv[2] || 'analyze';

  switch (cmd) {
    case 'analyze': runAnalyze(); break;
    case 'compress': runCompress(); break;
    case 'apply': runApply(); break;
    case 'verify': runVerify(); break;
    default:
      console.log('Usage: node context-compressor.js [analyze|compress|apply|verify]');
  }
}

module.exports = { getAutoLoadedFiles, findRedundancy, compressFile };

if (require.main === module) {
  main();
}
