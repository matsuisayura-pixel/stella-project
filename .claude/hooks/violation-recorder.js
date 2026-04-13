#!/usr/bin/env node
/**
 * Violation Recorder - ルール違反の記録
 *
 * 他のガードフックが検出した違反を.claude/hooks/mistakes.mdに記録します。
 * これにより、同じミスの再発を防止できます。
 *
 * 使用方法:
 * node violation-recorder.js "違反内容" "発生場所" "対策"
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    process.exit(0);
    return;
  }

  const violation = args[0] || 'Unknown violation';
  const location = args[1] || 'Unknown';
  const remedy = args[2] || 'Follow the mandatory pre-flight checks';

  const mistakesPath = path.join(__dirname, 'mistakes.md');

  // 既存の内容を読み込み
  let content = '';
  try {
    if (fs.existsSync(mistakesPath)) {
      content = fs.readFileSync(mistakesPath, 'utf8');
    }
  } catch (e) {}

  // ヘッダーがなければ追加
  if (!content.includes('# Mistakes Log')) {
    content = `# Mistakes Log

このファイルは自動的に記録された違反・ミスのログです。
同じミスを繰り返さないために、作業開始前に確認してください。

---

`;
  }

  // 新しい違反を追加
  const timestamp = new Date().toISOString();
  const entry = `
## ${timestamp}

**違反**: ${violation}
**場所**: ${location}
**対策**: ${remedy}

---
`;

  content += entry;

  // 書き込み
  try {
    fs.writeFileSync(mistakesPath, content, 'utf8');
  } catch (e) {}

  process.exit(0);
}

main().catch(() => process.exit(0));
