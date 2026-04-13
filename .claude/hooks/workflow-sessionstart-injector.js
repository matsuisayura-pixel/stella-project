#!/usr/bin/env node
/**
 * Workflow SessionStart Injector - セッション開始時の状態注入
 *
 * SessionStart 時に実行され、.workflow_state.json の内容を
 * コンテキストとして注入します。
 *
 * これにより、セッション再開時のフェーズ誤認を防止します。
 */

const fs = require('fs');
const path = require('path');
const stateManager = require('./workflow-state-manager.js');
const { readStdin } = require('./utils/read-stdin');

async function main() {
  let input = {};

  try {
    const stdinData = await readStdin();
    if (stdinData) {
      input = JSON.parse(stdinData);
    }
  } catch (e) {
    process.exit(0);
    return;
  }

  const cwd = input.cwd || process.cwd();
  const context = [];

  // ワークフロー状態を読み込み（欠損時は自動初期化）
  let state = stateManager.loadState(cwd);

  if (!state) {
    // .workflow_state.json が存在しない場合、デフォルト状態を自動作成
    state = stateManager.createInitialState('user_request', true);
    const saved = stateManager.saveState(state, cwd);
    if (saved) {
      context.push('=== WORKFLOW STATE AUTO-INITIALIZED ===');
      context.push('');
      context.push('.workflow_state.json が見つからなかったため、デフォルト状態で自動作成しました。');
      context.push('');
    }
  }

  if (state) {
    // 状態要約を生成
    const summary = stateManager.generateStateSummary(state);
    if (summary) {
      context.push(summary);
    }
  }

  // Desktop以下のプロジェクトも検索
  const desktopStates = findDesktopWorkflowStates();
  if (desktopStates.length > 0) {
    context.push('');
    context.push('=== OTHER ACTIVE WORKFLOWS ===');
    context.push('');
    desktopStates.forEach(ws => {
      context.push(`- ${ws.path}: ${ws.workflowId} (Phase ${ws.phase})`);
    });
    context.push('');
  }

  // SESSION_HANDOFF.md も探して注入
  const handoffs = findSessionHandoffs(cwd);
  if (handoffs.length > 0) {
    context.push('');
    context.push('=== SESSION HANDOFF FILES FOUND ===');
    context.push('');
    context.push('以下のハンドオフファイルを確認してください:');
    handoffs.forEach(h => {
      context.push(`- ${h}`);
    });
    context.push('');
  }

  // mistakes.md の存在確認
  const mistakesPath = path.join(__dirname, 'mistakes.md');
  if (fs.existsSync(mistakesPath)) {
    context.push('');
    context.push('=== MISTAKES LOG EXISTS ===');
    context.push('');
    context.push('過去のミスが記録されています。作業開始前に確認してください:');
    context.push(`- ${mistakesPath}`);
    context.push('');
  }

  // コンテキストを出力
  if (context.length > 0) {
    console.log(context.join('\n'));
  }

  process.exit(0);
}

function findDesktopWorkflowStates() {
  const states = [];
  try {
    const desktop = path.join(process.env.HOME, 'Desktop');
    if (fs.existsSync(desktop)) {
      const entries = fs.readdirSync(desktop, { withFileTypes: true });

      entries.forEach(entry => {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const statePath = path.join(desktop, entry.name, '.workflow_state.json');
          if (fs.existsSync(statePath)) {
            try {
              const content = fs.readFileSync(statePath, 'utf8');
              const state = JSON.parse(content);
              states.push({
                path: path.join(desktop, entry.name),
                workflowId: state.meta?.workflowId || 'unknown',
                phase: state.meta?.currentPhase || 1
              });
            } catch (e) {}
          }
        }
      });
    }
  } catch (e) {}
  return states.slice(0, 5);
}

function findSessionHandoffs(cwd) {
  const handoffs = [];

  try {
    // カレントディレクトリ
    const cwdHandoff = path.join(cwd, 'SESSION_HANDOFF.md');
    if (fs.existsSync(cwdHandoff)) {
      handoffs.push(cwdHandoff);
    }

    // Desktop以下を検索
    const desktop = path.join(process.env.HOME, 'Desktop');
    if (fs.existsSync(desktop)) {
      const entries = fs.readdirSync(desktop, { withFileTypes: true });

      entries.forEach(entry => {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const handoffPath = path.join(desktop, entry.name, 'SESSION_HANDOFF.md');
          if (fs.existsSync(handoffPath)) {
            handoffs.push(handoffPath);
          }
        }
      });
    }
  } catch (e) {}

  return [...new Set(handoffs)].slice(0, 5);
}

main().catch(() => process.exit(0));
