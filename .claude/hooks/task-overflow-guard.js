#!/usr/bin/env node
/**
 * Task Overflow Guard - サブエージェント結果のコンテキスト膨張防止
 *
 * PostToolUse hook (matcher: Task)
 * Task結果が2000文字超の場合、Praetorian compact保存を促す1行stdoutを出力。
 * 詳細はdata/task-result-overflow.jsonに退避。
 *
 * exit 0 固定（ブロックしない）
 *
 * @version 1.0.0
 * @date 2026-02-17
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const CHAR_THRESHOLD = 2000;

const FILES = {
  overflow: path.join(PROJECT_DIR, '.claude/hooks/data/task-result-overflow.json'),
  log: path.join(PROJECT_DIR, '.claude/temp/task-overflow-guard.log')
};

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function log(msg) {
  try {
    ensureDir(FILES.log);
    fs.appendFileSync(FILES.log, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) { /* ignore */ }
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
    process.stdin.on('error', finish);
    setTimeout(finish, timeout);
    if (process.stdin.isTTY) finish();
  });
}

function extractAgentDescription(input) {
  const toolInput = input.tool_input || {};
  return toolInput.description || toolInput.prompt?.substring(0, 40) || 'unknown';
}

function saveOverflowDetail(detail) {
  try {
    ensureDir(FILES.overflow);
    fs.writeFileSync(FILES.overflow, JSON.stringify(detail, null, 2));
  } catch (e) {
    log(`Failed to save overflow detail: ${e.message}`);
  }
}

async function main() {
  try {
    const stdinData = await readStdin();
    if (!stdinData) {
      process.exit(0);
      return;
    }

    let input;
    try {
      input = JSON.parse(stdinData);
    } catch (e) {
      process.exit(0);
      return;
    }

    const toolName = input.tool_name || '';
    if (toolName !== 'Task') {
      process.exit(0);
      return;
    }

    const resultStr = typeof input.tool_result === 'string'
      ? input.tool_result
      : JSON.stringify(input.tool_result || '');

    const charCount = resultStr.length;

    if (charCount <= CHAR_THRESHOLD) {
      log(`Task result OK: ${charCount} chars (threshold: ${CHAR_THRESHOLD})`);
      process.exit(0);
      return;
    }

    const description = extractAgentDescription(input);
    const truncatedPreview = resultStr.substring(0, 200);

    saveOverflowDetail({
      timestamp: new Date().toISOString(),
      charCount,
      threshold: CHAR_THRESHOLD,
      description,
      preview: truncatedPreview,
      fullResultLength: charCount
    });

    // stdout: AI向け1行指示（コンテキストに注入される）
    console.log(`[Context Guard] Task結果(${charCount}chars/${description}) -> Praetorian compactで保存推奨`);

    log(`Overflow detected: ${charCount} chars for "${description}"`);
    process.exit(0);
  } catch (error) {
    log(`Error: ${error.message}`);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}
