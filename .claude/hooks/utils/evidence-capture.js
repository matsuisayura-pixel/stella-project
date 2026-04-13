/**
 * Evidence Capture - 証跡の自動キャプチャとチェック
 *
 * Phase 3: Evidence Auto Capture Ledger
 * Hook PostToolUse から呼ばれ、各種操作の証跡を記録する。
 */

/**
 * 証跡タイプ定義
 */
const EVIDENCE_TYPES = {
  READ_FILE: 'read:file',
  SEARCH_REPO: 'search:repo',
  ARTIFACT_CREATED: 'artifact:file_created',
  ARTIFACT_UPDATED: 'artifact:file_updated',
  HASH_REFERENCE: 'hash:sha256_of_reference_asset',
  COMMAND_EXECUTED: 'command:executed',
  SKILL_INVOKED: 'skill:invoked',
  DECISION_MADE: 'decision:made'
};

/**
 * 自動証跡キャプチャ（Hook PostToolUseから呼ばれる）
 */
function captureEvidence(state, evidenceType, data) {
  if (!state.evidence.skillEvidence) {
    state.evidence.skillEvidence = [];
  }

  const evidence = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    type: evidenceType,
    data: data,
    capturedAt: new Date().toISOString(),
    activeSkillId: state.activeSkillId,
    activeSkillStepId: state.activeSkillStepId
  };

  state.evidence.skillEvidence.push(evidence);

  // stepIdがあればインデックスにも追加
  if (state.activeSkillStepId) {
    if (!state.evidence.skillEvidenceIndexByStepId) {
      state.evidence.skillEvidenceIndexByStepId = {};
    }
    if (!state.evidence.skillEvidenceIndexByStepId[state.activeSkillStepId]) {
      state.evidence.skillEvidenceIndexByStepId[state.activeSkillStepId] = [];
    }
    state.evidence.skillEvidenceIndexByStepId[state.activeSkillStepId].push(evidence.id);
  }

  return evidence;
}

/**
 * Read証跡をキャプチャ
 */
function captureReadEvidence(state, filePath, sessionId) {
  return captureEvidence(state, EVIDENCE_TYPES.READ_FILE, {
    file_path: filePath,
    session_id: sessionId
  });
}

/**
 * Search証跡をキャプチャ（Glob/Grep）
 */
function captureSearchEvidence(state, searchType, pattern, results) {
  return captureEvidence(state, EVIDENCE_TYPES.SEARCH_REPO, {
    search_type: searchType,
    pattern: pattern,
    result_count: results?.length || 0,
    results_summary: results?.slice(0, 5) // 最初の5件のみ
  });
}

/**
 * Artifact証跡をキャプチャ（Write/Edit）
 */
function captureArtifactEvidence(state, filePath, operation, sha256) {
  const type = operation === 'create'
    ? EVIDENCE_TYPES.ARTIFACT_CREATED
    : EVIDENCE_TYPES.ARTIFACT_UPDATED;

  return captureEvidence(state, type, {
    file_path: filePath,
    operation: operation,
    sha256: sha256
  });
}

/**
 * Command実行証跡をキャプチャ（Bash）
 */
function captureCommandEvidence(state, command, exitCode) {
  return captureEvidence(state, EVIDENCE_TYPES.COMMAND_EXECUTED, {
    command_preview: command.substring(0, 100),
    exit_code: exitCode
  });
}

/**
 * Skill呼び出し証跡をキャプチャ
 */
function captureSkillEvidence(state, skillName, args) {
  return captureEvidence(state, EVIDENCE_TYPES.SKILL_INVOKED, {
    skill_name: skillName,
    args_preview: JSON.stringify(args).substring(0, 200)
  });
}

/**
 * 意思決定証跡をキャプチャ
 */
function captureDecisionEvidence(state, decision, rationale) {
  return captureEvidence(state, EVIDENCE_TYPES.DECISION_MADE, {
    decision: decision,
    rationale: rationale
  });
}

/**
 * 特定Stepに必要な証跡があるかチェック
 */
function hasRequiredEvidence(state, stepId, requiredTypes) {
  if (!state.evidence.skillEvidenceIndexByStepId) {
    return { valid: false, missing: requiredTypes };
  }

  const stepEvidenceIds = state.evidence.skillEvidenceIndexByStepId[stepId] || [];
  const stepEvidence = state.evidence.skillEvidence.filter(e => stepEvidenceIds.includes(e.id));
  const presentTypes = stepEvidence.map(e => e.type);

  const missing = requiredTypes.filter(t => !presentTypes.includes(t));

  return {
    valid: missing.length === 0,
    missing: missing,
    present: presentTypes
  };
}

module.exports = {
  EVIDENCE_TYPES,
  captureEvidence,
  captureReadEvidence,
  captureSearchEvidence,
  captureArtifactEvidence,
  captureCommandEvidence,
  captureSkillEvidence,
  captureDecisionEvidence,
  hasRequiredEvidence
};
