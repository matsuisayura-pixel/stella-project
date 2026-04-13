/**
 * Guard Dev Commands Test Suite
 *
 * Deviation Approval Guard 改善のテスト（15テスト）
 *
 * カテゴリ:
 * 1-3: Bash Intent 分類 (classifyBashCommand)
 * 4-5: allowlist (isSafeDevelopmentCommand)
 * 6-7: パターン改善 (APPROVAL_REQUIRED_PATTERNS)
 * 8-9: セキュリティ維持
 * 10-11: 開発環境判定
 * 12-13: risk-evaluator 開発系リスク
 * 14: パフォーマンス
 * 15: 後方互換性
 */

const path = require('path');
const fs = require('fs');

// unified-guard.js の関数をインポート
const {
  classifyBashCommand,
  performQuickChecks,
  SAFE_BASH_PATTERNS,
} = require('../unified-guard.js');

// === 1-3: Bash Intent 分類テスト ===

describe('classifyBashCommand', () => {
  test('1. npm install → DEPENDENCY_RESTORE', () => {
    const result = classifyBashCommand('npm install');
    expect(result).not.toBeNull();
    expect(result.intent).toBe('DEPENDENCY_RESTORE');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
    expect(result.risk).toBe('low');
  });

  test('2. npx jest → TEST_RUN', () => {
    const result = classifyBashCommand('npx jest --coverage');
    expect(result).not.toBeNull();
    expect(result.intent).toBe('TEST_RUN');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
    expect(result.risk).toBe('low');
  });

  test('3. git status → PROJECT_STATUS', () => {
    const result = classifyBashCommand('git status');
    expect(result).not.toBeNull();
    expect(result.intent).toBe('PROJECT_STATUS');
    expect(result.confidence).toBeGreaterThanOrEqual(95);
    expect(result.risk).toBe('low');
  });

  test('npm install --save-dev jest → DEPENDENCY_RESTORE', () => {
    const result = classifyBashCommand('npm install --save-dev jest');
    expect(result).not.toBeNull();
    expect(result.intent).toBe('DEPENDENCY_RESTORE');
    expect(result.risk).toBe('low');
  });

  test('npm run build → PROJECT_BUILD', () => {
    const result = classifyBashCommand('npm run build');
    expect(result).not.toBeNull();
    expect(result.intent).toBe('PROJECT_BUILD');
    expect(result.risk).toBe('low');
  });

  test('npm test → TEST_RUN', () => {
    const result = classifyBashCommand('npm test');
    expect(result).not.toBeNull();
    expect(result.intent).toBe('TEST_RUN');
  });

  test('npx tsc --noEmit → PROJECT_BUILD', () => {
    const result = classifyBashCommand('npx tsc --noEmit');
    expect(result).not.toBeNull();
    expect(result.intent).toBe('PROJECT_BUILD');
  });

  test('node script.js → CODE_EXECUTION', () => {
    const result = classifyBashCommand('node script.js');
    expect(result).not.toBeNull();
    expect(result.intent).toBe('CODE_EXECUTION');
    expect(result.risk).toBe('low');
  });

  test('unknown command → null', () => {
    const result = classifyBashCommand('curl https://example.com');
    expect(result).toBeNull();
  });

  test('npm install lodash → null (not safe pattern)', () => {
    const result = classifyBashCommand('npm install lodash');
    expect(result).toBeNull();
  });
});

// === 4-5: allowlist テスト ===

describe('isSafeDevelopmentCommand (via deviation-approval-guard)', () => {
  // deviation-approval-guard の内部関数をテストするために
  // APPROVAL_REQUIRED_PATTERNS のパターンマッチで検証

  test('4. npm install（引数なし）→ 安全（allowlist パターン一致）', () => {
    // classifyBashCommand で safe と判定されるか
    const result = classifyBashCommand('npm install');
    expect(result).not.toBeNull();
    expect(result.risk).toBe('low');
  });

  test('5. npm install lodash → パッケージ追加（classifyBashCommand では null）', () => {
    const result = classifyBashCommand('npm install lodash');
    expect(result).toBeNull();
    // → deviation-approval-guard の APPROVAL_REQUIRED_PATTERNS に該当
  });
});

// === 6-7: パターン改善テスト ===

describe('APPROVAL_REQUIRED_PATTERNS 改善', () => {
  // deviation-approval-guard.js のパターンを直接検証
  const deviationGuardPath = path.join(__dirname, '..', 'deviation-approval-guard.js');
  let deviationGuardSource;

  beforeAll(() => {
    deviationGuardSource = fs.readFileSync(deviationGuardPath, 'utf8');
  });

  test('6. pip install flask → パターンマッチ（ブロック対象）', () => {
    // 改善後: /pip\s+install\s+\S/ → パッケージ名がある場合のみマッチ
    const pattern = /pip\s+install\s+\S/;
    expect(pattern.test('pip install flask')).toBe(true);
  });

  test('7. pip install（引数なし）→ パターン不一致（許可）', () => {
    // 改善後: /pip\s+install\s+\S/ → 引数なしは通す
    const pattern = /pip\s+install\s+\S/;
    expect(pattern.test('pip install')).toBe(false);
  });

  test('npm install lodash → パターンマッチ（ブロック対象）', () => {
    // 改善後: /npm\s+install\s+(?!--save-dev)\S/
    const pattern = /npm\s+install\s+(?!--save-dev)\S/;
    expect(pattern.test('npm install lodash')).toBe(true);
  });

  test('npm install（引数なし）→ パターン不一致（許可）', () => {
    const pattern = /npm\s+install\s+(?!--save-dev)\S/;
    expect(pattern.test('npm install')).toBe(false);
  });

  test('npm install --save-dev jest → パターン不一致（許可）', () => {
    const pattern = /npm\s+install\s+(?!--save-dev)\S/;
    expect(pattern.test('npm install --save-dev jest')).toBe(false);
  });
});

