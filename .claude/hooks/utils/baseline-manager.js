/**
 * Baseline Manager - ベースラインファイル管理とRead/スキル/逸脱追跡
 *
 * ベースラインファイルの登録・整合性確認、
 * Read履歴の追跡、スキル使用記録、逸脱承認の管理を提供する。
 */

const path = require('path');

const { calculateFileHash } = require('./state-core');

/**
 * ベースラインファイルを登録
 */
function registerBaseline(state, filePath) {
  const basename = path.basename(filePath);
  const hash = calculateFileHash(filePath);

  if (!hash) return false;

  // 既に登録済みの場合はスキップ
  if (state.baseline.files[basename]) {
    return true;
  }

  state.baseline.files[basename] = {
    path: filePath,
    sha256: hash,
    registeredAt: new Date().toISOString()
  };

  return true;
}

/**
 * ベースラインの整合性を確認
 */
function checkBaselineIntegrity(state, filePath) {
  const basename = path.basename(filePath);
  const baseline = state.baseline.files[basename];

  if (!baseline) {
    return { valid: true, reason: 'not_registered' };
  }

  const currentHash = calculateFileHash(filePath);

  if (!currentHash) {
    return { valid: true, reason: 'file_not_found' };
  }

  if (currentHash !== baseline.sha256) {
    return {
      valid: false,
      reason: 'hash_mismatch',
      expected: baseline.sha256,
      actual: currentHash
    };
  }

  return { valid: true, reason: 'match' };
}

/**
 * Read履歴を追加
 */
function addReadLog(state, filePath, sessionId) {
  const entry = {
    path: filePath,
    basename: path.basename(filePath),
    readAt: new Date().toISOString(),
    sessionId: sessionId || 'unknown'
  };

  state.evidence.read_log.push(entry);

  // 最大1000件まで保持
  if (state.evidence.read_log.length > 1000) {
    state.evidence.read_log = state.evidence.read_log.slice(-1000);
  }

  return true;
}

/**
 * ファイルが読み込み済みか確認
 */
function hasBeenRead(state, filePath) {
  const basename = path.basename(filePath);

  return state.evidence.read_log.some(entry =>
    entry.path === filePath || entry.basename === basename
  );
}

/**
 * スキル使用を記録
 */
function recordSkillUsage(state, skillId, details) {
  state.evidence.skills_used[skillId] = {
    usedAt: new Date().toISOString(),
    details: details || {}
  };
  return true;
}

/**
 * スキルが使用されたか確認
 */
function hasSkillBeenUsed(state, skillId) {
  return !!state.evidence.skills_used[skillId];
}

/**
 * 逸脱の承認を記録
 */
function recordDeviationApproval(state, deviation, approvedBy) {
  state.evidence.approved_deviations.push({
    deviation: deviation,
    approvedAt: new Date().toISOString(),
    approvedBy: approvedBy || 'user'
  });
  return true;
}

/**
 * 逸脱が承認済みか確認
 */
function isDeviationApproved(state, deviation) {
  return state.evidence.approved_deviations.some(d =>
    d.deviation === deviation
  );
}

module.exports = {
  registerBaseline,
  checkBaselineIntegrity,
  addReadLog,
  hasBeenRead,
  recordSkillUsage,
  hasSkillBeenUsed,
  recordDeviationApproval,
  isDeviationApproved
};
