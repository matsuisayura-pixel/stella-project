#!/usr/bin/env node

/**
 * Hook Metrics Aggregator
 *
 * Aggregates daily metrics from hook-event.log
 * - Reads hook-event.log for a specific date
 * - Calculates statistics (mean, p50, p95, p99)
 * - Generates alerts for anomalies
 * - Outputs to metrics-daily/metrics-YYYY-MM-DD.json
 */

const fs = require('fs');
const path = require('path');

const HOOKS_DATA_DIR = path.join(__dirname, 'data');
const EVENT_LOG_PATH = path.join(HOOKS_DATA_DIR, 'hook-event.log');
const METRICS_DAILY_DIR = path.join(HOOKS_DATA_DIR, 'metrics-daily');
const ALERTS_DIR = path.join(HOOKS_DATA_DIR);

const BLOCK_RATE_THRESHOLD = 0.10;
const PROCESSING_TIME_THRESHOLD_MS = 2000;

function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function aggregateMetrics(dateStr = getDateString()) {
  try {
    if (!fs.existsSync(EVENT_LOG_PATH)) {
      console.log(`[INFO] No event log found for ${dateStr}`);
      return null;
    }

    const content = fs.readFileSync(EVENT_LOG_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    const events = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.debug(`[WARN] Failed to parse event: ${e.message}`);
        return null;
      }
    }).filter(e => e !== null);

    if (events.length === 0) {
      console.log(`[INFO] No valid events for ${dateStr}`);
      return null;
    }

    const eventsByHook = {};
    const processingTimes = [];
    let blockCount = 0;

    events.forEach(event => {
      if (!eventsByHook[event.hookName]) {
        eventsByHook[event.hookName] = {
          eventCount: 0,
          blockCount: 0,
          processingTimes: [],
          lastEvent: null
        };
      }

      const hookStats = eventsByHook[event.hookName];
      hookStats.eventCount++;
      hookStats.processingTimes.push(event.processingTimeMs);
      processingTimes.push(event.processingTimeMs);
      hookStats.lastEvent = event;

      if (event.eventType === 'block') {
        hookStats.blockCount++;
        blockCount++;
      }
    });

    const blockRate = events.length > 0 ? blockCount / events.length : 0;

    const byHook = {};
    Object.entries(eventsByHook).forEach(([hookName, stats]) => {
      const hookBlockRate = stats.eventCount > 0 ? stats.blockCount / stats.eventCount : 0;
      byHook[hookName] = {
        eventCount: stats.eventCount,
        blockCount: stats.blockCount,
        blockRate: (hookBlockRate * 100).toFixed(1) + '%',
        processingTimeMs: (stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length).toFixed(0)
      };
    });

    const summary = {
      date: dateStr,
      totalHookEvents: events.length,
      blockCount,
      blockRate: (blockRate * 100).toFixed(1) + '%',
      falsePositiveEstimate: Math.max(0, (blockRate * 100 - 5)).toFixed(1) + '% - ' + Math.min(100, (blockRate * 100 + 5)).toFixed(1) + '%',
      averageHookTimeMs: Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length),
      p50TimeMs: Math.round(calculatePercentile(processingTimes, 50)),
      p95TimeMs: Math.round(calculatePercentile(processingTimes, 95)),
      p99TimeMs: Math.round(calculatePercentile(processingTimes, 99))
    };

    const alerts = [];

    if (blockRate > BLOCK_RATE_THRESHOLD) {
      alerts.push({
        level: 'warning',
        message: `Block rate exceeded threshold: ${(blockRate * 100).toFixed(1)}% (threshold: ${BLOCK_RATE_THRESHOLD * 100}%)`,
        threshold: BLOCK_RATE_THRESHOLD * 100,
        actual: (blockRate * 100).toFixed(1)
      });
    }

    if (summary.p95TimeMs > PROCESSING_TIME_THRESHOLD_MS) {
      alerts.push({
        level: 'warning',
        message: `p95 processing time exceeds threshold: ${summary.p95TimeMs}ms (threshold: ${PROCESSING_TIME_THRESHOLD_MS}ms)`,
        threshold: PROCESSING_TIME_THRESHOLD_MS,
        actual: summary.p95TimeMs
      });
    }

    const metrics = {
      date: dateStr,
      summary,
      byHook,
      alerts,
      generatedAt: new Date().toISOString()
    };

    if (!fs.existsSync(METRICS_DAILY_DIR)) {
      fs.mkdirSync(METRICS_DAILY_DIR, { recursive: true });
    }

    const metricsPath = path.join(METRICS_DAILY_DIR, `metrics-${dateStr}.json`);
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2), 'utf8');
    console.log(`[INFO] Metrics written to ${path.basename(metricsPath)}`);

    if (alerts.length > 0) {
      const alertsPath = path.join(ALERTS_DIR, `alerts-${dateStr}.json`);
      fs.writeFileSync(alertsPath, JSON.stringify({ date: dateStr, alerts }, null, 2), 'utf8');
      console.log(`[INFO] Alerts written to ${path.basename(alertsPath)}`);
    }

    return metrics;
  } catch (error) {
    console.error(`[ERROR] Aggregation failed: ${error.message}`);
    throw error;
  }
}

module.exports = { aggregateMetrics, getDateString };

if (require.main === module) {
  const dateStr = process.argv[2] || getDateString();
  aggregateMetrics(dateStr).then(result => {
    if (result) {
      console.log(JSON.stringify(result, null, 2));
    }
    process.exit(result ? 0 : 1);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
