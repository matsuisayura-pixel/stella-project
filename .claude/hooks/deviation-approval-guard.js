#!/usr/bin/env node
/**
 * Deviation Approval Guard - 逸脱行為の警告ガード (Layer 6) [ADVISORY MODE]
 *
 * PreToolUse で実行され、指示にない行動（逸脱）を検出して警告します。
 * 多人数共有システムのため、ブロックせず警告のみ出力します。
 *
 * exit code:
 * - 0: 常に許可（警告のみ出力）
 *
 * ※ 厳格モードが必要な場合は個人の ~/.claude/settings.json で設定してください
 */

const fs = require('fs');
const path = require('path');
const { readStdin } = require('./utils/read-stdin');

// 逸脱パターン（指示にない行動）
const DEVIATION_PATTERNS = [
  // 勝手な最適化
  /(?:より)?(?:シンプル|簡潔|効率的)(?:に|化)/gi,
  /(?:最適化|optimize)/gi,
  /(?:改善|improve)/gi,
  
  // 勝手な要約・圧縮
  /(?:\d+)%(?:に)?(?:圧縮|要約|削減)/gi,
  /(?:短縮|省略)(?:し|する)/gi,
  
  // 勝手な置換・変更
  /(?:代わりに|instead)/gi,
  /(?:別の|alternative)(?:方法|手段)/gi,
  /(?:置き換え|replace)/gi,
];

// 承認済みパターン（ユーザーが明示的に許可した表現）
const APPROVED_PATTERNS = [
  /(?:承認|approved|OK|許可)/gi,
  /(?:実行|proceed|go ahead)(?:して)?(?:よい|OK)/gi,
];

async function main() {
  let input = {};

  try {
    const stdinData = await readStdin();
    if (stdinData) {
      input = JSON.parse(stdinData);
    }
  } catch (error) {
    console.error('[deviation-approval-guard] stdin parse error:', error.message);
    process.exit(0); // 非ブロッキング
  }

  // Bootstrap Safe Mode: ワークフロー未開始ならスキップ
  const cwd = input.cwd || process.cwd();
  if (!fs.existsSync(path.join(cwd, '.workflow_state.json'))) {
    process.exit(0);
  }

  const tool = input.tool || '';
  const params = input.params || {};
  
  // Write/Edit/Bashツールのみ対象
  if (!['Write', 'Edit', 'Bash'].includes(tool)) {
    process.exit(0);
  }

  // パラメータから内容を取得
  const content = params.content || params.new_string || params.command || '';
  const description = params.description || '';
  
  // 承認済みパターンがある場合はスキップ
  const isApproved = APPROVED_PATTERNS.some(pattern => 
    pattern.test(content) || pattern.test(description)
  );
  
  if (isApproved) {
    process.exit(0);
  }

  // 逸脱パターンを検出
  const deviations = [];
  for (const pattern of DEVIATION_PATTERNS) {
    const matches = content.match(pattern) || description.match(pattern);
    if (matches) {
      deviations.push(...matches);
    }
  }

  if (deviations.length > 0) {
    console.error('');
    console.error('[deviation-approval-guard] ⚠️  ADVISORY: 逸脱パターンを検出しました（ブロックしません）');
    console.error('検出パターン: ' + deviations.join(', '));
    console.error('意図した操作であれば続行してください。');
    console.error('');
    // 多人数共有システム: 警告のみ、ブロックしない
    process.exit(0);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('[deviation-approval-guard] error:', error.message);
  process.exit(0); // 非ブロッキング
});
