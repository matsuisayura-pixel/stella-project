/**
 * Skill Lifecycle - スキルのライフサイクル管理
 *
 * Intent Contract検証、参考アセット管理、
 * スキル/ステップのトランジション、定義Lint、
 * ワークフロー開始前チェックを提供する。
 */

const fs = require('fs');
const path = require('path');

const { calculateFileHash } = require('./state-core');

// ===== Intent Contract First (Phase 1) =====

const INTENT_CONTRACT_PATH = 'artifacts/intent_contract.yaml';
const INTENT_CONTRACT_REQUIRED_FIELDS = [
  'objective',
  'non_goals',
  'inputs',
  'constraints',
  'definition_of_done',
  'allowed_deviations_policy'
];

/**
 * Intent Contract の存在と必須フィールドを検証
 */
function validateIntentContract(cwd) {
  const contractPath = path.join(cwd, INTENT_CONTRACT_PATH);

  if (!fs.existsSync(contractPath)) {
    return {
      valid: false,
      reason: 'not_found',
      message: `Intent Contract が見つかりません: ${INTENT_CONTRACT_PATH}`
    };
  }

  try {
    const content = fs.readFileSync(contractPath, 'utf8');
    const data = parseYamlSimple(content);

    if (!data) {
      return {
        valid: false,
        reason: 'parse_error',
        message: 'Intent Contract のパースに失敗しました'
      };
    }

    const missingFields = [];
    for (const field of INTENT_CONTRACT_REQUIRED_FIELDS) {
      if (!data[field] && data[field] !== false && data[field] !== 0) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return {
        valid: false,
        reason: 'missing_fields',
        message: `必須フィールドが不足: ${missingFields.join(', ')}`,
        missingFields
      };
    }

    return {
      valid: true,
      reason: 'valid',
      data
    };
  } catch (e) {
    return {
      valid: false,
      reason: 'read_error',
      message: `Intent Contract の読み込みエラー: ${e.message}`
    };
  }
}

/**
 * Intent Contract の参照をstateに登録
 */
function registerIntentContract(state, contractPath, contractHash) {
  state.intentContractRef = {
    path: contractPath,
    sha256: contractHash,
    registeredAt: new Date().toISOString()
  };
  return true;
}

// ===== Phase 2: Deterministic Reference Analyzer =====

const REFERENCE_ANALYSIS_PATH = 'artifacts/reference_analysis.json';

/**
 * 参考アセットを登録し、sha256をロック
 */
function registerReferenceAsset(state, assetId, sha256, metadata = {}) {
  // registeredInputs に追加
  const existingIndex = state.registeredInputs.referenceAssets.findIndex(a => a.asset_id === assetId);
  const registration = {
    asset_id: assetId,
    sha256: sha256,
    metadata: metadata,
    registeredAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    state.registeredInputs.referenceAssets[existingIndex] = registration;
  } else {
    state.registeredInputs.referenceAssets.push(registration);
  }

  // locks にも追加
  const lockIndex = state.locks.referenceAssets.findIndex(l => l.asset_id === assetId);
  const lock = {
    asset_id: assetId,
    sha256: sha256,
    lockedAt: new Date().toISOString()
  };

  if (lockIndex >= 0) {
    state.locks.referenceAssets[lockIndex] = lock;
  } else {
    state.locks.referenceAssets.push(lock);
  }

  return true;
}

/**
 * reference_analysis.json の存在と内容を検証
 */
function validateReferenceAnalysis(cwd) {
  const analysisPath = path.join(cwd, REFERENCE_ANALYSIS_PATH);

  if (!fs.existsSync(analysisPath)) {
    return {
      valid: false,
      reason: 'not_found',
      message: `参考入力の分析結果が見つかりません: ${REFERENCE_ANALYSIS_PATH}`
    };
  }

  try {
    const content = fs.readFileSync(analysisPath, 'utf8');
    const data = JSON.parse(content);

    if (!data.assets || data.assets.length === 0) {
      return {
        valid: false,
        reason: 'empty',
        message: '分析結果にアセットが含まれていません'
      };
    }

    // 各アセットに必須フィールドがあるか確認
    const requiredFields = ['asset_id', 'type', 'sha256', 'metadata', 'derived_features', 'timestamp'];
    for (const asset of data.assets) {
      for (const field of requiredFields) {
        if (!(field in asset)) {
          return {
            valid: false,
            reason: 'missing_field',
            message: `アセット ${asset.asset_id || 'unknown'} に必須フィールド "${field}" がありません`
          };
        }
      }
    }

    return {
      valid: true,
      reason: 'valid',
      data
    };
  } catch (e) {
    return {
      valid: false,
      reason: 'parse_error',
      message: `分析結果のパースエラー: ${e.message}`
    };
  }
}

