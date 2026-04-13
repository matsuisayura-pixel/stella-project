/**
 * State Core - ワークフロー状態の基本操作
 *
 * 初期状態の生成、読み込み、保存、ハッシュ計算、
 * フェーズ進行、状態要約を提供する。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STATE_FILENAME = '.workflow_state.json';

/**
 * 初期状態スキーマ (v2.0.0 - Intent Contract First 対応)
 */
function createInitialState(workflowId, strict = true) {
  return {
    version: '2.0.0',
    meta: {
      workflowId: workflowId,
      strict: strict,
      currentPhase: 1,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    },
    // Intent Contract First (Phase 1)
    intentContractRef: null,
    // Active skill/step tracking (Phase 4)
    activeSkillId: null,
    activeSkillStepId: null,
    // Baseline files
    baseline: {
      files: {}
    },
    // Reference assets (Phase 2, 5)
    registeredInputs: {
      referenceAssets: []
    },
    locks: {
      referenceAssets: []
    },
    // Evidence ledger (Phase 3)
    evidence: {
      skills_used: {},
      read_log: [],
      approved_deviations: [],
      skillEvidence: [],
      skillEvidenceIndexByStepId: {}
    },
    // Decisions (Phase 6)
    decisions: {
      assetReuse: []
    },
    // Approvals (enhanced for Phase deviation)
    approvals: {
      deviations: []
    },
    // Validations (Phase 7)
    validations: {
      lastResults: []
    },
    completed_phases: [],
    blockers: []
  };
}

/**
 * 状態ファイルのパスを取得
 */
function getStatePath(cwd) {
  return path.join(cwd || process.cwd(), STATE_FILENAME);
}

/**
 * 状態を読み込み
 */
function loadState(cwd) {
  const statePath = getStatePath(cwd);
  try {
    if (fs.existsSync(statePath)) {
      const content = fs.readFileSync(statePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {}
  return null;
}

/**
 * 状態を保存
 */
function saveState(state, cwd) {
  const statePath = getStatePath(cwd);
  state.meta.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * ファイルのSHA256ハッシュを計算
 */
function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

/**
 * フェーズを進める
 */
function advancePhase(state) {
  state.completed_phases.push(state.meta.currentPhase);
  state.meta.currentPhase += 1;
  return true;
}

/**
 * 状態の要約を生成（SessionStart注入用）
 */
function generateStateSummary(state) {
  if (!state) return null;

  const lines = [];
  lines.push('=== WORKFLOW STATE SUMMARY ===');
  lines.push('');
  lines.push(`**Workflow**: ${state.meta.workflowId}`);
  lines.push(`**Mode**: ${state.meta.strict ? 'STRICT (逸脱はブロックされます)' : 'ADVISORY'}`);
  lines.push(`**Current Phase**: ${state.meta.currentPhase}`);
  lines.push(`**Started**: ${state.meta.startedAt}`);
  lines.push('');

  if (state.completed_phases.length > 0) {
    lines.push(`**Completed Phases**: ${state.completed_phases.join(', ')}`);
  }

  if (Object.keys(state.baseline.files).length > 0) {
    lines.push('');
    lines.push('**Baseline Files (変更禁止)**:');
    Object.entries(state.baseline.files).forEach(([name, info]) => {
      lines.push(`  - ${name} (${info.sha256.substring(0, 8)}...)`);
    });
  }

  if (Object.keys(state.evidence.skills_used).length > 0) {
    lines.push('');
    lines.push('**Used Skills**:');
    Object.keys(state.evidence.skills_used).forEach(skill => {
      lines.push(`  - ${skill}`);
    });
  }

  if (state.blockers.length > 0) {
    lines.push('');
    lines.push('**BLOCKERS**:');
    state.blockers.forEach(b => {
      lines.push(`  - ${b}`);
    });
  }

  lines.push('');
  lines.push('**RULES**:');
  lines.push('1. ベースラインファイルの改変は禁止');
  lines.push('2. 未読ファイルの編集は禁止（先にReadせよ）');
  lines.push('3. 指示にない行動は事前承認が必要');
  lines.push('4. スキル指定がある場合はSkillツールを使用');
  lines.push('');
  lines.push('=== END WORKFLOW STATE ===');

  return lines.join('\n');
}

module.exports = {
  STATE_FILENAME,
  createInitialState,
  getStatePath,
  loadState,
  saveState,
  calculateFileHash,
  advancePhase,
  generateStateSummary
};
