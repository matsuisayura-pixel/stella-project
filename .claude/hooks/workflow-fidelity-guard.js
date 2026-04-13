#!/usr/bin/env node
/**
 * Workflow Fidelity Guard - ワークフロー忠実性の強制ガード
 *
 * PreToolUse / PostToolUse で実行され、以下を物理的にブロック:
 * 1. ベースラインファイルの改変
 * 2. 未読ファイルの編集（Read-before-Write）
 * 3. フェーズ外の危険なコマンド実行
 * 4. 新規スクリプトの勝手な作成
 *
 * exit code:
 * - 0: 許可
 * - 2: ブロック（実行不能）
 */

const fs = require('fs');
const path = require('path');
const stateManager = require('./workflow-state-manager.js');

// ベースラインとして保護するファイルパターン
const BASELINE_PATTERNS = [
  /create_video\.py$/,
  /generate_video\.py$/,
  /main\.py$/,
  /run\.sh$/,
  /process\.py$/
];

// 危険なBashコマンドパターン（strict時にstateなしでブロック）
const DANGEROUS_BASH_PATTERNS = [
  /ffmpeg/,
  /python.*create_video\.py/,
  /python.*generate_video\.py/,
  /rm\s+-rf/,
  /rm\s+-r/,

  // TTS: macOS say コマンドは品質不足（Fish Audio/Style-Bert-VITS2を使うべき）
  /\bsay\s+-v\b/,
  /\bsay\s+.*-o\b/,

  // パイプライン代替: 静的HTML/CSSで動画パイプラインを代替しようとするパターン
  /generate-tts\.sh/,  // macOS sayベースのTTSスクリプト
];

// 警告のみのパターン（ブロックはしないが注意喚起）
const WARN_BASH_PATTERNS = [
  {
    pattern: /\bsay\s+/,
    message: '【警告】macOS say コマンドを検出。商用品質のTTSには Fish Audio または Style-Bert-VITS2 を使用してください。',
    suggestion: 'interactive-video-platform スキルのTTSパイプライン（Fish Audio）を使用してください。'
  },
  {
    pattern: /npm\s+run\s+dev|next\s+dev|next\s+build/,
    message: '【確認】Next.js 静的サイトを構築中。動画パイプライン（Remotion）が必要な場合はスキルを確認してください。',
    suggestion: 'インタラクティブ動画の場合は interactive-video-platform スキルの Remotion パイプラインを使用してください。'
  }
];

// 新規スクリプト作成パターン（ブロック対象）
const NEW_SCRIPT_PATTERNS = [
  /\.py$/,
  /\.sh$/,
  /\.js$/,
  /\.ts$/
];

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
  const hookEvent = input.hook_event || 'PreToolUse';
  const cwd = input.cwd || process.cwd();

  // Bootstrap Safe Mode: ワークフロー未開始ならスキップ
  const workflowStatePath = path.join(cwd, '.workflow_state.json');
  if (!fs.existsSync(workflowStatePath)) {
    process.exit(0);
    return;
  }

  // ワークフロー状態を読み込み
  const state = stateManager.loadState(cwd);
  const isStrict = state?.meta?.strict ?? false;

  // PostToolUse: 証跡の自動キャプチャ（Phase 3）
  if (hookEvent === 'PostToolUse') {
    if (state) {
      switch (toolName) {
        case 'Read': {
          const filePath = toolInput.file_path || '';
          stateManager.addReadLog(state, filePath, process.env.SESSION_ID);
          stateManager.captureReadEvidence(state, filePath, process.env.SESSION_ID);

          // ベースラインファイルなら自動登録
          if (isBaselineFile(filePath)) {
            stateManager.registerBaseline(state, filePath);
          }
          break;
        }

        case 'Glob':
        case 'Grep': {
          const pattern = toolInput.pattern || '';
          stateManager.captureSearchEvidence(state, toolName.toLowerCase(), pattern, []);
          break;
        }

        case 'Write':
        case 'Edit': {
          const filePath = toolInput.file_path || '';
          const operation = toolName === 'Write' ? 'create' : 'update';
          stateManager.captureArtifactEvidence(state, filePath, operation, null);
          break;
        }

        case 'Bash': {
          const command = toolInput.command || '';
          stateManager.captureCommandEvidence(state, command, 0);
          break;
        }

        case 'Skill': {
          const skillName = toolInput.skill || '';
          const args = toolInput.args || '';
          stateManager.captureSkillEvidence(state, skillName, args);
          break;
        }
      }

      stateManager.saveState(state, cwd);
    }
    process.exit(0);
    return;
  }

  // PreToolUse: ブロック判定
  if (hookEvent === 'PreToolUse') {
    const result = evaluatePreToolUse(toolName, toolInput, state, isStrict, cwd);

    if (result.blocked) {
      // ブロック時は理由を出力してexit 2
      const output = {
        decision: 'block',
        reason: result.reason,
        suggestion: result.suggestion,
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: buildBlockMessage(result)
        }
      };
      console.log(JSON.stringify(output));
      process.exit(2);
      return;
    }

    // 警告のみ（ブロックしない）
    if (result.warning) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: buildWarningMessage(result)
        }
      };
      console.log(JSON.stringify(output));
    }
  }

  process.exit(0);
}

