#!/usr/bin/env node
/**
 * Console.log Warning Guard - 本番コードの console.log を警告
 *
 * PostToolUse (Edit/Write) 時に実行され、
 * JS/TS ファイルに console.log が含まれる場合に警告します。
 *
 * **警告のみ**: ブロックしない。品質優先のため強制しない。
 *
 * 除外:
 * - テストファイル (*.test.*, *.spec.*)
 * - 設定ファイル (*.config.*)
 * - console.error, console.warn は許可
 */

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

  const toolName = input.tool_name || '';
  const toolInput = input.tool_input || {};
  const toolResult = input.tool_result || {};

  // Edit/Write ツールのみチェック
  if (toolName !== 'Edit' && toolName !== 'Write') {
    process.exit(0);
    return;
  }

  const filePath = toolInput.file_path || '';

  if (!filePath) {
    process.exit(0);
    return;
  }

  // JS/TS ファイルのみチェック
  if (!isJsOrTsFile(filePath)) {
    process.exit(0);
    return;
  }

  // 除外パターン
  if (isExcludedFile(filePath)) {
    process.exit(0);
    return;
  }

  // 変更内容を取得
  let content = '';
  if (toolName === 'Write') {
    content = toolInput.content || '';
  } else if (toolName === 'Edit') {
    content = toolInput.new_string || '';
  }

  if (!content) {
    process.exit(0);
    return;
  }

  // console.log パターン検出
  const consoleLogPattern = /console\.log\s*\(/g;
  const matches = content.match(consoleLogPattern);

  if (!matches || matches.length === 0) {
    process.exit(0);
    return;
  }

  // 警告を出力（ブロックしない）
  console.log('');
  console.log('=== CONSOLE.LOG WARNING ===');
  console.log('');
  console.log(`File: ${filePath}`);
  console.log(`Found: ${matches.length} console.log statement(s)`);
  console.log('');
  console.log('**TIP**: console.log は本番環境では削除することを推奨します。');
  console.log('');
  console.log('代替案:');
  console.log('  - デバッグ用: debugger 文を使用');
  console.log('  - ロギング用: logger ライブラリを使用');
  console.log('  - エラー通知: console.error を使用');
  console.log('');
  console.log('=== END WARNING ===');
  console.log('');

  // ブロックしない（exit 0）
  process.exit(0);
}

function isJsOrTsFile(filePath) {
  const jsExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
  return jsExtensions.some(ext => filePath.endsWith(ext));
}

function isExcludedFile(filePath) {
  const excludePatterns = [
    /\.test\./i,
    /\.spec\./i,
    /\.config\./i,
    /__tests__/i,
    /__mocks__/i,
    /node_modules/i,
    /\.d\.ts$/i,
    /scripts\//i,
    /debug\//i,
  ];
  return excludePatterns.some(pattern => pattern.test(filePath));
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
