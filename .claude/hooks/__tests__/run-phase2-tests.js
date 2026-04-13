#!/usr/bin/env node
/**
 * Phase 2 簡易テストランナー
 *
 * Jest/Vitest なしで Phase 2 の実装をテスト
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// テスト対象のモジュールをインポート
const { performIntentCheck, buildUserInputFromContext } = require('../../hooks.disabled.local/unified-guard.js');

// テスト用の一時ファイルパス
const TEST_DIR = path.join(__dirname, '.test-tmp');

// カラー出力
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let passedTests = 0;
let failedTests = 0;
const failures = [];

// アサーション関数
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertGreaterThan(actual, min, message) {
  if (actual <= min) {
    throw new Error(message || `Expected > ${min}, got ${actual}`);
  }
}

function assertLessThan(actual, max, message) {
  if (actual >= max) {
    throw new Error(message || `Expected < ${max}, got ${actual}`);
  }
}

function assertContains(array, value, message) {
  if (!array.includes(value)) {
    throw new Error(message || `Expected array to contain ${value}`);
  }
}

function assertIncludes(string, substring, message) {
  if (!string.includes(substring)) {
    throw new Error(message || `Expected "${string}" to include "${substring}"`);
  }
}

// テストランナー
async function test(name, fn) {
  try {
    await fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    failedTests++;
    failures.push({ name, error: error.message });
  }
}

// セットアップ
function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

// クリーンアップ
function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// テスト実行
async function runTests() {
  console.log(`${colors.blue}Running Phase 2 Intent Parser Tests...${colors.reset}\n`);

  setup();

  // EXISTING_FILE_REFERENCE 検出テスト
  console.log(`${colors.yellow}EXISTING_FILE_REFERENCE intent detection${colors.reset}`);

  await test('should detect Read operations on existing files with 98% confidence', async () => {
    const testFile = path.join(TEST_DIR, 'existing-file-read.txt');
    fs.writeFileSync(testFile, 'test content', 'utf8');

    const result = await performIntentCheck('Read', { file_path: testFile });

    assertEqual(result.intent, 'EXISTING_FILE_REFERENCE');
    assertGreaterThan(result.confidence, 97);
    assertEqual(result.riskLevel, 'low');
    assertEqual(result.shouldSkip, true);
    assertEqual(result.filePath, testFile);
  });

  await test('should NOT detect EXISTING_FILE_REFERENCE for non-existent files', async () => {
    const result = await performIntentCheck('Read', { file_path: '/tmp/nonexistent-file-12345678.txt' });

    assert(result.intent !== 'EXISTING_FILE_REFERENCE');
    assertLessThan(result.confidence, 50);
  });

  await test('should detect Edit operations on existing files', async () => {
    const testFile = path.join(TEST_DIR, 'existing-file-edit.js');
    fs.writeFileSync(testFile, 'const x = 1;\n', 'utf8');

    const result = await performIntentCheck('Edit', {
      file_path: testFile,
      old_string: 'const x = 1;',
      new_string: 'const x = 2;',
    });

    assertEqual(result.intent, 'EXISTING_FILE_EDIT');
    assertGreaterThan(result.confidence, 97);
    assertEqual(result.riskLevel, 'low');
    assertEqual(result.shouldSkip, true);
    assertEqual(result.operation, 'edit');
  });

  await test('should detect new Write operations (file not exists)', async () => {
    const testFile = path.join(TEST_DIR, 'new-file-creation-test.txt');

    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }

    const result = await performIntentCheck('Write', {
      file_path: testFile,
      content: 'new file content',
    });

    assertEqual(result.intent, 'NEW_FILE_CREATION');
    assertGreaterThan(result.confidence, 89);
    assertEqual(result.riskLevel, 'low');
    assertEqual(result.shouldSkip, true);
    assertEqual(result.isNew, true);
  });

  await test('should detect existing file overwrite with Write tool', async () => {
    const testFile = path.join(TEST_DIR, 'existing-file-overwrite.txt');
    fs.writeFileSync(testFile, 'original content', 'utf8');

    const result = await performIntentCheck('Write', {
      file_path: testFile,
      content: 'overwritten content',
    });

    assertEqual(result.intent, 'EXISTING_FILE_OVERWRITE');
    assertGreaterThan(result.confidence, 94);
    assertEqual(result.riskLevel, 'high');
    assertEqual(result.isNew, false);
  });

  await test('should set skipLayers correctly for existing file patterns', async () => {
    const testFile = path.join(TEST_DIR, 'skip-layers-test.txt');
    fs.writeFileSync(testFile, 'content', 'utf8');

    const result = await performIntentCheck('Read', { file_path: testFile });

    assertContains(result.skipLayers, 3);
    assertContains(result.skipLayers, 4);
    assertGreaterThan(result.skipLayers.length, 1);
  });

  // パフォーマンステスト
  console.log(`\n${colors.yellow}Performance requirements${colors.reset}`);

  await test('should complete Intent check within <2ms', async () => {
    const testFile = path.join(TEST_DIR, 'perf-test.txt');
    fs.writeFileSync(testFile, 'content', 'utf8');

    const result = await performIntentCheck('Read', { file_path: testFile });

    assertLessThan(result.processingTimeMs, 2);
  });

  await test('should handle non-existent file checks quickly', async () => {
    const result = await performIntentCheck('Read', { file_path: '/tmp/nonexistent-perf-test-12345678.txt' });

    assertLessThan(result.processingTimeMs, 2);
  });

  // 後方互換性テスト
  console.log(`\n${colors.yellow}Backward compatibility${colors.reset}`);

  await test('should not affect existing guard behavior for SESSION_CONTINUATION', async () => {
    const result = await performIntentCheck('Read', { file_path: '/path/to/SESSION_HANDOFF.md' });

    assertEqual(result.intent, 'SESSION_CONTINUATION');
    assertGreaterThan(result.confidence, 89);
    assertContains(result.skipLayers, 1);
  });

  await test('should not affect existing guard behavior for SKILL_INVOCATION', async () => {
    const result = await performIntentCheck('Skill', { skill: 'test-skill', args: '' });

    assertEqual(result.intent, 'SKILL_INVOCATION');
    assertGreaterThan(result.confidence, 89);
    assertContains(result.skipLayers, 2);
    assertContains(result.skipLayers, 3);
    assertContains(result.skipLayers, 4);
    assertContains(result.skipLayers, 6);
  });

  await test('should handle UNKNOWN intents gracefully', async () => {
    const result = await performIntentCheck('UnknownTool', { param: 'value' });

    assertEqual(result.intent, 'UNKNOWN');
    assertEqual(result.confidence, 0);
    assertEqual(result.shouldSkip, false);
    assertEqual(result.skipLayers.length, 0);
    assertEqual(result.riskLevel, 'medium');
  });

  // buildUserInputFromContext テスト
  console.log(`\n${colors.yellow}buildUserInputFromContext${colors.reset}`);

  await test('should build user input from Edit tool', () => {
    const userInput = buildUserInputFromContext('Edit', {
      file_path: '/path/to/file.js',
      old_string: 'const x = 1;\n',
    });

    assertIncludes(userInput, 'edit file');
    assertIncludes(userInput, '/path/to/file.js');
  });

  await test('should build user input from Write tool', () => {
    const userInput = buildUserInputFromContext('Write', {
      file_path: '/path/to/new-file.txt',
      content: 'file content',
    });

    assertIncludes(userInput, 'write file');
    assertIncludes(userInput, '/path/to/new-file.txt');
  });

  await test('should build user input from Bash tool', () => {
    const userInput = buildUserInputFromContext('Bash', { command: 'npm install lodash' });

    assertIncludes(userInput, 'run bash command');
    assertIncludes(userInput, 'npm install');
  });

  await test('should build user input from Skill tool', () => {
    const userInput = buildUserInputFromContext('Skill', {
      skill: 'youtubeschool-creator',
      args: '--help',
    });

    assertIncludes(userInput, 'invoke skill');
    assertIncludes(userInput, 'youtubeschool-creator');
  });

  cleanup();

  // 結果サマリー
  console.log(`\n${colors.blue}═══════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Test Results${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Total: ${passedTests + failedTests}`);

  if (failedTests > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    failures.forEach((failure) => {
      console.log(`  ${colors.red}✗${colors.reset} ${failure.name}`);
      console.log(`    ${failure.error}`);
    });
    process.exit(1);
  } else {
    console.log(`\n${colors.green}All tests passed!${colors.reset}`);
    process.exit(0);
  }
}

// 実行
runTests().catch((error) => {
  console.error(`${colors.red}Test runner error:${colors.reset}`, error);
  process.exit(1);
});
