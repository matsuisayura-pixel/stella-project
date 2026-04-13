#!/usr/bin/env node
/**
 * Copy Safety Guard - コピー時の文字化け・不正文字をブロック
 *
 * PreToolUse (Bash) 時に実行され、
 * コマンド内の危険な文字を検出してブロックします。
 *
 * 検出対象:
 * - U+FFFD (置換文字) - 文字化けの兆候
 * - U+3000 (全角スペース) - コピペミスの兆候
 * - コピーマーカー ([[COPY]], <COPY>, etc.)
 *
 * 防止する問題:
 * - 文字化けしたコマンドの実行
 * - コピペ時の不正文字混入
 * - マーカー文字列の誤実行
 */

const fs = require('fs');
const path = require('path');

// 検出パターン
const DANGEROUS_PATTERNS = [
  {
    pattern: /\uFFFD/g,
    name: 'U+FFFD (置換文字)',
    description: '文字化けの兆候です。元のテキストが破損している可能性があります。',
    severity: 'critical'
  },
  {
    pattern: /\u3000/g,
    name: 'U+3000 (全角スペース)',
    description: 'コピペ時に混入した全角スペースです。コマンドが正しく動作しない可能性があります。',
    severity: 'warning'
  },
  {
    pattern: /\[\[COPY\]\]|\[\[コピー\]\]|<COPY>|<コピー>|<!--\s*COPY\s*-->|#\s*COPY\s*#/gi,
    name: 'コピーマーカー',
    description: 'テンプレートのコピーマーカーが残っています。',
    severity: 'critical'
  },
  {
    pattern: /\[\[TODO\]\]|\[\[未完成\]\]|<TODO>|<未完成>/gi,
    name: 'TODOマーカー',
    description: '未完成のTODOマーカーが残っています。',
    severity: 'warning'
  },
  {
    pattern: /\[\[PLACEHOLDER\]\]|\[\[プレースホルダー\]\]/gi,
    name: 'プレースホルダー',
    description: 'プレースホルダーが置換されていません。',
    severity: 'critical'
  }
];

// 重大度による動作
const SEVERITY_ACTIONS = {
  critical: 'block',    // exit code 2 でブロック
  warning: 'warn'       // 警告のみ（実行は許可）
};

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

  const violations = [];
  const warnings = [];

  // 各パターンをチェック
  DANGEROUS_PATTERNS.forEach(({ pattern, name, description, severity }) => {
    const matches = command.match(pattern);
    if (matches) {
      const entry = {
        name,
        description,
        count: matches.length,
        positions: findPositions(command, pattern)
      };

      if (severity === 'critical') {
        violations.push(entry);
      } else {
        warnings.push(entry);
      }
    }
  });

  // 結果を出力
  if (violations.length > 0 || warnings.length > 0) {
    console.log('');
    console.log('=== COPY SAFETY GUARD ===');
    console.log('');

    if (violations.length > 0) {
      console.log('**CRITICAL: 危険な文字が検出されました**');
      console.log('');
      violations.forEach(v => {
        console.log(`- ${v.name} (${v.count}箇所)`);
        console.log(`  ${v.description}`);
        if (v.positions.length <= 3) {
          console.log(`  位置: ${v.positions.join(', ')}`);
        }
      });
      console.log('');
      console.log('**このコマンドはブロックされました。**');
      console.log('コマンドを確認し、不正な文字を除去してから再実行してください。');
      console.log('');
      console.log('=== END COPY SAFETY GUARD ===');
      console.log('');

      // ブロック（exit code 2）
      process.exit(2);
      return;
    }

    if (warnings.length > 0) {
      console.log('**WARNING: 注意が必要な文字が検出されました**');
      console.log('');
      warnings.forEach(w => {
        console.log(`- ${w.name} (${w.count}箇所)`);
        console.log(`  ${w.description}`);
      });
      console.log('');
      console.log('コマンドは実行されますが、意図した動作か確認してください。');
      console.log('');
      console.log('=== END COPY SAFETY GUARD ===');
      console.log('');
    }
  }

  process.exit(0);
}

/**
 * パターンの出現位置を特定
 */
function findPositions(text, pattern) {
  const positions = [];
  let match;
  const regex = new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g');

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const context = text.substring(Math.max(0, start - 10), Math.min(text.length, start + 20));
    positions.push(`位置${start}: "...${context}..."`);
  }

  return positions;
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
