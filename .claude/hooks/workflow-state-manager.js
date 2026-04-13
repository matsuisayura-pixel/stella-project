#!/usr/bin/env node
/**
 * Workflow State Manager - ワークフロー状態の永続管理（Facade）
 *
 * .workflow_state.json を管理し、以下を提供:
 * - フェーズ管理
 * - ベースラインファイルのハッシュ固定
 * - Read履歴の追跡
 * - スキル使用証跡の記録
 *
 * 実装は utils/ 配下の4モジュールに分割:
 *   - utils/state-core.js       : 状態の生成・読み書き・ハッシュ・要約
 *   - utils/baseline-manager.js : ベースライン・Read履歴・スキル記録・逸脱
 *   - utils/evidence-capture.js : 証跡キャプチャ・チェック
 *   - utils/skill-lifecycle.js  : Intent Contract・参考アセット・スキルステップ・Lint
 */

const stateCore = require('./utils/state-core');
const baselineManager = require('./utils/baseline-manager');
const evidenceCapture = require('./utils/evidence-capture');
const skillLifecycle = require('./utils/skill-lifecycle');

// CLI実行時
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const cwd = process.cwd();

  switch (command) {
    case 'init': {
      const workflowId = args[1] || 'default';
      const strict = args[2] !== 'advisory';
      const state = stateCore.createInitialState(workflowId, strict);
      if (stateCore.saveState(state, cwd)) {
        console.log(JSON.stringify({ success: true, state }));
      } else {
        console.log(JSON.stringify({ success: false, error: 'Failed to save state' }));
      }
      break;
    }
    case 'load': {
      const state = stateCore.loadState(cwd);
      console.log(JSON.stringify({ success: !!state, state }));
      break;
    }
    case 'summary': {
      const state = stateCore.loadState(cwd);
      const summary = stateCore.generateStateSummary(state);
      console.log(summary || 'No workflow state found');
      break;
    }
    case 'register-baseline': {
      const filePath = args[1];
      const state = stateCore.loadState(cwd);
      if (state && filePath) {
        baselineManager.registerBaseline(state, filePath);
        stateCore.saveState(state, cwd);
        console.log(JSON.stringify({ success: true }));
      } else {
        console.log(JSON.stringify({ success: false, error: 'State or file path missing' }));
      }
      break;
    }
    default:
      console.log('Usage: workflow-state-manager.js [init|load|summary|register-baseline] [args...]');
  }
}

// モジュールエクスポート（元のインターフェースを完全に維持）
module.exports = {
  createInitialState: stateCore.createInitialState,
  loadState: stateCore.loadState,
  saveState: stateCore.saveState,
  getStatePath: stateCore.getStatePath,
  calculateFileHash: stateCore.calculateFileHash,
  registerBaseline: baselineManager.registerBaseline,
  checkBaselineIntegrity: baselineManager.checkBaselineIntegrity,
  addReadLog: baselineManager.addReadLog,
  hasBeenRead: baselineManager.hasBeenRead,
  recordSkillUsage: baselineManager.recordSkillUsage,
  hasSkillBeenUsed: baselineManager.hasSkillBeenUsed,
  recordDeviationApproval: baselineManager.recordDeviationApproval,
  isDeviationApproved: baselineManager.isDeviationApproved,
  advancePhase: stateCore.advancePhase,
  generateStateSummary: stateCore.generateStateSummary,
  // Phase 1: Intent Contract First
  validateIntentContract: skillLifecycle.validateIntentContract,
  registerIntentContract: skillLifecycle.registerIntentContract,
  INTENT_CONTRACT_PATH: skillLifecycle.INTENT_CONTRACT_PATH,
  INTENT_CONTRACT_REQUIRED_FIELDS: skillLifecycle.INTENT_CONTRACT_REQUIRED_FIELDS,
  // Phase 2: Deterministic Reference Analyzer
  registerReferenceAsset: skillLifecycle.registerReferenceAsset,
  validateReferenceAnalysis: skillLifecycle.validateReferenceAnalysis,
  verifyReferenceProvenance: skillLifecycle.verifyReferenceProvenance,
  REFERENCE_ANALYSIS_PATH: skillLifecycle.REFERENCE_ANALYSIS_PATH,
  // Phase 3: Evidence Auto Capture Ledger
  EVIDENCE_TYPES: evidenceCapture.EVIDENCE_TYPES,
  captureEvidence: evidenceCapture.captureEvidence,
  captureReadEvidence: evidenceCapture.captureReadEvidence,
  captureSearchEvidence: evidenceCapture.captureSearchEvidence,
  captureArtifactEvidence: evidenceCapture.captureArtifactEvidence,
  captureCommandEvidence: evidenceCapture.captureCommandEvidence,
  captureSkillEvidence: evidenceCapture.captureSkillEvidence,
  captureDecisionEvidence: evidenceCapture.captureDecisionEvidence,
  hasRequiredEvidence: evidenceCapture.hasRequiredEvidence,
  // Phase 6: Read Before Create Gate
  validateNewFileCreation: skillLifecycle.validateNewFileCreation,
  // Phase 4: Skill Step Transition Gate
  startSkill: skillLifecycle.startSkill,
  startStep: skillLifecycle.startStep,
  completeStep: skillLifecycle.completeStep,
  completeSkill: skillLifecycle.completeSkill,
  getActiveSkillState: skillLifecycle.getActiveSkillState,
  // Phase 7: Definition Lint Hard Gate
  runDefinitionLint: skillLifecycle.runDefinitionLint,
  validateWorkflowStart: skillLifecycle.validateWorkflowStart
};