function evaluatePreToolUse(toolName, toolInput, state, isStrict, cwd) {
  const result = {
    blocked: false,
    warning: false,
    reason: '',
    suggestion: ''
  };

  // ===== Phase 1: Intent Contract First Gate =====
  // Read/Glob/Grep/Search 以外の危険操作は契約必須
  const SAFE_TOOLS = ['Read', 'Glob', 'Grep', 'WebSearch'];
  const DANGEROUS_TOOLS = ['Bash', 'Write', 'Edit', 'Task', 'Skill'];

  if (isStrict && DANGEROUS_TOOLS.includes(toolName)) {
    const contractValidation = stateManager.validateIntentContract(cwd);

    if (!contractValidation.valid) {
      // not_found = 新規インストール時。ブロックせず警告のみ（循環依存防止）
      if (contractValidation.reason === 'not_found') {
        result.warning = true;
        result.reason = `Intent Contract が未作成です。/workflow-start で作成を推奨します。`;
      } else {
        result.blocked = true;
        result.reason = `【安全停止】Intent Contract が未確定です（意図乖離防止のため停止）。`;
        result.suggestion = buildIntentContractBlockMessage(contractValidation);
        return result;
      }
    }
  }

  // ===== Phase 2 & 5: Reference Provenance Gate =====
  // 生成系操作（ffmpeg/python create_video等）は参考入力の証跡が必要
  const GENERATION_PATTERNS = [
    /ffmpeg/,
    /python.*create_video/,
    /python.*generate/,
    /node.*generate/
  ];

  if (toolName === 'Bash' && state && isStrict) {
    const command = toolInput.command || '';
    const isGenerationCommand = GENERATION_PATTERNS.some(p => p.test(command));

    if (isGenerationCommand) {
      // Phase 2: reference_analysis.json の存在確認
      const analysisValidation = stateManager.validateReferenceAnalysis(cwd);
      if (!analysisValidation.valid) {
        result.blocked = true;
        result.reason = `【安全停止】参考入力の分析結果がありません（生成前に必須）。`;
        result.suggestion = buildReferenceAnalysisBlockMessage(analysisValidation);
        return result;
      }

      // Phase 5: sha256固定による参照入力すり替え検知
      const provenanceCheck = stateManager.verifyReferenceProvenance(state, cwd);
      if (!provenanceCheck.valid && provenanceCheck.reason === 'provenance_mismatch') {
        result.blocked = true;
        result.reason = `【安全停止】参考入力のすり替えを検知しました。`;
        result.suggestion = buildProvenanceMismatchMessage(provenanceCheck);
        return result;
      }
    }
  }

  // Bashコマンドの評価
  if (toolName === 'Bash') {
    const command = toolInput.command || '';

    // 危険なコマンドのチェック
    for (const pattern of DANGEROUS_BASH_PATTERNS) {
      if (pattern.test(command)) {
        if (!state) {
          result.blocked = isStrict;
          result.warning = !isStrict;
          result.reason = `危険なコマンド「${command.substring(0, 50)}...」を実行しようとしていますが、ワークフロー状態が存在しません。`;
          result.suggestion = 'まず `npm run workflow:start -- <workflow_id> --strict` を実行してワークフローを開始してください。';
          return result;
        }
      }
    }

    // 警告パターンのチェック（ブロックはしない）
    for (const { pattern, message, suggestion } of WARN_BASH_PATTERNS) {
      if (pattern.test(command)) {
        result.warning = true;
        result.reason = message;
        result.suggestion = suggestion;
        return result;
      }
    }
  }

  // Write/Edit の評価
  if (toolName === 'Write' || toolName === 'Edit') {
    const filePath = toolInput.file_path || '';
    const basename = path.basename(filePath);

    // 1. ベースラインファイルの改変チェック
    if (state && isBaselineFile(filePath)) {
      const integrity = stateManager.checkBaselineIntegrity(state, filePath);
      if (!integrity.valid && integrity.reason === 'hash_mismatch') {
        result.blocked = true;
        result.reason = `ベースラインファイル「${basename}」は保護されています。内容を変更することはできません。`;
        result.suggestion = '既存のベースラインファイルをそのまま使用してください。変更が必要な場合は、ユーザーの明示的な承認を得てください。';
        return result;
      }
    }

    // 2. Read-before-Write チェック
    if (state && isStrict) {
      // 既存ファイルの場合のみチェック
      if (fs.existsSync(filePath)) {
        if (!stateManager.hasBeenRead(state, filePath)) {
          result.blocked = true;
          result.reason = `ファイル「${basename}」を編集しようとしていますが、まだ読み込んでいません。`;
          result.suggestion = `まず Read ツールで「${filePath}」を読み込んでから編集してください。`;
          return result;
        }
      }
    }

    // 3. 新規スクリプト作成のチェック (Phase 6: Read Before Create with Decision)
    if (toolName === 'Write' && !fs.existsSync(filePath)) {
      if (NEW_SCRIPT_PATTERNS.some(p => p.test(filePath))) {
        // ベースラインファイルと同名の新規作成は特に危険
        if (state && state.baseline.files[basename]) {
          result.blocked = true;
          result.reason = `ベースラインとして登録済みの「${basename}」と同名の新規ファイルを作成しようとしています。`;
          result.suggestion = `既存のベースラインファイル「${state.baseline.files[basename].path}」を使用してください。`;
          return result;
        }

        // Phase 6: strict時は探索+Read+決定が必要
        if (isStrict && state) {
          const readBeforeCreateCheck = stateManager.validateNewFileCreation(state, filePath);
          if (!readBeforeCreateCheck.valid) {
            result.blocked = true;
            result.reason = `【安全停止】新規ファイル作成前に必要な手順が完了していません。`;
            result.suggestion = buildReadBeforeCreateMessage(readBeforeCreateCheck);
            return result;
          }
        } else if (isStrict) {
          result.blocked = true;
          result.reason = `新規スクリプト「${basename}」の作成は、strict mode では禁止されています。`;
          result.suggestion = '既存のスクリプトを使用するか、ユーザーの明示的な承認を得てください。';
          return result;
        } else {
          result.warning = true;
          result.reason = `新規スクリプト「${basename}」を作成しようとしています。`;
          result.suggestion = '既存のスクリプトがないか確認してください。';
        }
      }
    }
  }

  return result;
}

