#!/usr/bin/env node
/**
 * Input Sanitizer Guard - セキュリティリスクのある入力を検出・警告
 *
 * PreToolUse時に実行され、以下の危険なパターンを検出:
 * - コマンドインジェクション (Bash)
 * - パストラバーサル (Read/Write/Edit)
 * - 危険なコマンド (rm -rf, sudo, etc.)
 * - 機密情報の漏洩 (API keys, passwords)
 *
 * 動作:
 * - critical: exit 2 でブロック
 * - warning: 警告表示のみ（実行は許可）
 * - info: 情報提供のみ
 */

const fs = require('fs');
const path = require('path');

// 設定ファイルパス
const CONFIG_PATH = path.join(process.cwd(), '.claude/hooks/config/input-sanitizer.json');

// デフォルト設定
const DEFAULT_CONFIG = {
  enabled: true,
  strictMode: false, // true: warning も block
  rules: {
    bash: {
      enabled: true,
      patterns: [
        {
          name: 'command-injection-semicolon',
          pattern: ';\\s*(rm|wget|curl|bash|sh|nc|netcat)',
          severity: 'critical',
          description: 'コマンドインジェクションの可能性があります'
        },
        {
          name: 'command-injection-pipe',
          pattern: '\\|\\s*(bash|sh|python|perl|ruby|nc)',
          severity: 'critical',
          description: 'パイプ経由のコード実行の可能性があります'
        },
        {
          name: 'dangerous-rm',
          pattern: 'rm\\s+(-rf?\\s+)?(\\/|~|\\$HOME|\\$PWD|\\.\\.)',
          severity: 'critical',
          description: '危険な削除コマンドです'
        },
        {
          name: 'sudo-usage',
          pattern: '\\bsudo\\b',
          severity: 'warning',
          description: 'sudo を使用しています。権限昇格に注意してください'
        },
        {
          name: 'curl-exec',
          pattern: 'curl.*\\|\\s*(bash|sh)',
          severity: 'critical',
          description: 'リモートスクリプトの直接実行は危険です'
        },
        {
          name: 'env-exposure',
          pattern: 'echo\\s+\\$[A-Z_]*KEY|echo\\s+\\$[A-Z_]*SECRET|echo\\s+\\$[A-Z_]*PASSWORD',
          severity: 'warning',
          description: '機密環境変数の出力に注意してください'
        },
        {
          name: 'base64-decode-exec',
          pattern: 'base64\\s+(-d|--decode).*\\|',
          severity: 'warning',
          description: 'Base64デコード後の実行に注意してください'
        }
      ]
    },
    file: {
      enabled: true,
      patterns: [
        {
          name: 'path-traversal',
          pattern: '\\.\\.\\/|\\.\\.\\\\',
          severity: 'warning',
          description: 'パストラバーサルの可能性があります'
        },
        {
          name: 'sensitive-file-access',
          pattern: '(\\/etc\\/passwd|\\/etc\\/shadow|\\.ssh\\/|id_rsa|\\.env(?!\\.)|\\.aws\\/credentials)',
          severity: 'critical',
          description: '機密ファイルへのアクセスです'
        },
        {
          name: 'system-file-write',
          pattern: '^\\/(?:etc|usr|var|bin|sbin)\\/',
          severity: 'critical',
          description: 'システムディレクトリへの書き込みは禁止されています'
        }
      ]
    },
    content: {
      enabled: true,
      patterns: [
        {
          name: 'hardcoded-secret',
          pattern: '(api[_-]?key|secret[_-]?key|password|access[_-]?token)\\s*[=:]\\s*["\'][^"\']{8,}["\']',
          severity: 'critical',
          description: 'ハードコードされた機密情報が含まれています',
          flags: 'i'
        },
        {
          name: 'aws-key',
          pattern: 'AKIA[0-9A-Z]{16}',
          severity: 'critical',
          description: 'AWS Access Key IDが含まれています'
        },
        {
          name: 'private-key',
          pattern: '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
          severity: 'critical',
          description: '秘密鍵が含まれています'
        }
      ]
    }
  }
};

// 設定読み込み
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const userConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return { ...DEFAULT_CONFIG, ...userConfig };
    }
  } catch (e) { /* ignore */ }
  return DEFAULT_CONFIG;
}

