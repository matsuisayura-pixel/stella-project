#!/usr/bin/env node
/**
 * Definition Lint Gate - ワークフロー/ポリシー定義の検証
 *
 * PostToolUse (Write/Edit) 時に実行され、
 * YAML/JSON形式の定義ファイルを検証します。
 *
 * 検証対象:
 * - workflow*.yaml/yml
 * - policy*.yaml/yml
 * - *.workflow.json
 * - *.policy.json
 * - skill-mapping.json
 *
 * 防止する問題:
 * - 不正な定義ファイルの保存
 * - 必須フィールドの欠落
 * - 無効な参照
 */

const fs = require('fs');
const path = require('path');
const { readStdin } = require('./utils/read-stdin');

// 検証対象ファイルパターン
const TARGET_PATTERNS = [
  /workflow.*\.(yaml|yml|json)$/i,
  /policy.*\.(yaml|yml|json)$/i,
  /skill-mapping\.json$/i,
  /\.workflow\.json$/i,
  /\.policy\.json$/i,
];

// 必須フィールド定義
const SCHEMA_DEFINITIONS = {
  workflow: {
    required: ['name', 'phases'],
    recommended: ['version', 'description'],
    phaseFields: ['name', 'steps'],
  },
  policy: {
    required: ['name', 'rules'],
    recommended: ['version', 'description'],
    ruleFields: ['name', 'action'],
  },
  skillMapping: {
    required: ['mappings'],
    mappingFields: ['name', 'required_skills'],
    mappingRecommended: ['when_contains_all', 'when_contains_any', 'description'],
  },
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

  // Write/Edit ツールのみチェック
  if (toolName !== 'Write' && toolName !== 'Edit') {
    process.exit(0);
    return;
  }

  const filePath = toolInput.file_path || '';
  const fileName = path.basename(filePath);

  // 対象ファイルかチェック
  const isTarget = TARGET_PATTERNS.some(pattern => pattern.test(fileName));
  if (!isTarget) {
    process.exit(0);
    return;
  }

  // ファイルが存在するか確認
  if (!fs.existsSync(filePath)) {
    process.exit(0);
    return;
  }

  // ファイル内容を読み込んで検証
  const violations = [];
  const warnings = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let data;

    // JSON/YAML パース
    if (filePath.endsWith('.json')) {
      data = JSON.parse(content);
    } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      // 簡易YAMLパース（基本的なケースのみ）
      data = parseSimpleYaml(content);
    }

    if (!data) {
      violations.push({
        type: 'parse_error',
        message: 'ファイルのパースに失敗しました',
      });
    } else {
      // スキーマに基づく検証
      const fileType = detectFileType(fileName, data);
      const schema = SCHEMA_DEFINITIONS[fileType];

      if (schema) {
        // 必須フィールドチェック
        if (schema.required) {
          for (const field of schema.required) {
            if (!data[field]) {
              violations.push({
                type: 'missing_required',
                message: `必須フィールド "${field}" が見つかりません`,
              });
            }
          }
        }

        // 推奨フィールドチェック
        if (schema.recommended) {
          for (const field of schema.recommended) {
            if (!data[field]) {
              warnings.push({
                type: 'missing_recommended',
                message: `推奨フィールド "${field}" がありません`,
              });
            }
          }
        }

        // ネストされた項目のチェック
        if (fileType === 'skillMapping' && data.mappings) {
          for (let i = 0; i < data.mappings.length; i++) {
            const mapping = data.mappings[i];
            for (const field of schema.mappingFields) {
              if (!mapping[field]) {
                violations.push({
                  type: 'missing_mapping_field',
                  message: `mappings[${i}] に必須フィールド "${field}" がありません`,
                });
              }
            }
          }
        }

        // 追加の検証ルール
        validateAdditionalRules(data, fileType, violations, warnings);
      }
    }
  } catch (e) {
    violations.push({
      type: 'validation_error',
      message: `検証エラー: ${e.message}`,
    });
  }

  // 結果を出力
  if (violations.length > 0 || warnings.length > 0) {
    // 詳細をJSONファイルに退避
    try {
      const detailFile = path.join(process.cwd(), '.claude/hooks/data/lint-gate-detail.json');
      const detailDir = path.dirname(detailFile);
      if (!fs.existsSync(detailDir)) {
        fs.mkdirSync(detailDir, { recursive: true });
      }
      fs.writeFileSync(detailFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        fileName,
        violations,
        warnings
      }, null, 2));
    } catch (e) { /* ignore */ }

    if (violations.length > 0) {
      // stdout: AI向け1行（コンテキスト注入）
      console.log(`[Lint Gate] ⚠️ ADVISORY: ${fileName}: CRITICAL ${violations.length}件 -> 詳細: .claude/hooks/data/lint-gate-detail.json`);
      // stderr: 人間向け表示（警告のみ、ブロックしない）
      console.error(`\x1b[33m[Lint Gate] ADVISORY: ${fileName}: CRITICAL ${violations.length}件, WARNING ${warnings.length}件\x1b[0m`);
      violations.forEach((v, i) => {
        console.error(`  ${i + 1}. [${v.type}] ${v.message}`);
      });
      console.error('\x1b[33m  → 多人数共有システムのため警告のみ（ブロックしません）\x1b[0m');
      // 多人数共有システム: 警告のみ、ブロックしない
      process.exit(0);
      return;
    }

    // warnings のみの場合: stderrのみ（stdoutに出力しない）
    console.error(`\x1b[33m[Lint Gate] ${fileName}: WARNING ${warnings.length}件\x1b[0m`);
    warnings.forEach((w, i) => {
      console.error(`  ${i + 1}. [${w.type}] ${w.message}`);
    });
  }

  process.exit(0);
}