function isBaselineFile(filePath) {
  return BASELINE_PATTERNS.some(p => p.test(filePath));
}

// Note: checkReadBeforeCreate moved to stateManager.validateNewFileCreation

/**
 * Read Before Create ブロックメッセージ (Phase 6)
 */
function buildReadBeforeCreateMessage(checkResult) {
  const lines = [];
  lines.push('新規ファイル作成前に以下が必要です:');
  lines.push('');
  lines.push('1) **探索**: 類似ファイルがないかGlob/Grepで検索');
  if (!checkResult.checks.hasSearch) {
    lines.push('   → ❌ 探索証跡がありません');
  } else {
    lines.push(`   → ✓ ${checkResult.checks.searchCount}件の探索を実行`);
  }
  lines.push('');
  lines.push('2) **Read**: 既存の類似ファイルを読み込み');
  if (!checkResult.checks.hasRead) {
    lines.push('   → ❌ Read証跡がありません');
  } else {
    lines.push(`   → ✓ ${checkResult.checks.readCount}件のファイルをRead`);
  }
  lines.push('');
  lines.push('3) **決定**: 新規作成の理由を明記');
  if (!checkResult.checks.hasDecision) {
    lines.push('   → ❌ 決定証跡がありません');
    lines.push('   → captureDecisionEvidence で理由を記録してください');
  } else {
    lines.push(`   → ✓ ${checkResult.checks.decisionCount}件の決定を記録`);
  }
  lines.push('');
  lines.push('【対処方法】');
  lines.push('a) Glob/Grepで類似ファイルを探索');
  lines.push('b) 見つかったファイルをRead');
  lines.push('c) 新規作成が必要な理由を決定として記録');
  lines.push('d) その後で新規ファイル作成を再実行');

  return lines.join('\n');
}