// stdin読み込み
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

// パターンマッチング
function checkPatterns(text, patterns) {
  const results = [];

  for (const rule of patterns) {
    const flags = rule.flags || 'gi';
    const regex = new RegExp(rule.pattern, flags);
    const matches = text.match(regex);

    if (matches) {
      results.push({
        name: rule.name,
        description: rule.description,
        severity: rule.severity,
        matches: matches.slice(0, 3), // 最大3個
        count: matches.length
      });
    }
  }

  return results;
}

// ツール種別に応じたチェック
function analyzeToolInput(toolName, toolInput, config) {
  const issues = [];

  switch (toolName) {
    case 'Bash':
      if (config.rules.bash.enabled && toolInput.command) {
        const bashIssues = checkPatterns(toolInput.command, config.rules.bash.patterns);
        issues.push(...bashIssues);
      }
      break;

    case 'Read':
    case 'Write':
    case 'Edit':
      if (config.rules.file.enabled && toolInput.file_path) {
        const fileIssues = checkPatterns(toolInput.file_path, config.rules.file.patterns);
        issues.push(...fileIssues);
      }
      if (config.rules.content.enabled) {
        const content = toolInput.content || toolInput.new_string || '';
        if (content) {
          const contentIssues = checkPatterns(content, config.rules.content.patterns);
          issues.push(...contentIssues);
        }
      }
      break;

    case 'WebFetch':
      // URL検証は別途実装可能
      break;
  }

  return issues;
}

// レポート出力
function reportIssues(issues, config) {
  const critical = issues.filter(i => i.severity === 'critical');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  if (issues.length === 0) {
    return { shouldBlock: false };
  }

  console.log('');
  console.log('\x1b[33m╔══════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[33m║           INPUT SANITIZER GUARD - Security Check             ║\x1b[0m');
  console.log('\x1b[33m╚══════════════════════════════════════════════════════════════╝\x1b[0m');
  console.log('');

  if (critical.length > 0) {
    console.log('\x1b[31m【CRITICAL】ブロック対象の問題が検出されました:\x1b[0m');
    critical.forEach(issue => {
      console.log(`  ❌ ${issue.name}`);
      console.log(`     ${issue.description}`);
      if (issue.matches && issue.matches.length > 0) {
        console.log(`     検出: "${issue.matches[0].substring(0, 50)}..."`);
      }
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('\x1b[33m【WARNING】注意が必要な問題:\x1b[0m');
    warnings.forEach(issue => {
      console.log(`  ⚠️  ${issue.name}`);
      console.log(`     ${issue.description}`);
    });
    console.log('');
  }

  if (infos.length > 0) {
    console.log('\x1b[36m【INFO】参考情報:\x1b[0m');
    infos.forEach(issue => {
      console.log(`  ℹ️  ${issue.name}: ${issue.description}`);
    });
    console.log('');
  }

  const shouldBlock = critical.length > 0 || (config.strictMode && warnings.length > 0);

  if (shouldBlock) {
    console.log('\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log('\x1b[31m  この操作はセキュリティ上の理由でブロックされました。\x1b[0m');
    console.log('\x1b[31m  入力を確認し、安全な方法で再実行してください。\x1b[0m');
    console.log('\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  } else if (warnings.length > 0) {
    console.log('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log('\x1b[33m  警告がありますが、操作は許可されます。\x1b[0m');
    console.log('\x1b[33m  意図した操作か確認してください。\x1b[0m');
    console.log('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  }

  console.log('');

  return { shouldBlock };
}

// メイン
async function main() {
  const config = loadConfig();

  if (!config.enabled) {
    process.exit(0);
    return;
  }

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

  // サポートするツールのみチェック
  const supportedTools = ['Bash', 'Read', 'Write', 'Edit', 'WebFetch'];
  if (!supportedTools.includes(toolName)) {
    process.exit(0);
    return;
  }

  const issues = analyzeToolInput(toolName, toolInput, config);

  if (issues.length === 0) {
    process.exit(0);
    return;
  }

  const { shouldBlock } = reportIssues(issues, config);

  if (shouldBlock) {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

main().catch(() => process.exit(0));