/**
 * ファイルタイプを検出
 */
function detectFileType(fileName, data) {
  if (fileName.includes('skill-mapping') || data.mappings) {
    return 'skillMapping';
  }
  if (fileName.includes('workflow') || data.phases) {
    return 'workflow';
  }
  if (fileName.includes('policy') || data.rules) {
    return 'policy';
  }
  return null;
}

/**
 * 追加の検証ルール
 */
function validateAdditionalRules(data, fileType, violations, warnings) {
  if (fileType === 'skillMapping') {
    // スキルマッピング固有の検証
    if (data.mappings) {
      for (let i = 0; i < data.mappings.length; i++) {
        const mapping = data.mappings[i];

        // required_skills が空配列でないか
        if (mapping.required_skills && mapping.required_skills.length === 0) {
          warnings.push({
            type: 'empty_skills',
            message: `mappings[${i}] (${mapping.name}) の required_skills が空です`,
          });
        }

        // when_contains_all と when_contains_any が両方空の場合
        const hasAll = mapping.when_contains_all && mapping.when_contains_all.length > 0;
        const hasAny = mapping.when_contains_any && mapping.when_contains_any.length > 0;
        if (!hasAll && !hasAny) {
          warnings.push({
            type: 'no_trigger',
            message: `mappings[${i}] (${mapping.name}) にトリガー条件がありません`,
          });
        }

        // priority が0以上か
        if (typeof mapping.priority === 'number' && mapping.priority < 0) {
          violations.push({
            type: 'invalid_priority',
            message: `mappings[${i}] (${mapping.name}) の priority は0以上である必要があります`,
          });
        }
      }
    }

    // 設定の検証
    if (data.settings) {
      if (typeof data.settings.block_on_missing_skill !== 'boolean') {
        warnings.push({
          type: 'missing_setting',
          message: 'settings.block_on_missing_skill の指定を推奨します',
        });
      }
    }
  }

  if (fileType === 'workflow') {
    // ワークフロー固有の検証
    if (data.phases) {
      for (let i = 0; i < data.phases.length; i++) {
        const phase = data.phases[i];
        if (!phase.name) {
          violations.push({
            type: 'missing_phase_name',
            message: `phases[${i}] に name がありません`,
          });
        }
      }
    }
  }
}

/**
 * 簡易YAMLパーサー（基本的なkey: valueのみ対応）
 */
function parseSimpleYaml(content) {
  // 基本的なYAMLのみ対応
  // 複雑な場合は js-yaml などのライブラリを使用すべき
  const lines = content.split('\n');
  const result = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      result[key] = value || true;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

// ===== Phase 7: Definition Lint Hard Gate API =====

/**
 * 全定義ファイルをLintする（ワークフロー開始時に呼び出し）
 */
function lintAllDefinitions(cwd) {
  const results = {
    valid: true,
    violations: [],
    warnings: [],
    checkedFiles: []
  };

  // 検索対象ディレクトリ
  const searchPaths = [
    path.join(cwd, '.claude/hooks/config'),
    path.join(cwd, 'config'),
    path.join(cwd, 'artifacts')
  ];

  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue;

    const files = fs.readdirSync(searchPath);
    for (const file of files) {
      const filePath = path.join(searchPath, file);
      const isTarget = TARGET_PATTERNS.some(pattern => pattern.test(file));

      if (isTarget && fs.statSync(filePath).isFile()) {
        const result = lintFile(filePath);
        results.checkedFiles.push(filePath);

        if (result.violations.length > 0) {
          results.valid = false;
          results.violations.push({
            file: filePath,
            issues: result.violations
          });
        }
        if (result.warnings.length > 0) {
          results.warnings.push({
            file: filePath,
            issues: result.warnings
          });
        }
      }
    }
  }

  return results;
}

/**
 * 単一ファイルをLintする
 */
function lintFile(filePath) {
  const violations = [];
  const warnings = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let data;

    if (filePath.endsWith('.json')) {
      data = JSON.parse(content);
    } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      data = parseSimpleYaml(content);
    }

    if (!data) {
      violations.push({
        type: 'parse_error',
        message: 'ファイルのパースに失敗しました'
      });
    } else {
      const fileName = path.basename(filePath);
      const fileType = detectFileType(fileName, data);
      const schema = SCHEMA_DEFINITIONS[fileType];

      if (schema) {
        if (schema.required) {
          for (const field of schema.required) {
            if (!data[field]) {
              violations.push({
                type: 'missing_required',
                message: `必須フィールド "${field}" が見つかりません`
              });
            }
          }
        }

        if (schema.recommended) {
          for (const field of schema.recommended) {
            if (!data[field]) {
              warnings.push({
                type: 'missing_recommended',
                message: `推奨フィールド "${field}" がありません`
              });
            }
          }
        }
      }
    }
  } catch (e) {
    violations.push({
      type: 'validation_error',
      message: `検証エラー: ${e.message}`
    });
  }

  return { violations, warnings };
}

// CLI実行
if (require.main === module) {
  // コマンドライン引数でlint実行
  if (process.argv[2] === 'lint-all') {
    const cwd = process.argv[3] || process.cwd();
    const results = lintAllDefinitions(cwd);
    console.log(JSON.stringify(results, null, 2));
    process.exit(results.valid ? 0 : 2);
  } else {
    main().catch(() => process.exit(0));
  }
}

// モジュールエクスポート
module.exports = {
  lintAllDefinitions,
  lintFile,
  SCHEMA_DEFINITIONS,
  TARGET_PATTERNS
};
