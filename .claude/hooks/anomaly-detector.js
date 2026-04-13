#!/usr/bin/env node

/**
 * Anomaly Detector
 * メトリクス異常検知・アラートシステム
 *
 * Usage:
 *   node anomaly-detector.js scan   - 全メトリクスをスキャン
 *   node anomaly-detector.js check  - 最新エントリのみチェック
 *   node anomaly-detector.js config - 設定表示
 */

const fs = require('fs');
const path = require('path');

// ========================================
// 設定読み込み
// ========================================

const CONFIG_PATH = path.join(__dirname, 'config', 'alert-config.json');
const DEFAULT_THRESHOLDS = {
  metricsFileSize: { warn: 30000, critical: 50000 },
  metricsEntryCount: { warn: 80, critical: 100 },
  sessionCompletionRate: { warn: 0.85, critical: 0.80 },
  hookProcessingTime: { warn: 1000, critical: 2000 },
  autoLoadTokens: { warn: 3000, critical: 5000 },
  blockRate: { warn: 0.10, critical: 0.20 }
};

const DEFAULT_NOTIFICATIONS = {
  console: true,
  file: true,
  slack: false,
  discord: false
};

/**
 * 設定ファイルを読み込む
 * @returns {Object} { thresholds, notifications }
 */
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return {
        thresholds: DEFAULT_THRESHOLDS,
        notifications: DEFAULT_NOTIFICATIONS
      };
    }

    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);

    return {
      thresholds: config.thresholds || DEFAULT_THRESHOLDS,
      notifications: config.notifications || DEFAULT_NOTIFICATIONS
    };
  } catch (error) {
    console.error(`[ERROR] Config load failed: ${error.message}`);
    return {
      thresholds: DEFAULT_THRESHOLDS,
      notifications: DEFAULT_NOTIFICATIONS
    };
  }
}

// ========================================
// メトリクス読み込み
// ========================================

const DATA_DIR = path.join(__dirname, 'data');
const ALERTS_LOG = path.join(DATA_DIR, 'alerts.jsonl');
const METRICS_FILE = path.join(DATA_DIR, 'unified-metrics.jsonl');

/**
 * メトリクスファイルを読み込む
 * @param {string} filePath - メトリクスファイルパス
 * @returns {Array<Object>} メトリクスエントリ配列
 */
