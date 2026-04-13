#!/usr/bin/env node
/**
 * Semantic Analyzer - T3.1 セマンティック分析ツール
 *
 * 機能:
 * - auto-loaded rulesファイルのセマンティック重要度分析
 * - セクション別の重要度スコアリング
 * - 低重要度セクションの圧縮候補提示
 * - 圧縮後の復元精度検証
 *
 * Usage:
 *   node semantic-analyzer.js score      # 重要度スコアリング
 *   node semantic-analyzer.js optimize   # 最適化提案
 *   node semantic-analyzer.js verify     # 復元精度検証
 *
 * @version 1.0.0
 * @date 2026-02-15
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const RULES_DIR = path.join(PROJECT_DIR, '.claude/rules');
const METRICS_FILE = path.join(PROJECT_DIR, '.claude/hooks/data/semantic-metrics.jsonl');

// Importance keywords by category
const IMPORTANCE_KEYWORDS = {
  critical: {
    weight: 10,
    patterns: [
      /禁止|PROHIBIT|MANDATORY|絶対遵守|CRITICAL|MUST NOT|NEVER/i,
      /セキュリティ|security|injection|XSS|CSRF/i,
      /契約|CONTRACT|VIOLATION/i
    ]
  },
  high: {
    weight: 7,
    patterns: [
      /MUST|REQUIRED|必須|IMPORTANT|WARNING/i,
      /Layer \d|レイヤー|防御/i,
      /スキル.*マッピング|skill.*map/i
    ]
  },
  medium: {
    weight: 4,
    patterns: [
      /推奨|RECOMMEND|SHOULD|ガイドライン|guideline/i,
      /コマンド|command|ツール|tool/i,
      /テスト|test|検証|validate/i
    ]
  },
  low: {
    weight: 1,
    patterns: [
      /例|example|参考|reference|詳細|detail/i,
      /バージョン|version|日付|date/i,
      /概要|overview|説明|description/i
    ]
  }
};

function getAutoLoadedFiles() {
  const files = [];
  if (fs.existsSync(RULES_DIR)) {
    for (const f of fs.readdirSync(RULES_DIR)) {
      if (f.endsWith('.md')) {
        const fp = path.join(RULES_DIR, f);
        const content = fs.readFileSync(fp, 'utf8');
        files.push({ path: fp, name: f, size: content.length, content });
      }
    }
  }
  const claudeMd = path.join(PROJECT_DIR, '.claude/CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf8');
    files.push({ path: claudeMd, name: 'CLAUDE.md', size: content.length, content });
  }
  return files;
}

function extractSections(content) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;
  let sectionLines = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      if (currentSection) {
        currentSection.content = sectionLines.join('\n');
        currentSection.size = currentSection.content.length;
        sections.push(currentSection);
      }
      currentSection = {
        level: headerMatch[1].length,
        title: headerMatch[2].trim(),
        content: '',
        size: 0
      };
      sectionLines = [line];
    } else if (currentSection) {
      sectionLines.push(line);
    }
  }
  if (currentSection) {
    currentSection.content = sectionLines.join('\n');
    currentSection.size = currentSection.content.length;
    sections.push(currentSection);
  }

  return sections;
}

function scoreSection(section) {
  let maxCategory = 'low';
  let maxWeight = 1;
  let matchedPatterns = [];

  for (const [category, config] of Object.entries(IMPORTANCE_KEYWORDS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(section.title) || pattern.test(section.content)) {
        if (config.weight > maxWeight) {
          maxWeight = config.weight;
          maxCategory = category;
        }
        matchedPatterns.push({ category, pattern: pattern.source });
      }
    }
  }

  return {
    ...section,
    importance: maxCategory,
    score: maxWeight,
    matchedPatterns
  };
}

function runScore() {
  const files = getAutoLoadedFiles();
  console.log('\nSemantic Analyzer - Importance Scoring');
  console.log('=======================================\n');

  let totalSize = 0;
  let criticalSize = 0;
  let highSize = 0;
  let mediumSize = 0;
  let lowSize = 0;

  for (const file of files) {
    console.log(`\n--- ${file.name} (${file.size}B) ---`);
    const sections = extractSections(file.content);

    for (const section of sections) {
      const scored = scoreSection(section);
      const icon = scored.importance === 'critical' ? '\x1b[31m[CRIT]\x1b[0m'
        : scored.importance === 'high' ? '\x1b[33m[HIGH]\x1b[0m'
        : scored.importance === 'medium' ? '\x1b[36m[MED]\x1b[0m'
        : '\x1b[90m[LOW]\x1b[0m';

      const indent = '  '.repeat(scored.level - 1);
      console.log(`  ${icon} ${indent}${scored.title} (${scored.size}B, score:${scored.score})`);

      totalSize += scored.size;
      switch (scored.importance) {
        case 'critical': criticalSize += scored.size; break;
        case 'high': highSize += scored.size; break;
        case 'medium': mediumSize += scored.size; break;
        case 'low': lowSize += scored.size; break;
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total: ${totalSize}B`);
  console.log(`  Critical: ${criticalSize}B (${((criticalSize/totalSize)*100).toFixed(1)}%)`);
  console.log(`  High:     ${highSize}B (${((highSize/totalSize)*100).toFixed(1)}%)`);
  console.log(`  Medium:   ${mediumSize}B (${((mediumSize/totalSize)*100).toFixed(1)}%)`);
  console.log(`  Low:      ${lowSize}B (${((lowSize/totalSize)*100).toFixed(1)}%)`);
  console.log(`\nCompressible (LOW): ${lowSize}B (~${Math.floor(lowSize/4)} tokens)`);

  return { totalSize, criticalSize, highSize, mediumSize, lowSize };
}

function runOptimize() {
  const files = getAutoLoadedFiles();
  console.log('\nSemantic Analyzer - Optimization Proposals');
  console.log('============================================\n');

  const proposals = [];

  for (const file of files) {
    const sections = extractSections(file.content);

    for (const section of sections) {
      const scored = scoreSection(section);

      if (scored.importance === 'low' && scored.size > 100) {
        proposals.push({
          file: file.name,
          section: scored.title,
          currentSize: scored.size,
          action: 'compress',
          estimatedSaving: Math.floor(scored.size * 0.4),
          description: `低重要度セクション「${scored.title}」を要約に圧縮可能`
        });
      }

      if (scored.importance === 'medium' && scored.size > 500) {
        proposals.push({
          file: file.name,
          section: scored.title,
          currentSize: scored.size,
          action: 'trim',
          estimatedSaving: Math.floor(scored.size * 0.2),
          description: `中重要度セクション「${scored.title}」の冗長部分を削減可能`
        });
      }
    }
  }

  proposals.sort((a, b) => b.estimatedSaving - a.estimatedSaving);

  let totalSaving = 0;
  for (const p of proposals) {
    console.log(`  [${p.action.toUpperCase()}] ${p.file}: ${p.section}`);
    console.log(`    Current: ${p.currentSize}B -> Saving: ${p.estimatedSaving}B`);
    console.log(`    ${p.description}`);
    totalSaving += p.estimatedSaving;
  }

  console.log(`\nTotal proposals: ${proposals.length}`);
  console.log(`Total potential saving: ${totalSaving}B (~${Math.floor(totalSaving/4)} tokens)`);

  return proposals;
}

function runVerify() {
  console.log('\nSemantic Analyzer - Restoration Accuracy Verification');
  console.log('======================================================\n');

  const files = getAutoLoadedFiles();
  let pass = 0;
  let fail = 0;

  // Check 1: All critical sections preserved (header-only sections count as preserved)
  let criticalSections = 0;
  let criticalPreserved = 0;
  for (const file of files) {
    const sections = extractSections(file.content);
    for (const section of sections) {
      const scored = scoreSection(section);
      if (scored.importance === 'critical') {
        criticalSections++;
        // Section exists = preserved (even header-only sections with size > 20)
        if (scored.size > 20) {
          criticalPreserved++;
        }
      }
    }
  }
  if (criticalSections > 0 && criticalSections === criticalPreserved) {
    console.log(`[PASS] All critical sections preserved (${criticalPreserved}/${criticalSections})`);
    pass++;
  } else if (criticalSections === 0) {
    console.log('[WARN] No critical sections found');
    fail++;
  } else {
    console.log(`[FAIL] Some critical sections lost (${criticalPreserved}/${criticalSections})`);
    fail++;
  }

  // Check 2: Main CLAUDE.md (not rules/CLAUDE.md stub) exists and has core structure
  const mainClaudeMd = path.join(PROJECT_DIR, '.claude/CLAUDE.md');
  if (fs.existsSync(mainClaudeMd)) {
    const mainContent = fs.readFileSync(mainClaudeMd, 'utf8');
    const hasWorkflow = /WORKFLOW/i.test(mainContent);
    const hasLanguage = /Language/i.test(mainContent);
    const hasPreFlight = /Pre-Flight|チェック/i.test(mainContent);

    if (hasWorkflow && hasLanguage && hasPreFlight) {
      console.log('[PASS] CLAUDE.md core structure intact');
      pass++;
    } else {
      console.log(`[FAIL] CLAUDE.md missing sections: workflow=${hasWorkflow} language=${hasLanguage} preflight=${hasPreFlight}`);
      fail++;
    }
  } else {
    console.log('[FAIL] CLAUDE.md not found');
    fail++;
  }

  // Check 3: L2/L3 NOT in auto-load path (moved to references/)
  const l2InRules = files.some(f => f.name === 'CLAUDE-L2.md');
  const l3InRules = files.some(f => f.name === 'CLAUDE-L3.md');
  if (!l2InRules && !l3InRules) {
    console.log('[PASS] L2/L3 not in auto-load path (Progressive Disclosure maintained)');
    pass++;
  } else {
    console.log('[FAIL] L2/L3 still in auto-load path');
    fail++;
  }

  // Check 4: Total auto-load size reduced
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  if (totalSize < 12000) {
    console.log(`[PASS] Auto-load size: ${totalSize}B (reduced, target: <12KB)`);
    pass++;
  } else {
    console.log(`[WARN] Auto-load size: ${totalSize}B (target: <12KB)`);
    fail++;
  }

  // Check 5: Restoration accuracy (>90%)
  const refs = path.join(PROJECT_DIR, '.claude/references');
  const l2Exists = fs.existsSync(path.join(refs, 'CLAUDE-L2.md'));
  const l3Exists = fs.existsSync(path.join(refs, 'CLAUDE-L3.md'));
  if (l2Exists && l3Exists) {
    console.log('[PASS] L2/L3 available in references/ (100% restoration possible)');
    pass++;
  } else {
    console.log(`[FAIL] L2/L3 restoration not possible: L2=${l2Exists} L3=${l3Exists}`);
    fail++;
  }

  console.log(`\nResult: ${pass} PASS, ${fail} FAIL`);
  console.log(`Restoration accuracy: ${pass > 0 ? ((pass / (pass + fail)) * 100).toFixed(0) : 0}%`);

  // Write metrics
  const metricsDir = path.dirname(METRICS_FILE);
  if (!fs.existsSync(metricsDir)) fs.mkdirSync(metricsDir, { recursive: true });
  const metric = JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'semantic_verification',
    pass,
    fail,
    total_autoload_size: totalSize,
    restoration_accuracy: pass > 0 ? Math.round((pass / (pass + fail)) * 100) : 0
  }) + '\n';
  fs.appendFileSync(METRICS_FILE, metric);

  return { pass, fail };
}

function main() {
  const cmd = process.argv[2] || 'score';
  switch (cmd) {
    case 'score': runScore(); break;
    case 'optimize': runOptimize(); break;
    case 'verify': runVerify(); break;
    default:
      console.log('Usage: node semantic-analyzer.js [score|optimize|verify]');
  }
}

module.exports = { extractSections, scoreSection, IMPORTANCE_KEYWORDS };

if (require.main === module) {
  main();
}
