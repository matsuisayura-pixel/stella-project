#!/usr/bin/env node
/**
 * Large Output Guard - 大きな出力のmemory_add強制
 *
 * PostToolUse (Write/Edit/Bash) 時に実行され、
 * 大きな出力をmemory_addに保存するよう強制します。
 *
 * しきい値:
 * - 6000文字以上
 * - 120行以上
 *
 * 防止する問題:
 * - コンテキストウィンドウの無駄遣い
 * - 重要な出力の紛失
 * - セッション間での情報喪失
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();

// 設定
const CONFIG = {
  charThreshold: 6000,    // 文字数しきい値
  lineThreshold: 120,     // 行数しきい値
  excludePatterns: [      // 除外パターン
    /node_modules/,
    /\.git\//,
    /\.lock$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
  ],
  targetFileExtensions: [ // 対象拡張子
    '.md',
    '.txt',
    '.json',
    '.yaml',
    '.yml',
    '.ts',
    '.js',
    '.py',
    '.sh',
  ],
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
  const toolResult = input.tool_result || {};

  // Write/Edit/Bash ツールのみチェック
  if (!['Write', 'Edit', 'Bash'].includes(toolName)) {
    process.exit(0);
    return;
  }

  let content = '';
  let source = '';

  if (toolName === 'Write') {
    content = toolInput.content || '';
    source = `Write: ${toolInput.file_path || 'unknown'}`;
  } else if (toolName === 'Edit') {
    content = toolInput.new_string || '';
    source = `Edit: ${toolInput.file_path || 'unknown'}`;
  } else if (toolName === 'Bash') {
    // Bash出力のチェック
    content = toolResult.stdout || toolResult.output || '';
    source = `Bash: ${(toolInput.command || '').substring(0, 50)}...`;
  }

  if (!content) {
    process.exit(0);
    return;
  }

  // 除外パターンチェック
  const filePath = toolInput.file_path || '';
  const shouldExclude = CONFIG.excludePatterns.some(pattern =>
    pattern.test(filePath)
  );

  if (shouldExclude) {
    process.exit(0);
    return;
  }

  // サイズチェック
  const charCount = content.length;
  const lineCount = content.split('\n').length;

  const exceedsCharThreshold = charCount >= CONFIG.charThreshold;
  const exceedsLineThreshold = lineCount >= CONFIG.lineThreshold;

  if (!exceedsCharThreshold && !exceedsLineThreshold) {
    process.exit(0);
    return;
  }

  // 詳細をJSONファイルに退避
  const detailFile = path.join(PROJECT_DIR, '.claude/hooks/data/large-output-detail.json');
  try {
    const dir = path.dirname(detailFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(detailFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      source,
      charCount,
      lineCount,
      exceedsCharThreshold,
      exceedsLineThreshold,
      recommendation: 'Praetorian compactまたはmemory_addで保存してからコンテキストに含めてください'
    }, null, 2));
  } catch (e) { /* ignore */ }

  // stderr: 人間向け表示
  console.error(`\x1b[33m[Large Output] ${source} (${charCount.toLocaleString()}chars/${lineCount}lines) - 詳細: .claude/hooks/data/large-output-detail.json\x1b[0m`);

  // stdout: AI向け1行指示（コンテキストに注入される）
  console.log(`[Large Output] ${source}(${charCount}chars/${lineCount}lines) -> Praetorian compactで保存推奨`);

  // 警告のみ（ブロックしない）
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