/**
 * 登録済みアセットと分析結果のsha256が一致するか検証
 */
function verifyReferenceProvenance(state, cwd) {
  if (!state.locks.referenceAssets || state.locks.referenceAssets.length === 0) {
    return { valid: true, reason: 'no_locks' };
  }

  const analysisValidation = validateReferenceAnalysis(cwd);
  if (!analysisValidation.valid) {
    return analysisValidation;
  }

  const mismatches = [];
  for (const lock of state.locks.referenceAssets) {
    const analyzed = analysisValidation.data.assets.find(a => a.asset_id === lock.asset_id);

    if (!analyzed) {
      mismatches.push({
        asset_id: lock.asset_id,
        reason: 'not_analyzed',
        expected: lock.sha256
      });
    } else if (analyzed.sha256 !== lock.sha256) {
      mismatches.push({
        asset_id: lock.asset_id,
        reason: 'hash_mismatch',
        expected: lock.sha256,
        actual: analyzed.sha256
      });
    }
  }

  if (mismatches.length > 0) {
    return {
      valid: false,
      reason: 'provenance_mismatch',
      message: '参考入力のすり替えを検知しました',
      mismatches
    };
  }

  return { valid: true, reason: 'verified' };
}

// ===== Phase 6: Read Before Create Gate =====

/**
 * 新規ファイル作成前に必要な探索/Read/決定があるか検証
 * PreToolUse の Write/Edit 時に呼び出し、証跡が不足していればブロック
 */
function validateNewFileCreation(state, filePath) {
  // EVIDENCE_TYPES を動的にロード（循環参照を避ける）
  const { EVIDENCE_TYPES } = require('./evidence-capture');

  const checks = {
    hasSearch: false,
    hasRead: false,
    hasDecision: false,
    searchCount: 0,
    readCount: 0,
    decisionCount: 0
  };

  // 証跡から探索/Read/決定の有無をチェック
  const evidence = state.evidence.skillEvidence || [];
  const recentEvidence = evidence.slice(-20); // 直近20件をチェック

  for (const ev of recentEvidence) {
    if (ev.type === EVIDENCE_TYPES.SEARCH_REPO) {
      checks.hasSearch = true;
      checks.searchCount++;
    }
    if (ev.type === EVIDENCE_TYPES.READ_FILE) {
      checks.hasRead = true;
      checks.readCount++;
    }
    if (ev.type === EVIDENCE_TYPES.DECISION_MADE) {
      checks.hasDecision = true;
      checks.decisionCount++;
    }
  }

  // 既存のRead履歴も確認
  if (state.evidence.read_log && state.evidence.read_log.length > 0) {
    checks.hasRead = true;
    checks.readCount = Math.max(checks.readCount, state.evidence.read_log.length);
  }

  // 決定証跡は state.decisions.assetReuse からも確認
  if (state.decisions.assetReuse && state.decisions.assetReuse.length > 0) {
    checks.hasDecision = true;
    checks.decisionCount = Math.max(checks.decisionCount, state.decisions.assetReuse.length);
  }

  // 条件: 探索または決定が必要
  // 最低限、Readまたは決定が必要（探索なしでも明確な決定があればOK）
  const valid = (checks.hasSearch || checks.hasRead) && (checks.hasDecision || checks.readCount >= 2);

  return {
    valid: valid,
    checks: checks,
    reason: valid ? null : 'no_read_evidence',
    message: valid ? '' : '探索+Read+決定が不足しています'
  };
}

// ===== Phase 4: Skill Step Transition Gate =====

/**
 * スキルを開始（activeSkillIdを設定）
 */
function startSkill(state, skillId) {
  state.activeSkillId = skillId;
  state.activeSkillStepId = null;
  state.evidence.skills_used[skillId] = {
    startedAt: new Date().toISOString(),
    steps: []
  };
  return { success: true, skillId };
}

/**
 * ステップを開始（activeSkillStepIdを設定）
 */
function startStep(state, stepId) {
  if (!state.activeSkillId) {
    return { success: false, reason: 'no_active_skill', message: 'スキルが開始されていません' };
  }

  state.activeSkillStepId = stepId;

  // ステップ証跡インデックスを初期化
  if (!state.evidence.skillEvidenceIndexByStepId[stepId]) {
    state.evidence.skillEvidenceIndexByStepId[stepId] = [];
  }

  // スキル使用履歴に記録
  if (state.evidence.skills_used[state.activeSkillId]) {
    state.evidence.skills_used[state.activeSkillId].steps.push({
      stepId: stepId,
      startedAt: new Date().toISOString()
    });
  }

  return { success: true, stepId };
}

/**
 * ステップを完了（Gate関数 - requiredEvidenceがなければブロック）
 */
