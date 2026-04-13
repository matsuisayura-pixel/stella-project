#!/usr/bin/env node
/**
 * Tmux Reminder Hook - 長時間コマンドでtmux使用を推奨
 *
 * PreToolUse (Bash) 時に実行され、
 * 長時間実行されるコマンドに対してtmux使用を推奨します。
 *
 * **警告のみ**: ブロックしない。品質優先のため強制しない。
 *
 * 対象コマンド:
 * - npm run dev / pnpm dev / yarn dev / bun run dev
 * - npm install / pnpm install / yarn install
 * - npm test / pytest / vitest / playwright
 * - cargo build / make / docker
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

  // Bash コマンドのみチェック
  if (toolName !== 'Bash') {
    process.exit(0);
    return;
  }

  const command = toolInput.command || '';

  if (!command) {
    process.exit(0);
    return;
  }

  // 長時間コマンドのパターン
  const longRunningPatterns = [
    // Dev servers
    /npm\s+run\s+dev/i,
    /pnpm(\s+run)?\s+dev/i,
    /yarn\s+dev/i,
    /bun\s+run\s+dev/i,
    /next\s+dev/i,
    /vite(\s+dev)?/i,

    // Install commands
    /npm\s+(ci|install)/i,
    /pnpm\s+(install|i)\b/i,
    /yarn\s+(install)?\s*$/i,
    /bun\s+install/i,

    // Test commands
    /npm\s+(run\s+)?test/i,
    /pnpm\s+(run\s+)?test/i,
    /yarn\s+test/i,
    /pytest/i,
    /vitest/i,
    /playwright\s+test/i,
    /jest/i,

    // Build commands
    /cargo\s+build/i,
    /cargo\s+test/i,
    /make\b/i,
    /docker\s+(build|compose|run)/i,

    // Long running processes
    /npm\s+run\s+build/i,
    /pnpm\s+build/i,
    /yarn\s+build/i,
  ];

  // パターンマッチチェック
  const isLongRunning = longRunningPatterns.some(pattern => pattern.test(command));

  if (!isLongRunning) {
    process.exit(0);
    return;
  }

  // tmux内で実行中かチェック
  const inTmux = process.env.TMUX ? true : false;

  // 警告を出力（ブロックしない）
  console.log('');
  console.log('=== TMUX REMINDER ===');
  console.log('');

  if (inTmux) {
    console.log('tmux セッション内で実行中です。');
  } else {
    console.log('**TIP**: 長時間コマンドを検出しました。');
    console.log('');
    console.log('tmux を使用すると、以下のメリットがあります:');
    console.log('  - ログが永続化される');
    console.log('  - セッション切断後も継続実行');
    console.log('  - 複数ターミナルで同時監視可能');
    console.log('');
    console.log('推奨コマンド:');
    console.log('  tmux new-session -d -s dev "' + command.substring(0, 50) + '..."');
    console.log('  tmux attach -t dev');
    console.log('');
  }

  console.log('=== END TMUX REMINDER ===');
  console.log('');

  // ブロックしない（exit 0）
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

main().catch(() => process.exit(0));