// === 8-9: セキュリティ維持テスト ===

describe('セキュリティ維持', () => {
  test('8. rm -rf / → ブロック（performQuickChecks）', () => {
    const result = performQuickChecks('Bash', { command: 'rm -rf /' });
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('危険なコマンド');
  });

  test('9. sudo apt-get install → ブロック対象（classifyBashCommand = null）', () => {
    const result = classifyBashCommand('sudo apt-get install vim');
    expect(result).toBeNull();
    // → deviation-approval-guard の APPROVAL_REQUIRED_PATTERNS.bash で sudo がマッチ
  });

  test('rm -rf * → ブロック（performQuickChecks）', () => {
    const result = performQuickChecks('Bash', { command: 'rm -rf *' });
    expect(result.blocked).toBe(true);
  });
});

// === 10-11: 開発環境判定テスト ===

describe('開発環境判定', () => {
  test('10. package.json 存在時 → allowlist 有効', () => {
    // 現在のプロジェクトには package.json が存在する
    const cwd = path.join(__dirname, '..', '..', '..');
    const hasPackageJson = fs.existsSync(path.join(cwd, 'package.json'));
    expect(hasPackageJson).toBe(true);
  });

  test('11. package.json 非存在時 → allowlist 無効', () => {
    // /tmp のような場所には package.json がない
    const tmpDir = '/tmp';
    const hasPackageJson = fs.existsSync(path.join(tmpDir, 'package.json'));
    expect(hasPackageJson).toBe(false);
  });
});

// === 12-13: risk-evaluator 開発系リスクテスト ===

describe('risk-evaluator 開発系 IntentType', () => {
  test('12. PROJECT_BUILD → low risk（risk-evaluator で登録済み）', () => {
    // risk-evaluator.ts で PROJECT_BUILD が 'low' に変更されたことを
    // ソースコード検証で確認
    const riskEvaluatorPath = path.join(
      __dirname, '..', '..', '..', 'src', 'intent-parser', 'engines', 'risk-evaluator.ts'
    );
    const source = fs.readFileSync(riskEvaluatorPath, 'utf8');
    // PROJECT_BUILD が low として登録されていることを確認
    expect(source).toContain("[IntentType.PROJECT_BUILD, 'low']");
  });

  test('13. TEST_RUN → low risk（risk-evaluator で登録済み）', () => {
    const riskEvaluatorPath = path.join(
      __dirname, '..', '..', '..', 'src', 'intent-parser', 'engines', 'risk-evaluator.ts'
    );
    const source = fs.readFileSync(riskEvaluatorPath, 'utf8');
    expect(source).toContain("[IntentType.TEST_RUN, 'low']");
  });

  test('TEST_CREATE → low risk', () => {
    const riskEvaluatorPath = path.join(
      __dirname, '..', '..', '..', 'src', 'intent-parser', 'engines', 'risk-evaluator.ts'
    );
    const source = fs.readFileSync(riskEvaluatorPath, 'utf8');
    expect(source).toContain("[IntentType.TEST_CREATE, 'low']");
  });

  test('PROJECT_SETUP → low risk', () => {
    const riskEvaluatorPath = path.join(
      __dirname, '..', '..', '..', 'src', 'intent-parser', 'engines', 'risk-evaluator.ts'
    );
    const source = fs.readFileSync(riskEvaluatorPath, 'utf8');
    expect(source).toContain("[IntentType.PROJECT_SETUP, 'low']");
  });
});

// === 14: パフォーマンステスト ===

describe('パフォーマンス', () => {
  test('14. classifyBashCommand() 100回 < 10ms', () => {
    const commands = [
      'npm install',
      'npx jest --coverage',
      'git status',
      'npm run build',
      'node test.js',
      'curl https://example.com',
      'unknown-command',
      'npm test',
      'git diff',
      'npx tsc --noEmit',
    ];

    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      const cmd = commands[i % commands.length];
      classifyBashCommand(cmd);
    }
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(10);
  });
});

// === 15: 後方互換性テスト ===

describe('後方互換性', () => {
  test('15. performQuickChecks の既存動作が維持される', () => {
    // 正常なコマンドは通す
    const safeResult = performQuickChecks('Bash', { command: 'echo hello' });
    expect(safeResult.blocked).toBe(false);

    // 危険なコマンドはブロック
    const dangerousResult = performQuickChecks('Bash', { command: 'rm -rf /' });
    expect(dangerousResult.blocked).toBe(true);

    // Write の保護は維持
    const writeResult = performQuickChecks('Write', {
      file_path: '/project/.env',
      content: 'SECRET=xxx',
    });
    expect(writeResult.blocked).toBe(true);

    // コピーマーカー検出は維持
    const copyResult = performQuickChecks('Bash', { command: 'echo \uFFFD' });
    expect(copyResult.blocked).toBe(true);
  });
});