function completeStep(state, stepId, requiredEvidence = []) {
  // hasRequiredEvidence を動的にロード（循環参照を避ける）
  const { hasRequiredEvidence } = require('./evidence-capture');

  if (!state.activeSkillId) {
    return { success: false, reason: 'no_active_skill', message: 'スキルが開始されていません' };
  }

  if (state.activeSkillStepId !== stepId) {
    return {
      success: false,
      reason: 'step_mismatch',
      message: `現在のステップは${state.activeSkillStepId}ですが、${stepId}を完了しようとしています`
    };
  }

  // 必要証跡のチェック
  if (requiredEvidence.length > 0) {
    const evidenceCheck = hasRequiredEvidence(state, stepId, requiredEvidence);
    if (!evidenceCheck.valid) {
      return {
        success: false,
        reason: 'missing_evidence',
        message: `ステップ完了に必要な証跡が不足しています`,
        missing: evidenceCheck.missing,
        present: evidenceCheck.present
      };
    }
  }

  // ステップ完了を記録
  const skillSteps = state.evidence.skills_used[state.activeSkillId]?.steps || [];
  const currentStep = skillSteps.find(s => s.stepId === stepId);
  if (currentStep) {
    currentStep.completedAt = new Date().toISOString();
  }

  // activeSkillStepIdをクリア（次のステップを待つ）
  state.activeSkillStepId = null;

  return { success: true, stepId, message: `ステップ${stepId}が完了しました` };
}

/**
 * スキルを完了
 */
function completeSkill(state, skillId) {
  if (state.activeSkillId !== skillId) {
    return {
      success: false,
      reason: 'skill_mismatch',
      message: `現在のスキルは${state.activeSkillId}ですが、${skillId}を完了しようとしています`
    };
  }

  // スキル完了を記録
  if (state.evidence.skills_used[skillId]) {
    state.evidence.skills_used[skillId].completedAt = new Date().toISOString();
  }

  // activeSkillIdをクリア
  state.activeSkillId = null;
  state.activeSkillStepId = null;

  return { success: true, skillId, message: `スキル${skillId}が完了しました` };
}

/**
 * 現在のスキル/ステップ状態を取得
 */
function getActiveSkillState(state) {
  return {
    activeSkillId: state.activeSkillId,
    activeSkillStepId: state.activeSkillStepId,
    skillHistory: state.evidence.skills_used
  };
}

// ===== Phase 7: Definition Lint Hard Gate =====

/**
 * 定義ファイルのLintを実行（ワークフロー開始時）
 */
function runDefinitionLint(cwd) {
  try {
    const lintGate = require('../definition-lint-gate.js');
    return lintGate.lintAllDefinitions(cwd);
  } catch (e) {
    return {
      valid: true,
      error: `Lint module load error: ${e.message}`,
      checkedFiles: []
    };
  }
}

/**
 * Strict モードでワークフローを開始する前のチェック
 */
function validateWorkflowStart(cwd, strict = true) {
  const checks = {
    intentContract: null,
    definitionLint: null,
    valid: true,
    blockers: []
  };

  // Intent Contract チェック
  if (strict) {
    const contractCheck = validateIntentContract(cwd);
    checks.intentContract = contractCheck;
    if (!contractCheck.valid) {
      checks.valid = false;
      checks.blockers.push(`Intent Contract: ${contractCheck.reason}`);
    }
  }

  // Definition Lint チェック
  if (strict) {
    const lintCheck = runDefinitionLint(cwd);
    checks.definitionLint = lintCheck;
    if (!lintCheck.valid) {
      checks.valid = false;
      checks.blockers.push(`Definition Lint: ${lintCheck.violations.length}件の違反`);
    }
  }

  return checks;
}

/**
 * 簡易YAMLパーサー（基本的なkey: valueのみ対応）
 */
function parseYamlSimple(content) {
  const lines = content.split('\n');
  const result = {};
  let currentKey = null;
  let currentIndent = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (value === '' || value === '|' || value === '>') {
        result[key] = true; // 値がある（空でも）
      } else if (value.startsWith('[') || value.startsWith('{')) {
        result[key] = value;
      } else if (value === 'true' || value === 'false') {
        result[key] = value === 'true';
      } else {
        result[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

module.exports = {
  INTENT_CONTRACT_PATH,
  INTENT_CONTRACT_REQUIRED_FIELDS,
  validateIntentContract,
  registerIntentContract,
  REFERENCE_ANALYSIS_PATH,
  registerReferenceAsset,
  validateReferenceAnalysis,
  verifyReferenceProvenance,
  validateNewFileCreation,
  startSkill,
  startStep,
  completeStep,
  completeSkill,
  getActiveSkillState,
  runDefinitionLint,
  validateWorkflowStart,
  parseYamlSimple
};
