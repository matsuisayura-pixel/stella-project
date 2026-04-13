#!/usr/bin/env node

/**
 * Canary Release Controller
 * コンテキスト最適化の段階的リリース制御
 *
 * Usage:
 *   node canary-controller.js status   - 現在のステータス表示
 *   node canary-controller.js promote  - 次のステージへ昇格
 *   node canary-controller.js halt     - リリースを停止
 *   node canary-controller.js check    - 品質チェック実行
 *   node canary-controller.js reset    - リリース状態を初期化
 */

const fs = require('fs');
const path = require('path');
const { checkLatest, scanAll } = require('./anomaly-detector');

// ========================================
// パス定義
// ========================================

const CONFIG_DIR = path.join(__dirname, 'config');
const DATA_DIR = path.join(__dirname, 'data');
const RELEASE_CONFIG_PATH = path.join(CONFIG_DIR, 'release-config.json');
const STATE_PATH = path.join(DATA_DIR, 'canary-state.json');
const METRICS_FILE = path.join(DATA_DIR, 'unified-metrics.jsonl');

// ========================================
// 設定読み込み
// ========================================

/**
 * リリース設定を読み込む
 * @returns {Object} リリース設定
 */
function loadReleaseConfig() {
  try {
    if (!fs.existsSync(RELEASE_CONFIG_PATH)) {
      const defaultConfig = {
        version: "2.19.0",
        stages: {
          canary: { percentage: 10, minSessions: 3 },
          partial: { percentage: 50, minSessions: 5 },
          full: { percentage: 100, minSessions: 10 }
        },
        qualityGates: {
          minCompletionRate: 0.90,
          maxCriticalAlerts: 0,
          maxTokenIncrease: 0.20
        },
        currentStage: "canary",
        stageHistory: []
      };

      // 設定ディレクトリを作成
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      fs.writeFileSync(RELEASE_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf8');
      return defaultConfig;
    }

    const configData = fs.readFileSync(RELEASE_CONFIG_PATH, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(`[ERROR] Failed to load release config: ${error.message}`);
    throw error;
  }
}

/**
 * リリース設定を保存（immutable）
 * @param {Object} config - 新しい設定
 */
function saveReleaseConfig(config) {
  try {
    const newConfig = { ...config }; // immutable copy
    fs.writeFileSync(RELEASE_CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
  } catch (error) {
    console.error(`[ERROR] Failed to save release config: ${error.message}`);
    throw error;
  }
}

/**
 * Canary状態を読み込む
 * @returns {Object} Canary状態
 */
function loadState() {
  try {
    if (!fs.existsSync(STATE_PATH)) {
      const defaultState = {
        currentStage: "canary",
        stageHistory: [],
        haltedAt: null,
        isHalted: false
      };

      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      fs.writeFileSync(STATE_PATH, JSON.stringify(defaultState, null, 2), 'utf8');
      return defaultState;
    }

    const stateData = fs.readFileSync(STATE_PATH, 'utf8');
    return JSON.parse(stateData);
  } catch (error) {
    console.error(`[ERROR] Failed to load canary state: ${error.message}`);
    throw error;
  }
}

/**
 * Canary状態を保存（immutable）
 * @param {Object} state - 新しい状態
 */
function saveState(state) {
  try {
    const newState = { ...state }; // immutable copy
    fs.writeFileSync(STATE_PATH, JSON.stringify(newState, null, 2), 'utf8');
  } catch (error) {
    console.error(`[ERROR] Failed to save canary state: ${error.message}`);
    throw error;
  }
}

// ========================================
// メトリクス計算
// ========================================

/**
 * メトリクスファイルからエントリを読み込む
 * @returns {Array<Object>} メトリクス配列
 */
function loadMetrics() {
  try {
    if (!fs.existsSync(METRICS_FILE)) {
      return [];
    }

    const content = fs.readFileSync(METRICS_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);

    return lines.map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (parseError) {
        console.error(`[WARN] Failed to parse line ${index + 1}: ${parseError.message}`);
        return null;
      }
    }).filter(entry => entry !== null);
  } catch (error) {
    console.error(`[ERROR] Failed to load metrics: ${error.message}`);
    return [];
  }
}

/**
 * セッション完了率を計算
 * @param {Array<Object>} metrics - メトリクス配列
 * @param {number} count - 対象セッション数
 * @returns {number} 完了率（0.0-1.0）
 */
function calculateCompletionRate(metrics, count = 10) {
  if (metrics.length === 0) {
    return 0;
  }

  const recentMetrics = metrics.slice(-count);
  const completedCount = recentMetrics.filter(m => m.session?.status === 'completed').length;
  return completedCount / recentMetrics.length;
}

/**
 * トークン消費の増加率を計算
 * @param {Array<Object>} metrics - メトリクス配列
 * @param {number} baselineCount - ベースライン期間
 * @param {number} currentCount - 現在期間
 * @returns {number} 増加率（0.0-1.0）
 */
function calculateTokenIncrease(metrics, baselineCount = 10, currentCount = 5) {
  if (metrics.length < baselineCount + currentCount) {
    return 0;
  }

  const baselineMetrics = metrics.slice(-baselineCount - currentCount, -currentCount);
  const currentMetrics = metrics.slice(-currentCount);

  const baselineAvg = baselineMetrics.reduce((sum, m) => {
    return sum + (m.context?.autoLoadedTokens || 0);
  }, 0) / baselineMetrics.length;

  const currentAvg = currentMetrics.reduce((sum, m) => {
    return sum + (m.context?.autoLoadedTokens || 0);
  }, 0) / currentMetrics.length;

  if (baselineAvg === 0) {
    return 0;
  }

  return (currentAvg - baselineAvg) / baselineAvg;
}

// ========================================
// 品質チェック
// ========================================

/**
 * 品質チェックを実行
 * @returns {Object} { passed, details }
 */
function checkQuality() {
  const config = loadReleaseConfig();
  const gates = config.qualityGates;
  const metrics = loadMetrics();

  const result = {
    passed: true,
    details: {
      completionRate: { value: 0, threshold: gates.minCompletionRate, passed: false },
      criticalAlerts: { value: 0, threshold: gates.maxCriticalAlerts, passed: false },
      tokenIncrease: { value: 0, threshold: gates.maxTokenIncrease, passed: false }
    }
  };

  // 1. セッション完了率チェック
  const completionRate = calculateCompletionRate(metrics, 10);
  result.details.completionRate.value = completionRate;
  result.details.completionRate.passed = completionRate >= gates.minCompletionRate;

  // 2. CRITICALアラートチェック
  const scanResult = scanAll();
  const criticalCount = scanResult.summary.critical;
  result.details.criticalAlerts.value = criticalCount;
  result.details.criticalAlerts.passed = criticalCount <= gates.maxCriticalAlerts;

  // 3. トークン増加率チェック
  const tokenIncrease = calculateTokenIncrease(metrics, 10, 5);
  result.details.tokenIncrease.value = tokenIncrease;
  result.details.tokenIncrease.passed = tokenIncrease <= gates.maxTokenIncrease;

  // 全てのチェックが通った場合のみpassed=true
  result.passed = result.details.completionRate.passed &&
                  result.details.criticalAlerts.passed &&
                  result.details.tokenIncrease.passed;

  return result;
}

// ========================================
// コマンド実装
// ========================================

/**
 * 現在のステータスを取得
 * @returns {Object} ステータス情報
 */
function getStatus() {
  const config = loadReleaseConfig();
  const state = loadState();
  const qualityCheck = checkQuality();

  return {
    version: config.version,
    currentStage: state.currentStage,
    stageConfig: config.stages[state.currentStage],
    isHalted: state.isHalted,
    haltedAt: state.haltedAt,
    qualityMetrics: qualityCheck.details,
    qualityPassed: qualityCheck.passed,
    history: state.stageHistory.slice(-3) // 直近3件
  };
}

/**
 * 次のステージへ昇格
 * @returns {Object} { success, message, newStage }
 */
function promote() {
  const config = loadReleaseConfig();
  const state = loadState();

  // 停止中は昇格不可
  if (state.isHalted) {
    return {
      success: false,
      message: 'Release is halted. Run `reset` to resume.',
      newStage: null
    };
  }

  // 品質チェック
  const qualityCheck = checkQuality();
  if (!qualityCheck.passed) {
    const failures = [];
    if (!qualityCheck.details.completionRate.passed) {
      failures.push(`Completion rate too low: ${(qualityCheck.details.completionRate.value * 100).toFixed(1)}% (need ${(qualityCheck.details.completionRate.threshold * 100).toFixed(1)}%)`);
    }
    if (!qualityCheck.details.criticalAlerts.passed) {
      failures.push(`Critical alerts detected: ${qualityCheck.details.criticalAlerts.value} (max ${qualityCheck.details.criticalAlerts.threshold})`);
    }
    if (!qualityCheck.details.tokenIncrease.passed) {
      failures.push(`Token increase too high: ${(qualityCheck.details.tokenIncrease.value * 100).toFixed(1)}% (max ${(qualityCheck.details.tokenIncrease.threshold * 100).toFixed(1)}%)`);
    }

    return {
      success: false,
      message: 'Quality gates not met:\n  - ' + failures.join('\n  - '),
      newStage: null
    };
  }

  // 次のステージを決定
  const stageOrder = ['canary', 'partial', 'full'];
  const currentIndex = stageOrder.indexOf(state.currentStage);

  if (currentIndex === -1) {
    return {
      success: false,
      message: `Unknown stage: ${state.currentStage}`,
      newStage: null
    };
  }

  if (currentIndex === stageOrder.length - 1) {
    return {
      success: false,
      message: 'Already at full release stage',
      newStage: null
    };
  }

  const newStage = stageOrder[currentIndex + 1];

  // 履歴を追加（immutable）
  const newHistory = [
    ...state.stageHistory,
    {
      from: state.currentStage,
      to: newStage,
      timestamp: new Date().toISOString(),
      qualityMetrics: qualityCheck.details
    }
  ];

  // 状態を更新（immutable）
  const newState = {
    ...state,
    currentStage: newStage,
    stageHistory: newHistory
  };

  saveState(newState);

  // 設定も更新（immutable）
  const newConfig = {
    ...config,
    currentStage: newStage
  };

  saveReleaseConfig(newConfig);

  return {
    success: true,
    message: `Promoted from ${state.currentStage} to ${newStage}`,
    newStage
  };
}

/**
 * リリースを停止
 * @returns {Object} { success, message }
 */
function halt() {
  const state = loadState();

  if (state.isHalted) {
    return {
      success: false,
      message: 'Release is already halted'
    };
  }

  // 状態を更新（immutable）
  const newState = {
    ...state,
    isHalted: true,
    haltedAt: new Date().toISOString()
  };

  saveState(newState);

  return {
    success: true,
    message: `Release halted at stage: ${state.currentStage}`
  };
}

/**
 * リリース状態をリセット
 * @returns {Object} { success, message }
 */
function reset() {
  const config = loadReleaseConfig();

  // 状態をリセット（immutable）
  const newState = {
    currentStage: "canary",
    stageHistory: [],
    haltedAt: null,
    isHalted: false
  };

  saveState(newState);

  // 設定もリセット（immutable）
  const newConfig = {
    ...config,
    currentStage: "canary"
  };

  saveReleaseConfig(newConfig);

  return {
    success: true,
    message: 'Release state reset to canary'
  };
}

// ========================================
// CLI
// ========================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  switch (command) {
    case 'status':
      const status = getStatus();
      console.log('\n[CANARY STATUS]');
      console.log(`Version: ${status.version}`);
      console.log(`Stage: ${status.currentStage} (${status.stageConfig.percentage}%)`);
      console.log(`Halted: ${status.isHalted ? 'YES' : 'NO'}`);
      if (status.haltedAt) {
        console.log(`Halted at: ${status.haltedAt}`);
      }
      console.log('\n[QUALITY METRICS]');
      console.log(`Completion Rate: ${(status.qualityMetrics.completionRate.value * 100).toFixed(1)}% (need ${(status.qualityMetrics.completionRate.threshold * 100).toFixed(1)}%) ${status.qualityMetrics.completionRate.passed ? '✅' : '❌'}`);
      console.log(`Critical Alerts: ${status.qualityMetrics.criticalAlerts.value} (max ${status.qualityMetrics.criticalAlerts.threshold}) ${status.qualityMetrics.criticalAlerts.passed ? '✅' : '❌'}`);
      console.log(`Token Increase: ${(status.qualityMetrics.tokenIncrease.value * 100).toFixed(1)}% (max ${(status.qualityMetrics.tokenIncrease.threshold * 100).toFixed(1)}%) ${status.qualityMetrics.tokenIncrease.passed ? '✅' : '❌'}`);
      console.log(`\nOverall: ${status.qualityPassed ? '✅ PASSED' : '❌ FAILED'}`);

      if (status.history.length > 0) {
        console.log('\n[RECENT HISTORY]');
        status.history.forEach(h => {
          console.log(`${h.timestamp}: ${h.from} → ${h.to}`);
        });
      }
      break;

    case 'promote':
      const promoteResult = promote();
      if (promoteResult.success) {
        console.log(`✅ ${promoteResult.message}`);
      } else {
        console.error(`❌ ${promoteResult.message}`);
        process.exit(1);
      }
      break;

    case 'halt':
      const haltResult = halt();
      if (haltResult.success) {
        console.log(`✅ ${haltResult.message}`);
      } else {
        console.error(`❌ ${haltResult.message}`);
        process.exit(1);
      }
      break;

    case 'check':
      const qualityCheck = checkQuality();
      console.log('\n[QUALITY CHECK]');
      console.log(`Completion Rate: ${(qualityCheck.details.completionRate.value * 100).toFixed(1)}% ${qualityCheck.details.completionRate.passed ? '✅' : '❌'}`);
      console.log(`Critical Alerts: ${qualityCheck.details.criticalAlerts.value} ${qualityCheck.details.criticalAlerts.passed ? '✅' : '❌'}`);
      console.log(`Token Increase: ${(qualityCheck.details.tokenIncrease.value * 100).toFixed(1)}% ${qualityCheck.details.tokenIncrease.passed ? '✅' : '❌'}`);
      console.log(`\nOverall: ${qualityCheck.passed ? '✅ PASSED' : '❌ FAILED'}`);

      if (!qualityCheck.passed) {
        process.exit(1);
      }
      break;

    case 'reset':
      const resetResult = reset();
      console.log(`✅ ${resetResult.message}`);
      break;

    default:
      console.error(`[ERROR] Unknown command: ${command}`);
      console.error('Usage: node canary-controller.js [status|promote|halt|check|reset]');
      process.exit(1);
  }
}

// ========================================
// Exports
// ========================================

module.exports = {
  getStatus,
  promote,
  halt,
  checkQuality,
  reset
};

// CLI実行
if (require.main === module) {
  main();
}
