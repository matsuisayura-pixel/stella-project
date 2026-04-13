#!/usr/bin/env node
/**
 * Session Continue Guard - セッション継続時の強制チェック
 *
 * このフックは SessionStart (source: resume) 時に実行され、
 * 既存の作業ファイルを確認してコンテキストに追加します。
 *
 * 防止する問題:
 * - 既存スクリプトを無視して新しいものを作成
 * - 前セッションのワークフローを引き継がない
 */

const fs = require('fs');
const path = require('path');

async function main() {
  let input = {};

  // stdin から JSON を読み取り
  try {
    const stdinData = await readStdin();
    if (stdinData) {
      input = JSON.parse(stdinData);
    }
  } catch (e) {
    // パース失敗は無視
  }

  // resume 時のみ実行
  if (input.source !== 'resume') {
    process.exit(0);
    return;
  }

  const cwd = input.cwd || process.cwd();
  const context = [];

  context.push('=== SESSION CONTINUE GUARD ===');
  context.push('');
  context.push('**CRITICAL: セッション継続時の必須確認**');
  context.push('');

  // 1. 直近の作業ディレクトリを検出
  const recentDirs = findRecentWorkDirs(cwd);
  if (recentDirs.length > 0) {
    context.push('## 直近の作業ディレクトリ（確認必須）');
    context.push('');
    recentDirs.forEach(dir => {
      context.push(`- ${dir}`);
    });
    context.push('');
  }

  // 2. 既存のスクリプトファイルを検出
  const scripts = findExistingScripts(cwd);
  if (scripts.length > 0) {
    context.push('## 既存スクリプト（作成前に必ず確認）');
    context.push('');
    scripts.forEach(script => {
      context.push(`- ${script}`);
    });
    context.push('');
    context.push('**WARNING**: 新しいスクリプトを作成する前に、必ず既存スクリプトを Read ツールで確認してください。');
    context.push('');
  }

  // 3. ワークフロー関連ファイルを検出
  const workflows = findWorkflowFiles(cwd);
  if (workflows.length > 0) {
    context.push('## 既存ワークフロー定義');
    context.push('');
    workflows.forEach(wf => {
      context.push(`- ${wf}`);
    });
    context.push('');
  }

  // 4. SESSION_HANDOFF.mdの検出
  const handoffs = findSessionHandoffs(cwd);
  if (handoffs.length > 0) {
    context.push('## SESSION_HANDOFF.md検出（必ず読め）');
    context.push('');
    handoffs.forEach(h => {
      context.push(`- ${h}`);
    });
    context.push('');
    context.push('**CRITICAL**: 上記ファイルを Read ツールで読んでから作業を開始せよ。');
    context.push('');
  }

  // 5. mistakes.mdの読み込み
  const mistakesPath = path.join(__dirname, 'mistakes.md');
  if (fs.existsSync(mistakesPath)) {
    context.push('## 過去のミス記録（再発防止）');
    context.push('');
    context.push('**WARNING**: .claude/hooks/mistakes.md に過去のミスが記録されています。');
    context.push('同じミスを繰り返さないために、必ず確認してください。');
    context.push('');
  }

  // 6. 強制確認事項
  context.push('## 継続前の強制確認事項');
  context.push('');
  context.push('1. [ ] 前セッションの指示内容を再確認しましたか？');
  context.push('2. [ ] 「同じワークフロー」「同じスクリプト」の指示がありますか？');
  context.push('3. [ ] 既存ファイルを確認してから作業を開始しますか？');
  context.push('4. [ ] 新しいファイル作成前にユーザーに確認しますか？');
  context.push('5. [ ] SESSION_HANDOFF.mdを読みましたか？');
  context.push('6. [ ] mistakes.mdで過去のミスを確認しましたか？');
  context.push('');
  context.push('**ユーザーの指示を最優先してください。推測で作業を進めないでください。**');
  context.push('');
  context.push('=== END SESSION CONTINUE GUARD ===');

  // コンテキストとして出力
  console.log(context.join('\n'));
  process.exit(0);
}

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
    setTimeout(finish, timeout);

    if (process.stdin.isTTY) finish();
  });
}

function findRecentWorkDirs(cwd) {
  const dirs = [];
  try {
    // Desktop 以下の最近変更されたディレクトリを検索
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

function findExistingScripts(cwd) {
  const scripts = [];
  const patterns = ['create_video.py', 'generate.py', 'process.py', 'main.py', 'run.sh'];

  try {
    // カレントディレクトリとサブディレクトリを検索
    searchDir(cwd, patterns, scripts, 2);

    // Desktop も検索
    const desktop = path.join(process.env.HOME, 'Desktop');
    searchDir(desktop, patterns, scripts, 2);
  } catch (e) {}

  return [...new Set(scripts)].slice(0, 10);
}

function searchDir(dir, patterns, results, depth) {
  if (depth <= 0) return;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && patterns.some(p => entry.name === p)) {
        results.push(fullPath);
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        searchDir(fullPath, patterns, results, depth - 1);
      }
    });
  } catch (e) {}
}

function findWorkflowFiles(cwd) {
  const workflows = [];

  try {
    // config/workflows を検索
    const workflowDir = path.join(cwd, 'config/workflows');
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

function findSessionHandoffs(cwd) {
  const handoffs = [];

  try {
    // カレントディレクトリ
    const cwdHandoff = path.join(cwd, 'SESSION_HANDOFF.md');
    if (fs.existsSync(cwdHandoff)) {
      handoffs.push(cwdHandoff);
    }

    // Desktop以下を検索
    const desktop = path.join(process.env.HOME, 'Desktop');
    if (fs.existsSync(desktop)) {
      const entries = fs.readdirSync(desktop, { withFileTypes: true });

      entries.forEach(entry => {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const handoffPath = path.join(desktop, entry.name, 'SESSION_HANDOFF.md');
          if (fs.existsSync(handoffPath)) {
            handoffs.push(handoffPath);
          }
        }
      });
    }
  } catch (e) {}

  return [...new Set(handoffs)].slice(0, 5);
}

main().catch(() => process.exit(0));
