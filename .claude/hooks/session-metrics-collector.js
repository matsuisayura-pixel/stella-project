#!/usr/bin/env node

/**
 * Session Metrics Collector
 *
 * Collects session-level metrics for Claude Code sessions.
 * - Session start/stop tracking
 * - Tool call counting
 * - Context optimization metrics
 * - Daily summary generation
 *
 * Usage:
 *   node session-metrics-collector.js start
 *   node session-metrics-collector.js stop
 *   node session-metrics-collector.js daily-summary
 *   node session-metrics-collector.js status
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Constants
const HOOKS_DATA_DIR = path.join(__dirname, 'data');
const SESSION_LOG_PATH = path.join(HOOKS_DATA_DIR, 'session-metrics.jsonl');
const DAILY_SUMMARY_DIR = path.join(HOOKS_DATA_DIR, 'daily-summary');
const STATE_FILE_PATH = path.join(HOOKS_DATA_DIR, 'session-state.json');
const MAX_LOG_LINES = 100;

// Ensure directories exist
if (!fs.existsSync(HOOKS_DATA_DIR)) {
  fs.mkdirSync(HOOKS_DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DAILY_SUMMARY_DIR)) {
  fs.mkdirSync(DAILY_SUMMARY_DIR, { recursive: true });
}

/**
 * Generate session ID
 */