function buildBlockMessage(result) {
  const lines = [];
  lines.push('');
  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push('│  BLOCKED: この操作は実行できません                          │');
  lines.push('└─────────────────────────────────────────────────────────────┘');
  lines.push('');
  lines.push(`**理由**: ${result.reason}`);
  lines.push('');
  lines.push(`**対処方法**: ${result.suggestion}`);
  lines.push('');
  lines.push('**Workflow Fidelity Guard** により、ワークフローの忠実性が保護されています。');
  lines.push('');
  return lines.join('\n');
}

function buildWarningMessage(result) {
  const lines = [];
  lines.push('');
  lines.push('=== WORKFLOW FIDELITY WARNING ===');
  lines.push('');
  lines.push(`**警告**: ${result.reason}`);
  lines.push(`**推奨**: ${result.suggestion}`);
  lines.push('');
  lines.push('=== END WARNING ===');
  lines.push('');
  return lines.join('\n');
}

/**
 * Intent Contract First ブロックメッセージ
 */
function buildIntentContractBlockMessage(validation) {
  const lines = [];
  lines.push('次にやること:');
  lines.push('1) artifacts/intent_contract.yaml を作成/更新');
  lines.push('2) 以下の必須フィールドを確定:');
  lines.push('   - objective: タスクの目的');
  lines.push('   - non_goals: やらないこと');
  lines.push('   - inputs: 入力（参考画像等）');
  lines.push('   - constraints: 制約条件');
  lines.push('   - definition_of_done: 完了条件');
  lines.push('   - allowed_deviations_policy: 許容される逸脱');
  lines.push('3) それから危険操作を再実行してください');
  lines.push('');

  if (validation.reason === 'not_found') {
    lines.push('**状態**: ファイルが存在しません');
  } else if (validation.reason === 'missing_fields') {
    lines.push(`**不足フィールド**: ${validation.missingFields.join(', ')}`);
  } else if (validation.reason === 'parse_error') {
    lines.push('**状態**: YAML構文エラー');
  }

  return lines.join('\n');
}

/**
 * Reference Analysis ブロックメッセージ (Phase 2)
 */
function buildReferenceAnalysisBlockMessage(validation) {
  const lines = [];
  lines.push('次にやること:');
  lines.push('1) 参考入力（画像/動画/URL）を決定的に分析:');
  lines.push('   node scripts/analyze_reference_asset.js --path <file>');
  lines.push('   または');
  lines.push('   node scripts/analyze_reference_asset.js --url <url>');
  lines.push('2) artifacts/reference_analysis.json が生成されることを確認');
  lines.push('3) 生成コマンドを再実行');
  lines.push('');

  if (validation.reason === 'not_found') {
    lines.push('**状態**: artifacts/reference_analysis.json が存在しません');
  } else if (validation.reason === 'empty') {
    lines.push('**状態**: 分析結果が空です');
  } else if (validation.reason === 'parse_error') {
    lines.push('**状態**: JSONパースエラー');
  }

  return lines.join('\n');
}

/**
 * Provenance Mismatch ブロックメッセージ (Phase 5)
 */
function buildProvenanceMismatchMessage(provenanceCheck) {
  const lines = [];
  lines.push('【参考入力すり替え検知】');
  lines.push('登録時と現在の参考入力のsha256が一致しません。');
  lines.push('');
  lines.push('不一致アセット:');

  if (provenanceCheck.mismatches) {
    for (const m of provenanceCheck.mismatches) {
      if (m.reason === 'not_analyzed') {
        lines.push(`  - ${m.asset_id}: 分析結果が見つかりません`);
      } else if (m.reason === 'hash_mismatch') {
        lines.push(`  - ${m.asset_id}:`);
        lines.push(`    期待: ${m.expected.substring(0, 16)}...`);
        lines.push(`    実際: ${m.actual.substring(0, 16)}...`);
      }
    }
  }

  lines.push('');
  lines.push('対処方法:');
  lines.push('1) 参考入力が正しいか確認');
  lines.push('2) 正しい入力で再度 analyze_reference_asset.js を実行');
  lines.push('3) ワークフロー状態をリセット（必要な場合）');

  return lines.join('\n');
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
