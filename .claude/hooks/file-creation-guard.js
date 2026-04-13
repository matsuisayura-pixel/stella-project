#!/usr/bin/env node
/**
 * File Creation Guard - 新規ファイル作成前の確認
 *
 * PreToolUse (Write) 時に実行され、
 * 新規スクリプトファイル作成時に既存ファイルの存在を確認します。
 *
 * 防止する問題:
 * - 既存スクリプトを無視して新しいものを作成
 * - 意図しないファイルの上書き
 */

const fs = require('fs');
const path = require('path');

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

  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path || '';

  // スクリプトファイルのパターン
  const scriptPatterns = [
    /create_video\.py$/,
    /generate.*\.py$/,
    /process.*\.py$/,
    /main\.py$/,
    /run\.sh$/,
    /build\.sh$/,
  ];

  const isScript = scriptPatterns.some(p => p.test(filePath));

  if (!isScript) {
    process.exit(0);
    return;
  }

  // 既存ファイルの存在チェック
  const existingFile = fs.existsSync(filePath);

  // 同じディレクトリまたは親ディレクトリに類似ファイルがないか確認
  const dir = path.dirname(filePath);
  const similarFiles = findSimilarFiles(dir, path.basename(filePath));

  // Desktop 以下に同名ファイルがないか確認
  const desktopSimilar = findDesktopSimilarFiles(path.basename(filePath));

  if (existingFile || similarFiles.length > 0 || desktopSimilar.length > 0) {
    // additionalContext を追加して警告
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: buildWarningContext(filePath, existingFile, similarFiles, desktopSimilar)
      }
    };

    console.log(JSON.stringify(output));
    process.exit(0);
    return;
  }

  process.exit(0);
}

function buildWarningContext(filePath, existingFile, similarFiles, desktopSimilar) {
  const lines = [];

  lines.push('');
  lines.push('=== FILE CREATION GUARD WARNING ===');
  lines.push('');
  lines.push(`作成しようとしているファイル: ${filePath}`);
  lines.push('');

  if (existingFile) {
    lines.push('**CRITICAL: 同名のファイルが既に存在します！**');
    lines.push('');
    lines.push('上書きする前に、既存ファイルの内容を確認してください:');
    lines.push(`  Read ${filePath}`);
    lines.push('');
  }

  if (similarFiles.length > 0) {
    lines.push('**WARNING: 同じディレクトリに類似ファイルが存在します:**');
    lines.push('');
    similarFiles.forEach(f => {
      lines.push(`  - ${f}`);
    });
    lines.push('');
    lines.push('これらのファイルを確認せずに新しいスクリプトを作成していませんか？');
    lines.push('「同じワークフローで」という指示がある場合、既存ファイルを使用すべきです。');
    lines.push('');
  }

  if (desktopSimilar.length > 0) {
    lines.push('**INFO: Desktop以下に同名/類似ファイルが見つかりました:**');
    lines.push('');
    desktopSimilar.forEach(f => {
      lines.push(`  - ${f}`);
    });
    lines.push('');
    lines.push('これらは以前のセッションで作成されたファイルかもしれません。');
    lines.push('「同じワークフローで」という指示がある場合、これらを参照すべきです。');
    lines.push('');
  }

  lines.push('**確認事項:**');
  lines.push('1. ユーザーは新しいスクリプトの作成を明示的に要求しましたか？');
  lines.push('2. 既存のスクリプトを確認しましたか？');
  lines.push('3. 「同じワークフローで」という指示はありませんでしたか？');
  lines.push('');
  lines.push('=== END FILE CREATION GUARD WARNING ===');
  lines.push('');

  return lines.join('\n');
}

function findSimilarFiles(dir, filename) {
  const similar = [];

  try {
    if (!fs.existsSync(dir)) return similar;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const basename = path.basename(filename, path.extname(filename));
    const ext = path.extname(filename);

    entries.forEach(entry => {
      if (entry.isFile()) {
        const entryBase = path.basename(entry.name, path.extname(entry.name));
        const entryExt = path.extname(entry.name);

        // 同じ拡張子で似た名前
        if (entryExt === ext && entry.name !== filename) {
          if (entryBase.includes(basename) || basename.includes(entryBase)) {
            similar.push(path.join(dir, entry.name));
          }
        }

        // スクリプトファイルなら全て報告
        if (['.py', '.sh', '.js'].includes(entryExt) && entry.name !== filename) {
          if (entry.name.includes('video') || entry.name.includes('create') || entry.name.includes('generate')) {
            similar.push(path.join(dir, entry.name));
          }
        }
      }
    });
  } catch (e) {}

  return [...new Set(similar)].slice(0, 5);
}

function findDesktopSimilarFiles(filename) {
  const similar = [];
  const desktop = path.join(process.env.HOME, 'Desktop');

  try {
    searchDesktop(desktop, filename, similar, 3);
  } catch (e) {}

  return [...new Set(similar)].slice(0, 5);
}

function searchDesktop(dir, filename, results, depth) {
  if (depth <= 0) return;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && entry.name === filename) {
        results.push(fullPath);
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        searchDesktop(fullPath, filename, results, depth - 1);
      }
    });
  } catch (e) {}
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

main().catch(() => process.exit(0));