function generateSessionId() {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${randomBytes}`;
}

/**
 * Get current session state
 */
function getCurrentSessionState() {
  try {
    if (!fs.existsSync(STATE_FILE_PATH)) {
      return null;
    }
    const content = fs.readFileSync(STATE_FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.debug(`[WARN] Failed to read session state: ${error.message}`);
    return null;
  }
}

/**
 * Save session state
 */
function saveSessionState(state) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.debug(`[ERROR] Failed to save session state: ${error.message}`);
  }
}

/**
 * Count auto-loaded files from CLAUDE.md
 */
function getAutoLoadedMetrics() {
  try {
    const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
    if (!fs.existsSync(claudeMdPath)) {
      return { fileCount: 0, totalSize: 0, estimatedTokens: 0 };
    }

    const stats = fs.statSync(claudeMdPath);
    const content = fs.readFileSync(claudeMdPath, 'utf8');

    // Count files by looking for file path patterns
    const fileMatches = content.match(/\/[^\s\n]+\.(md|js|ts|json|yaml|yml)/g) || [];
    const uniqueFiles = new Set(fileMatches);

    // Estimate tokens: ~4 chars per token
    const estimatedTokens = Math.ceil(content.length / 4);

    return {
      fileCount: uniqueFiles.size,
      totalSize: stats.size,
      estimatedTokens
    };
  } catch (error) {
    console.debug(`[WARN] Failed to get auto-loaded metrics: ${error.message}`);
    return { fileCount: 0, totalSize: 0, estimatedTokens: 0 };
  }
}

/**
 * Record session start
 */
function recordStart() {
  try {
    const sessionId = generateSessionId();
    const timestamp = new Date().toISOString();
    const autoLoadedMetrics = getAutoLoadedMetrics();

    const event = {
      sessionId,
      event: 'session_start',
      timestamp,
      data: {
        autoLoadedFiles: autoLoadedMetrics.fileCount,
        autoLoadedSize: autoLoadedMetrics.totalSize,
        estimatedTokens: autoLoadedMetrics.estimatedTokens,
        toolCallCount: 0,
        duration_minutes: 0,
        completionStatus: 'in_progress'
      }
    };

    // Append to log
    const logLine = JSON.stringify(event) + '\n';
    fs.appendFileSync(SESSION_LOG_PATH, logLine, 'utf8');

    // Save session state
    const state = {
      sessionId,
      startTime: timestamp,
      startMetrics: autoLoadedMetrics,
      toolCallCount: 0
    };
    saveSessionState(state);

    console.log(JSON.stringify({
      success: true,
      sessionId,
      startTime: timestamp,
      autoLoadedFiles: autoLoadedMetrics.fileCount
    }, null, 2));

    return { success: true, sessionId };
  } catch (error) {
    console.debug(`[ERROR] recordStart failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Record session stop
 */
function recordStop(completionStatus = 'completed') {
  try {
    const state = getCurrentSessionState();
    if (!state) {
      console.debug('[WARN] No active session found');
      return { success: false, error: 'No active session' };
    }

    const timestamp = new Date().toISOString();
    const startTime = new Date(state.startTime);
    const endTime = new Date(timestamp);
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

    // Read hook-event.log to count tool calls in this session
    let toolCallCount = 0;
    try {
      const eventLogPath = path.join(HOOKS_DATA_DIR, 'hook-event.log');
      if (fs.existsSync(eventLogPath)) {
        const content = fs.readFileSync(eventLogPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.sessionId === state.sessionId && event.hookName === 'tool-use') {
              toolCallCount++;
            }
          } catch (e) {
            // Skip invalid lines
          }
        }
      }
    } catch (error) {
      console.debug(`[WARN] Failed to count tool calls: ${error.message}`);
    }

    const event = {
      sessionId: state.sessionId,
      event: 'session_stop',
      timestamp,
      data: {
        autoLoadedFiles: state.startMetrics.fileCount,
        autoLoadedSize: state.startMetrics.totalSize,
        estimatedTokens: state.startMetrics.estimatedTokens,
        toolCallCount,
        duration_minutes: durationMinutes,
        completionStatus
      }
    };

    // Append to log
    const logLine = JSON.stringify(event) + '\n';
    fs.appendFileSync(SESSION_LOG_PATH, logLine, 'utf8');

    // Truncate log if needed
    truncateLogIfNeeded();

    // Clear session state
    if (fs.existsSync(STATE_FILE_PATH)) {
      fs.unlinkSync(STATE_FILE_PATH);
    }

    console.log(JSON.stringify({
      success: true,
      sessionId: state.sessionId,
      duration_minutes: durationMinutes,
      toolCallCount,
      completionStatus
    }, null, 2));

    return { success: true, sessionId: state.sessionId };
  } catch (error) {
    console.debug(`[ERROR] recordStop failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Truncate log to keep only last N lines
 */
function truncateLogIfNeeded() {
  try {
    if (!fs.existsSync(SESSION_LOG_PATH)) return;

    const content = fs.readFileSync(SESSION_LOG_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length <= MAX_LOG_LINES) return;

    // Keep only last MAX_LOG_LINES
    const truncatedLines = lines.slice(-MAX_LOG_LINES);
    const truncatedContent = truncatedLines.join('\n') + '\n';
    fs.writeFileSync(SESSION_LOG_PATH, truncatedContent, 'utf8');

    console.debug(`[INFO] Log truncated to ${MAX_LOG_LINES} lines`);
  } catch (error) {
    console.debug(`[ERROR] Log truncation failed: ${error.message}`);
  }
}

/**
 * Generate daily summary
 */
function generateDailySummary(date = null) {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (!fs.existsSync(SESSION_LOG_PATH)) {
      console.debug('[WARN] No session log found');
      return { success: false, error: 'No session log' };
    }

    const content = fs.readFileSync(SESSION_LOG_PATH, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    const sessions = {};

    // Parse all events
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        const eventDate = event.timestamp.split('T')[0];

        if (eventDate !== targetDate) continue;

        if (event.event === 'session_start') {
          sessions[event.sessionId] = {
            start: event,
            stop: null
          };
        } else if (event.event === 'session_stop') {
          if (sessions[event.sessionId]) {
            sessions[event.sessionId].stop = event;
          }
        }
      } catch (e) {
        // Skip invalid lines
      }
    }

    // Calculate metrics
    const sessionIds = Object.keys(sessions);
    const completedSessions = sessionIds.filter(id => sessions[id].stop !== null);

    let totalDuration = 0;
    let totalToolCalls = 0;
    let completedCount = 0;
    let tokenSavings = {
      tier1: 0, // Context optimization
      tier2: 0, // Skill/agent efficiency
      tier3: 0, // Dynamic optimization
      total: 0
    };

    for (const sessionId of sessionIds) {
      const session = sessions[sessionId];
      if (session.stop) {
        totalDuration += session.stop.data.duration_minutes;
        totalToolCalls += session.stop.data.toolCallCount;

        if (session.stop.data.completionStatus === 'completed') {
          completedCount++;
        }

        // Estimate token savings (Tier 1: auto-load optimization)
        const estimatedTokens = session.start.data.estimatedTokens || 0;
        // Assume 20% savings from context optimization
        tokenSavings.tier1 += Math.round(estimatedTokens * 0.2);
      }
    }

    // Read metrics from other collectors
    const metricsFiles = [
      { path: path.join(HOOKS_DATA_DIR, 'metrics_tier2.jsonl'), tier: 'tier2' },
      { path: path.join(HOOKS_DATA_DIR, 'metrics_tier3.jsonl'), tier: 'tier3' }
    ];

    for (const { path: metricPath, tier } of metricsFiles) {
      try {
        if (fs.existsSync(metricPath)) {
          const metricContent = fs.readFileSync(metricPath, 'utf8');
          const metricLines = metricContent.split('\n').filter(line => line.trim());

          for (const line of metricLines) {
            try {
              const metric = JSON.parse(line);
              const metricDate = metric.timestamp.split('T')[0];

              if (metricDate === targetDate && metric.tokensSaved) {
                tokenSavings[tier] += metric.tokensSaved;
              }
            } catch (e) {
              // Skip invalid lines
            }
          }
        }
      } catch (error) {
        console.debug(`[WARN] Failed to read ${tier} metrics: ${error.message}`);
      }
    }

    tokenSavings.total = tokenSavings.tier1 + tokenSavings.tier2 + tokenSavings.tier3;

    const summary = {
      date: targetDate,
      sessions: sessionIds.length,
      avgDurationMinutes: sessionIds.length > 0 ? Math.round(totalDuration / completedSessions.length) : 0,
      completionRate: sessionIds.length > 0 ? parseFloat((completedCount / sessionIds.length).toFixed(2)) : 0,
      totalToolCalls,
      tokenSavings
    };

    // Save summary
    const summaryPath = path.join(DAILY_SUMMARY_DIR, `${targetDate}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    console.log(JSON.stringify({
      success: true,
      summary
    }, null, 2));

    return { success: true, summary };
  } catch (error) {
    console.debug(`[ERROR] generateDailySummary failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Get current status
 */
function getStatus() {
  try {
    const state = getCurrentSessionState();
    const logExists = fs.existsSync(SESSION_LOG_PATH);
    const logSize = logExists ? fs.statSync(SESSION_LOG_PATH).size : 0;

    let logLineCount = 0;
    if (logExists) {
      const content = fs.readFileSync(SESSION_LOG_PATH, 'utf8');
      logLineCount = content.split('\n').filter(line => line.trim()).length;
    }

    const summaryFiles = fs.existsSync(DAILY_SUMMARY_DIR)
      ? fs.readdirSync(DAILY_SUMMARY_DIR).filter(f => f.endsWith('.json'))
      : [];

    const status = {
      activeSession: state ? {
        sessionId: state.sessionId,
        startTime: state.startTime,
        toolCallCount: state.toolCallCount
      } : null,
      log: {
        exists: logExists,
        size: logSize,
        lineCount: logLineCount,
        maxLines: MAX_LOG_LINES
      },
      summaries: {
        count: summaryFiles.length,
        latest: summaryFiles.length > 0 ? summaryFiles.sort().reverse()[0] : null
      }
    };

    console.log(JSON.stringify(status, null, 2));
    return status;
  } catch (error) {
    console.debug(`[ERROR] getStatus failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Exports
module.exports = {
  recordStart,
  recordStop,
  generateDailySummary,
  getStatus
};

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'start') {
    recordStart();
  } else if (command === 'stop') {
    const status = args[1] || 'completed';
    recordStop(status);
  } else if (command === 'daily-summary') {
    const date = args[1] || null;
    generateDailySummary(date);
  } else if (command === 'status') {
    getStatus();
  } else {
    console.error('Usage: node session-metrics-collector.js {start|stop|daily-summary|status}');
    process.exit(1);
  }
}
