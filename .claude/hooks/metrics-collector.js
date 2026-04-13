#!/usr/bin/env node

/**
 * Hook Metrics Collector
 *
 * Collects metrics from Claude Code hook events and stores them in JSON Lines format.
 * - Validates events against schema
 * - Records to hook-event.log
 * - Buffers in memory with periodic flush
 * - Handles log rotation (100MB max)
 * - Performance: <10ms per event
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Constants
const HOOKS_DATA_DIR = path.join(__dirname, 'data');
const EVENT_LOG_PATH = path.join(HOOKS_DATA_DIR, 'hook-event.log');
const MAX_LOG_SIZE_MB = 100;
const MAX_LOG_SIZE_BYTES = MAX_LOG_SIZE_MB * 1024 * 1024;
const BUFFER_FLUSH_INTERVAL_MS = 15 * 60 * 1000;
const MAX_BUFFER_SIZE = 1000;
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 100;

let eventBuffer = [];
let bufferFlushTimer = null;
let isFlushingBuffer = false;

function validateEvent(event) {
  const errors = [];

  if (!event.timestamp) {
    errors.push('timestamp is required');
  } else if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(event.timestamp)) {
    errors.push('timestamp must be ISO 8601 format');
  }

  if (!event.hookName) errors.push('hookName is required');
  if (!event.phase) errors.push('phase is required');
  if (!event.eventType) errors.push('eventType is required');
  if (event.eventType === 'block' && !event.reason) {
    errors.push('reason is required when eventType is block');
  }
  if (typeof event.processingTimeMs !== 'number') {
    errors.push('processingTimeMs must be a number');
  }
  if (!event.sessionId) errors.push('sessionId is required');

  return { isValid: errors.length === 0, errors };
}

function hashToolParams(params) {
  if (!params) return null;
  const paramsStr = JSON.stringify(params);
  const paramsHash = crypto.createHash('sha256').update(paramsStr).digest('hex');
  return {
    paramsHash: paramsHash.substring(0, 20) + '...',
    paramsSize: Buffer.byteLength(paramsStr, 'utf8')
  };
}

async function recordMetric(event) {
  const startTime = Date.now();
  try {
    const validation = validateEvent(event);
    if (!validation.isValid) {
      console.debug(`[ERROR] Event validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    if (event.toolParams) {
      event.toolParams = hashToolParams(event.toolParams);
    }
    eventBuffer.push(event);
    if (eventBuffer.length >= MAX_BUFFER_SIZE) {
      await flushBuffer();
    }
    if (!bufferFlushTimer) {
      bufferFlushTimer = setTimeout(flushBuffer, BUFFER_FLUSH_INTERVAL_MS);
    }
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    if (processingTime > 10) {
      console.debug(`[WARN] recordMetric took ${processingTime}ms (target: <10ms)`);
    }
  } catch (error) {
    console.debug(`[ERROR] recordMetric failed: ${error.message}`);
  }
}

async function flushBuffer() {
  if (isFlushingBuffer || eventBuffer.length === 0) return;
  isFlushingBuffer = true;
  try {
    if (bufferFlushTimer) {
      clearTimeout(bufferFlushTimer);
      bufferFlushTimer = null;
    }
    const eventsToWrite = [...eventBuffer];
    eventBuffer = [];
    await rotateLogIfNeeded();
    let attempt = 0;
    while (attempt < RETRY_MAX_ATTEMPTS) {
      try {
        const content = eventsToWrite.map(e => JSON.stringify(e)).join('\n') + '\n';
        fs.appendFileSync(EVENT_LOG_PATH, content, 'utf8');
        break;
      } catch (error) {
        attempt++;
        if (attempt >= RETRY_MAX_ATTEMPTS) {
          console.debug(`[ERROR] Failed to write event log: ${error.message}`);
        } else {
          await sleep(RETRY_BACKOFF_MS * Math.pow(2, attempt - 1));
        }
      }
    }
  } finally {
    isFlushingBuffer = false;
  }
}

async function rotateLogIfNeeded() {
  try {
    if (!fs.existsSync(EVENT_LOG_PATH)) return;
    const stats = fs.statSync(EVENT_LOG_PATH);
    if (stats.size < MAX_LOG_SIZE_BYTES) return;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const rotatePath = path.join(HOOKS_DATA_DIR, `hook-event-${dateStr}.log`);
    fs.renameSync(EVENT_LOG_PATH, rotatePath);
    console.debug(`[INFO] Log rotated to ${path.basename(rotatePath)}`);
  } catch (error) {
    console.debug(`[ERROR] Log rotation failed: ${error.message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getBufferStatus() {
  return {
    bufferSize: eventBuffer.length,
    maxBufferSize: MAX_BUFFER_SIZE,
    bufferUtilization: (eventBuffer.length / MAX_BUFFER_SIZE * 100).toFixed(1) + '%',
    isFlushingBuffer,
    hasFlushTimer: !!bufferFlushTimer
  };
}

async function onProcessExit() {
  if (eventBuffer.length > 0) {
    await flushBuffer();
  }
}

process.on('exit', onProcessExit);
process.on('SIGINT', async () => {
  await onProcessExit();
  process.exit(0);
});

module.exports = {
  recordMetric,
  flushBuffer,
  getBufferStatus,
  validateEvent,
  rotateLogIfNeeded
};

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === 'status') {
    console.log(JSON.stringify(getBufferStatus(), null, 2));
  } else if (args[0] === 'flush') {
    flushBuffer().then(() => {
      console.log('Buffer flushed');
      process.exit(0);
    });
  }
}
