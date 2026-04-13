#!/usr/bin/env node

/**
 * Generate Metrics Report
 *
 * Generates markdown report from daily metrics
 * - Reads metrics-daily/*.json files
 * - Aggregates over N days
 * - Generates metrics-dashboard.md
 * - Includes trends and recommendations
 */

const fs = require('fs');
const path = require('path');

const HOOKS_DATA_DIR = path.join(__dirname, 'data');
const METRICS_DAILY_DIR = path.join(HOOKS_DATA_DIR, 'metrics-daily');
const REPORT_PATH = path.join(HOOKS_DATA_DIR, 'metrics-dashboard.md');

function getRecentMetricsFiles(days = 7) {
  if (!fs.existsSync(METRICS_DAILY_DIR)) {
    return [];
  }

  const files = fs.readdirSync(METRICS_DAILY_DIR)
    .filter(f => f.startsWith('metrics-') && f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, days);

  return files;
}

function loadMetrics(filename) {
  const filepath = path.join(METRICS_DAILY_DIR, filename);
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.debug(`[WARN] Failed to load ${filename}: ${error.message}`);
    return null;
  }
}

async function generateReport(days = 7) {
  try {
    const files = getRecentMetricsFiles(days);

    if (files.length === 0) {
      console.log('[INFO] No metrics files found');
      return null;
    }

    const allMetrics = files
      .map(f => loadMetrics(f))
      .filter(m => m !== null)
      .reverse();

    if (allMetrics.length === 0) {
      console.log('[INFO] No valid metrics to report');
      return null;
    }

    const startDate = allMetrics[0].date;
    const endDate = allMetrics[allMetrics.length - 1].date;

    let totalEvents = 0;
    let totalBlocks = 0;
    let allProcessingTimes = [];
    const hookStats = {};

    allMetrics.forEach(metrics => {
      totalEvents += metrics.summary.totalHookEvents;
      totalBlocks += metrics.summary.blockCount;

      Object.entries(metrics.byHook || {}).forEach(([hookName, stats]) => {
        if (!hookStats[hookName]) {
          hookStats[hookName] = {
            events: 0,
            blocks: 0,
            times: []
          };
        }
        hookStats[hookName].events += stats.eventCount;
        hookStats[hookName].blocks += stats.blockCount;
      });
    });

    const overallBlockRate = totalEvents > 0 ? (totalBlocks / totalEvents * 100).toFixed(1) : '0.0';
    const avgTime = allMetrics.length > 0
      ? Math.round(allMetrics.reduce((sum, m) => sum + parseInt(m.summary.averageHookTimeMs), 0) / allMetrics.length)
      : 0;

    let report = `# メトリクスダッシュボード\n\n`;
    report += `**レポート期間**: ${startDate} - ${endDate} (${allMetrics.length}日間)\n\n`;
    report += `## 概要\n\n`;
    report += `| メトリクス | 値 |\n`;
    report += `|-----------|----|\n`;
    report += `| 総Hook実行数 | ${totalEvents} |\n`;
    report += `| ブロック数 | ${totalBlocks} |\n`;
    report += `| ブロック率 | ${overallBlockRate}% |\n`;
    report += `| 平均処理時間 | ${avgTime}ms |\n\n`;

    report += `## Hook別詳細\n\n`;
    report += `| Hook | イベント数 | ブロック数 | ブロック率 |\n`;
    report += `|------|-----------|----------|----------|\n`;

    Object.entries(hookStats).forEach(([hookName, stats]) => {
      const blockRate = stats.events > 0 ? (stats.blocks / stats.events * 100).toFixed(1) : '0.0';
      report += `| ${hookName} | ${stats.events} | ${stats.blocks} | ${blockRate}% |\n`;
    });

    report += `\n## アラート\n\n`;
    const allAlerts = allMetrics.flatMap(m => m.alerts || []);
    if (allAlerts.length === 0) {
      report += `✅ アラートなし\n\n`;
    } else {
      allAlerts.forEach(alert => {
        report += `- **[${alert.level.toUpperCase()}]** ${alert.message}\n`;
      });
      report += `\n`;
    }

    report += `## 改善提案\n\n`;
    if (overallBlockRate > 10) {
      report += `1. ブロック率が 10% を超えています。False Positive の削減を検討してください\n`;
    }
    if (avgTime > 1000) {
      report += `2. 平均処理時間が 1秒を超えています。Hook の最適化を検討してください\n`;
    }
    if (allAlerts.length > 0) {
      report += `3. アラートが検出されています。詳細を確認してください\n`;
    }
    report += `\n`;

    report += `**生成日時**: ${new Date().toISOString()}\n`;

    fs.writeFileSync(REPORT_PATH, report, 'utf8');
    console.log(`[INFO] Report generated: ${path.basename(REPORT_PATH)}`);

    return {
      reportPath: REPORT_PATH,
      metricsCount: allMetrics.length,
      overallBlockRate,
      totalEvents,
      totalBlocks
    };
  } catch (error) {
    console.error(`[ERROR] Report generation failed: ${error.message}`);
    throw error;
  }
}

module.exports = { generateReport, getRecentMetricsFiles };

if (require.main === module) {
  const days = parseInt(process.argv[2] || '7');
  generateReport(days).then(result => {
    if (result) {
      console.log(JSON.stringify(result, null, 2));
    }
    process.exit(result ? 0 : 1);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