function loadMetrics(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
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
    console.error(`[ERROR] Failed to load metrics from ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * 最新のメトリクスエントリを取得
 * @param {string} filePath - メトリクスファイルパス
 * @returns {Object|null} 最新エントリ
 */
function getLatestMetric(filePath) {
  const metrics = loadMetrics(filePath);
  return metrics.length > 0 ? metrics[metrics.length - 1] : null;
}

// ========================================
// アラート記録
// ========================================

/**
 * アラートをログに記録
 * @param {Object} alert - アラートオブジェクト
 */
function logAlert(alert) {
  try {
    const alertLine = JSON.stringify(alert) + '\n';
    fs.appendFileSync(ALERTS_LOG, alertLine, 'utf8');
  } catch (error) {
    console.error(`[ERROR] Failed to write alert log: ${error.message}`);
  }
}

/**
 * アラートを作成
 * @param {string} level - warn|critical
 * @param {string} category - カテゴリ名
 * @param {string} message - メッセージ
 * @param {number} value - 実測値
 * @param {number} threshold - 閾値
 * @returns {Object} アラートオブジェクト
 */
function createAlert(level, category, message, value, threshold) {
  return {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    value,
    threshold
  };
}

// ========================================
// 異常検知ロジック
// ========================================

/**
 * ファイルサイズをチェック
 * @param {string} filePath - ファイルパス
 * @param {Object} thresholds - 閾値設定
 * @returns {Array<Object>} アラート配列
 */
function checkFileSize(filePath, thresholds) {
  const alerts = [];

  try {
    if (!fs.existsSync(filePath)) {
      return alerts;
    }

    const stats = fs.statSync(filePath);
    const size = stats.size;
    const fileName = path.basename(filePath);

    if (size >= thresholds.metricsFileSize.critical) {
      alerts.push(createAlert(
        'critical',
        'metrics_size',
        `${fileName} exceeds critical threshold (${size} bytes)`,
        size,
        thresholds.metricsFileSize.critical
      ));
    } else if (size >= thresholds.metricsFileSize.warn) {
      alerts.push(createAlert(
        'warn',
        'metrics_size',
        `${fileName} exceeds warning threshold (${size} bytes)`,
        size,
        thresholds.metricsFileSize.warn
      ));
    }
  } catch (error) {
    console.error(`[ERROR] Failed to check file size for ${filePath}: ${error.message}`);
  }

  return alerts;
}

/**
 * エントリ数をチェック
 * @param {Array<Object>} metrics - メトリクス配列
 * @param {Object} thresholds - 閾値設定
 * @returns {Array<Object>} アラート配列
 */
function checkEntryCount(metrics, thresholds) {
  const alerts = [];
  const count = metrics.length;

  if (count >= thresholds.metricsEntryCount.critical) {
    alerts.push(createAlert(
      'critical',
      'entry_count',
      `Metrics entry count exceeds critical threshold (${count} entries)`,
      count,
      thresholds.metricsEntryCount.critical
    ));
  } else if (count >= thresholds.metricsEntryCount.warn) {
    alerts.push(createAlert(
      'warn',
      'entry_count',
      `Metrics entry count exceeds warning threshold (${count} entries)`,
      count,
      thresholds.metricsEntryCount.warn
    ));
  }

  return alerts;
}

/**
 * セッション完了率をチェック
 * @param {Array<Object>} metrics - メトリクス配列
 * @param {Object} thresholds - 閾値設定
 * @returns {Array<Object>} アラート配列
 */
function checkCompletionRate(metrics, thresholds) {
  const alerts = [];

  if (metrics.length === 0) {
    return alerts;
  }

  const recentMetrics = metrics.slice(-10); // 直近10セッション
  const completedCount = recentMetrics.filter(m => m.session?.status === 'completed').length;
  const completionRate = completedCount / recentMetrics.length;

  if (completionRate <= thresholds.sessionCompletionRate.critical) {
    alerts.push(createAlert(
      'critical',
      'completion_rate',
      `Session completion rate is critically low (${(completionRate * 100).toFixed(1)}%)`,
      completionRate,
      thresholds.sessionCompletionRate.critical
    ));
  } else if (completionRate <= thresholds.sessionCompletionRate.warn) {
    alerts.push(createAlert(
      'warn',
      'completion_rate',
      `Session completion rate is below warning threshold (${(completionRate * 100).toFixed(1)}%)`,
      completionRate,
      thresholds.sessionCompletionRate.warn
    ));
  }

  return alerts;
}

/**
 * hook処理時間をチェック
 * @param {Object} metric - メトリクスエントリ
 * @param {Object} thresholds - 閾値設定
 * @returns {Array<Object>} アラート配列
 */
function checkHookProcessingTime(metric, thresholds) {
  const alerts = [];

  if (!metric.hooks || !Array.isArray(metric.hooks)) {
    return alerts;
  }

  metric.hooks.forEach(hook => {
    const duration = hook.duration || 0;

    if (duration >= thresholds.hookProcessingTime.critical) {
      alerts.push(createAlert(
        'critical',
        'hook_processing_time',
        `Hook ${hook.name} took ${duration}ms (critical)`,
        duration,
        thresholds.hookProcessingTime.critical
      ));
    } else if (duration >= thresholds.hookProcessingTime.warn) {
      alerts.push(createAlert(
        'warn',
        'hook_processing_time',
        `Hook ${hook.name} took ${duration}ms (warning)`,
        duration,
        thresholds.hookProcessingTime.warn
      ));
    }
  });

  return alerts;
}

/**
 * トークン消費をチェック
 * @param {Object} metric - メトリクスエントリ
 * @param {Object} thresholds - 閾値設定
 * @returns {Array<Object>} アラート配列
 */
function checkAutoLoadTokens(metric, thresholds) {
  const alerts = [];

  if (!metric.context || typeof metric.context.autoLoadedTokens !== 'number') {
    return alerts;
  }

  const tokens = metric.context.autoLoadedTokens;

  if (tokens >= thresholds.autoLoadTokens.critical) {
    alerts.push(createAlert(
      'critical',
      'auto_load_tokens',
      `Auto-loaded tokens exceeded critical threshold (${tokens} tokens)`,
      tokens,
      thresholds.autoLoadTokens.critical
    ));
  } else if (tokens >= thresholds.autoLoadTokens.warn) {
    alerts.push(createAlert(
      'warn',
      'auto_load_tokens',
      `Auto-loaded tokens exceeded warning threshold (${tokens} tokens)`,
      tokens,
      thresholds.autoLoadTokens.warn
    ));
  }

  return alerts;
}

/**
 * ブロック率をチェック
 * @param {Array<Object>} metrics - メトリクス配列
 * @param {Object} thresholds - 閾値設定
 * @returns {Array<Object>} アラート配列
 */
function checkBlockRate(metrics, thresholds) {
  const alerts = [];

  if (metrics.length === 0) {
    return alerts;
  }

  const recentMetrics = metrics.slice(-20); // 直近20セッション
  let totalCalls = 0;
  let blockedCalls = 0;

  recentMetrics.forEach(metric => {
    if (metric.hooks && Array.isArray(metric.hooks)) {
      metric.hooks.forEach(hook => {
        if (hook.type === 'PreToolUse') {
          totalCalls++;
          if (hook.exitCode === 2) {
            blockedCalls++;
          }
        }
      });
    }
  });

  if (totalCalls === 0) {
    return alerts;
  }

  const blockRate = blockedCalls / totalCalls;

  if (blockRate >= thresholds.blockRate.critical) {
    alerts.push(createAlert(
      'critical',
      'block_rate',
      `Hook block rate is critically high (${(blockRate * 100).toFixed(1)}%, ${blockedCalls}/${totalCalls})`,
      blockRate,
      thresholds.blockRate.critical
    ));
  } else if (blockRate >= thresholds.blockRate.warn) {
    alerts.push(createAlert(
      'warn',
      'block_rate',
      `Hook block rate is above warning threshold (${(blockRate * 100).toFixed(1)}%, ${blockedCalls}/${totalCalls})`,
      blockRate,
      thresholds.blockRate.warn
    ));
  }

  return alerts;
}

// ========================================
// スキャン・チェック機能
// ========================================

/**
 * 全メトリクスをスキャン
 * @returns {Object} { alerts, summary }
 */
function scanAll() {
  const config = loadConfig();
  const thresholds = config.thresholds;
  const notifications = config.notifications;

  const allAlerts = [];

  // ファイルサイズチェック
  const fileSizeAlerts = checkFileSize(METRICS_FILE, thresholds);
  allAlerts.push(...fileSizeAlerts);

  // メトリクス読み込み
  const metrics = loadMetrics(METRICS_FILE);

  // エントリ数チェック
  const entryCountAlerts = checkEntryCount(metrics, thresholds);
  allAlerts.push(...entryCountAlerts);

  // 完了率チェック
  const completionRateAlerts = checkCompletionRate(metrics, thresholds);
  allAlerts.push(...completionRateAlerts);

  // ブロック率チェック
  const blockRateAlerts = checkBlockRate(metrics, thresholds);
  allAlerts.push(...blockRateAlerts);

  // 各エントリのhook処理時間とトークンをチェック
  metrics.forEach(metric => {
    const hookTimeAlerts = checkHookProcessingTime(metric, thresholds);
    const tokenAlerts = checkAutoLoadTokens(metric, thresholds);
    allAlerts.push(...hookTimeAlerts);
    allAlerts.push(...tokenAlerts);
  });

  // アラート出力
  if (notifications.console) {
    console.log(`[SCAN] Total alerts: ${allAlerts.length}`);
    allAlerts.forEach(alert => {
      const icon = alert.level === 'critical' ? '🔴' : '⚠️';
      console.log(`${icon} [${alert.level.toUpperCase()}] ${alert.message}`);
    });
  }

  // ファイルログ
  if (notifications.file) {
    allAlerts.forEach(alert => logAlert(alert));
  }

  return {
    alerts: allAlerts,
    summary: {
      total: allAlerts.length,
      critical: allAlerts.filter(a => a.level === 'critical').length,
      warn: allAlerts.filter(a => a.level === 'warn').length,
      metricsCount: metrics.length
    }
  };
}

/**
 * 最新エントリのみチェック
 * @returns {Object} { alerts, summary }
 */
function checkLatest() {
  const config = loadConfig();
  const thresholds = config.thresholds;
  const notifications = config.notifications;

  const allAlerts = [];

  // ファイルサイズチェック
  const fileSizeAlerts = checkFileSize(METRICS_FILE, thresholds);
  allAlerts.push(...fileSizeAlerts);

  // 最新エントリ取得
  const latestMetric = getLatestMetric(METRICS_FILE);

  if (!latestMetric) {
    console.log('[INFO] No metrics found');
    return { alerts: [], summary: { total: 0, critical: 0, warn: 0 } };
  }

  // hook処理時間チェック
  const hookTimeAlerts = checkHookProcessingTime(latestMetric, thresholds);
  allAlerts.push(...hookTimeAlerts);

  // トークンチェック
  const tokenAlerts = checkAutoLoadTokens(latestMetric, thresholds);
  allAlerts.push(...tokenAlerts);

  // アラート出力
  if (notifications.console) {
    console.log(`[CHECK] Latest metric alerts: ${allAlerts.length}`);
    allAlerts.forEach(alert => {
      const icon = alert.level === 'critical' ? '🔴' : '⚠️';
      console.log(`${icon} [${alert.level.toUpperCase()}] ${alert.message}`);
    });
  }

  // ファイルログ
  if (notifications.file) {
    allAlerts.forEach(alert => logAlert(alert));
  }

  return {
    alerts: allAlerts,
    summary: {
      total: allAlerts.length,
      critical: allAlerts.filter(a => a.level === 'critical').length,
      warn: allAlerts.filter(a => a.level === 'warn').length
    }
  };
}

/**
 * 現在の設定を取得
 * @returns {Object} { thresholds, notifications }
 */
function getConfig() {
  return loadConfig();
}

// ========================================
// CLI
// ========================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'scan';

  switch (command) {
    case 'scan':
      const scanResult = scanAll();
      console.log('\n[SUMMARY]');
      console.log(`Total: ${scanResult.summary.total}`);
      console.log(`Critical: ${scanResult.summary.critical}`);
      console.log(`Warn: ${scanResult.summary.warn}`);
      console.log(`Metrics: ${scanResult.summary.metricsCount}`);
      break;

    case 'check':
      const checkResult = checkLatest();
      console.log('\n[SUMMARY]');
      console.log(`Total: ${checkResult.summary.total}`);
      console.log(`Critical: ${checkResult.summary.critical}`);
      console.log(`Warn: ${checkResult.summary.warn}`);
      break;

    case 'config':
      const config = getConfig();
      console.log('[CONFIG]');
      console.log(JSON.stringify(config, null, 2));
      break;

    default:
      console.error(`[ERROR] Unknown command: ${command}`);
      console.error('Usage: node anomaly-detector.js [scan|check|config]');
      process.exit(1);
  }
}

// ========================================
// Exports
// ========================================

module.exports = {
  scanAll,
  checkLatest,
  getConfig
};

// CLI実行
if (require.main === module) {
  main();
}
