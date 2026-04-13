#!/usr/bin/env node
/**
 * Session Handoff Generator - セッション終了時の状態記録
 *
 * SessionEnd時に実行され、SESSION_HANDOFF.mdを自動生成します。
 * 次のセッションで確実に状態を引き継ぐための仕組みです。
 *
 * 防止する問題:
 * - セッション間での状態の引き継ぎ失敗
 * - 「同じワークフロー」指示の無視
 * - 前回の作業内容の忘却
 */

const fs = require('fs');
const path = require('path');
const { readStdin } = require('./utils/read-stdin');

async function main() {
  let input = {};

  try {
    const stdinData = await readStdin();
    if (stdinData) {
      input = JSON.parse(stdinData);
    }
  } catch (e) {
    process.exit(0);
    return;
  }

  const cwd = input.cwd || process.cwd();

  // 作業ディレクトリを特定（Desktop以下の最近変更されたディレクトリ）
  const workDirs = findRecentWorkDirs();

  for (const workDir of workDirs) {
    generateHandoff(workDir);
  }

  // カレントディレクトリにも生成
  if (cwd && fs.existsSync(cwd)) {
    generateHandoff(cwd);
  }

  process.exit(0);
}

function generateHandoff(dir) {
  const handoffPath = path.join(dir, 'SESSION_HANDOFF.md');

  // 既存のスクリプトを検出
  const scripts = findScripts(dir);
  const workflows = findWorkflows(dir);
  const outputs = findOutputs(dir);

  // ハンドオフドキュメントを生成
  const content = buildHandoffContent(dir, scripts, workflows, outputs);

  try {
    fs.writeFileSync(handoffPath, content, 'utf8');
  } catch (e) {
    // 書き込み失敗は無視
  }
}

function buildHandoffContent(dir, scripts, workflows, outputs) {
  const timestamp = new Date().toISOString();
  const lines = [];

  lines.push('# SESSION HANDOFF DOCUMENT');
  lines.push('');
  lines.push('> **CRITICAL**: 次のセッションは必ずこのファイルを読んでから作業を開始すること');
  lines.push('');
  lines.push(`**最終更新**: ${timestamp}`);
  lines.push(`**作業ディレクトリ**: ${dir}`);
  lines.push('');

  // 既存スクリプト
  if (scripts.length > 0) {
    lines.push('## 既存スクリプト（MUST READ）');
    lines.push('');
    lines.push('```');
    lines.push('┌─────────────────────────────────────────────────────────┐');
    lines.push('│  「同じワークフロー」指示がある場合、以下を必ず使用    │');
    lines.push('└─────────────────────────────────────────────────────────┘');
    lines.push('```');
    lines.push('');
    scripts.forEach(script => {
      const stat = fs.statSync(script);
      lines.push(`- \`${path.relative(dir, script)}\` (${formatSize(stat.size)}, ${formatDate(stat.mtime)})`);
    });
    lines.push('');
  }

  // ワークフロー定義
  if (workflows.length > 0) {
    lines.push('## ワークフロー定義');
    lines.push('');
    workflows.forEach(wf => {
      lines.push(`- \`${path.relative(dir, wf)}\``);
    });
    lines.push('');
  }

  // 出力ファイル
  if (outputs.length > 0) {
    lines.push('## 生成された出力');
    lines.push('');
    outputs.slice(0, 10).forEach(out => {
      lines.push(`- \`${path.relative(dir, out)}\``);
    });
    if (outputs.length > 10) {
      lines.push(`- ... 他 ${outputs.length - 10} ファイル`);
    }
    lines.push('');
  }

  // 強制ルール
  lines.push('## 次のセッションへの指示');
  lines.push('');
  lines.push('### MUST DO（必須）');
  lines.push('');
  lines.push('1. **このファイルを読む** - 作業開始前に必ず');
  lines.push('2. **既存スクリプトを確認** - 新規作成前にReadツールで読む');
  lines.push('3. **ユーザー指示を優先** - 推測で作業しない');
  lines.push('4. **スキル指定を遵守** - 「〇〇スキルを使って」は必ずSkillツールで');
  lines.push('');
  lines.push('### MUST NOT DO（禁止）');
  lines.push('');
  lines.push('1. **既存ファイルを無視して新規作成** - 絶対禁止');
  lines.push('2. **「シンプルにする」と称して異なる実装** - 絶対禁止');
  lines.push('3. **指定比率を無視した要約** - 絶対禁止');
  lines.push('4. **スキル指示を無視した手動実装** - 絶対禁止');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*このファイルはセッション終了時に自動生成されます*');

  return lines.join('\n');
}

function findRecentWorkDirs() {
  const dirs = [];
  try {
    const desktop = path.join(process.env.HOME, 'Desktop');
    if (fs.existsSync(desktop)) {
      const entries = fs.readdirSync(desktop, { withFileTypes: true });
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      entries.forEach(entry => {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const fullPath = path.join(desktop, entry.name);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.mtimeMs > oneHourAgo) {
              dirs.push(fullPath);
            }
          } catch (e) {}
        }
      });
    }
  } catch (e) {}
  return dirs.slice(0, 5);
}

function findScripts(dir) {
  const scripts = [];
  const patterns = ['.py', '.sh', '.js'];

  try {
    searchFiles(dir, patterns, scripts, 3);
  } catch (e) {}

  return scripts.filter(s => {
    const name = path.basename(s);
    return name.includes('create') ||
           name.includes('generate') ||
           name.includes('process') ||
           name.includes('main') ||
           name.includes('run');
  }).slice(0, 10);
}

function findWorkflows(dir) {
  const workflows = [];

  try {
    const workflowDir = path.join(dir, 'config', 'workflows');
    if (fs.existsSync(workflowDir)) {
      const files = fs.readdirSync(workflowDir);
      files.forEach(file => {
        if (file.endsWith('.json') || file.endsWith('.yaml')) {
          workflows.push(path.join(workflowDir, file));
        }
      });
    }
  } catch (e) {}

  return workflows.slice(0, 5);
}

function findOutputs(dir) {
  const outputs = [];

  try {
    const outputDir = path.join(dir, 'output');
    if (fs.existsSync(outputDir)) {
      searchFiles(outputDir, ['.mp4', '.mp3', '.png', '.jpg', '.pdf'], outputs, 2);
    }
  } catch (e) {}

  return outputs;
}

function searchFiles(dir, extensions, results, depth) {
  if (depth <= 0) return;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        searchFiles(fullPath, extensions, results, depth - 1);
      }
    });
  } catch (e) {}
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDate(date) {
  return new Date(date).toLocaleString('ja-JP');
}

main().catch(() => process.exit(0));
