#!/usr/bin/env node
/**
 * Session Issue Logger - セッション終了時に自動でIssueを作成
 *
 * セッション終了時に実行され、作業内容をGitHub Issueに記録します。
 *
 * 機能:
 * - セッション中の作業内容を自動収集
 * - 編集されたファイル、使用されたエージェント、完了したタスクを記録
 * - GitHub Issueとして作業ログを永続化
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 設定
const REPO = 'taiyousan15/taisun_agent';
const SESSION_STATE_FILE = '.agent_usage_state.json';
const WORKFLOW_STATE_FILE = '.workflow_state.json';

function getGitInfo(cwd) {
  try {
    const branch = execSync('git branch --show-current', { cwd, encoding: 'utf8' }).trim();
    const recentCommits = execSync('git log --oneline -5', { cwd, encoding: 'utf8' }).trim();
    const status = execSync('git status --short', { cwd, encoding: 'utf8' }).trim();
    const diff = execSync('git diff --stat HEAD~1 2>/dev/null || echo "No previous commit"', { cwd, encoding: 'utf8' }).trim();

    return { branch, recentCommits, status, diff };
  } catch (e) {
    return { branch: 'unknown', recentCommits: '', status: '', diff: '' };
  }
}

function loadSessionState(cwd) {
  const statePath = path.join(cwd, SESSION_STATE_FILE);
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function loadWorkflowState(cwd) {
  const statePath = path.join(cwd, WORKFLOW_STATE_FILE);
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function createIssueBody(cwd, sessionState, workflowState, gitInfo) {
  const timestamp = new Date().toISOString();
  const date = new Date().toLocaleDateString('ja-JP');

  let body = `## セッション作業ログ\n\n`;
  body += `### 実行日時\n${timestamp}\n\n`;

  // Git情報
  body += `### Git情報\n`;
  body += `- **ブランチ**: ${gitInfo.branch}\n`;
  body += `- **ステータス**:\n\`\`\`\n${gitInfo.status || 'Clean'}\n\`\`\`\n\n`;

  // 最近のコミット
  if (gitInfo.recentCommits) {
    body += `### 最近のコミット\n\`\`\`\n${gitInfo.recentCommits}\n\`\`\`\n\n`;
  }

  // 変更の統計
  if (gitInfo.diff && gitInfo.diff !== 'No previous commit') {
    body += `### 変更統計\n\`\`\`\n${gitInfo.diff}\n\`\`\`\n\n`;
  }

  // セッション状態
  if (sessionState) {
    body += `### セッション情報\n`;
    body += `- **Task Tool使用**: ${sessionState.taskToolUsed ? 'Yes' : 'No'}\n`;
    body += `- **複雑タスク検出**: ${sessionState.complexTaskDetected ? 'Yes' : 'No'}\n`;

    if (sessionState.filesEdited && sessionState.filesEdited.length > 0) {
      body += `- **編集ファイル数**: ${sessionState.filesEdited.length}\n`;
      body += `\n編集されたファイル:\n`;
      sessionState.filesEdited.forEach(f => {
        body += `  - ${f}\n`;
      });
    }

    if (sessionState.detectedPatterns && sessionState.detectedPatterns.length > 0) {
      body += `\n検出されたタスクパターン:\n`;
      sessionState.detectedPatterns.forEach(p => {
        body += `  - ${p}\n`;
      });
    }
    body += `\n`;
  }

  // ワークフロー状態
  if (workflowState) {
    body += `### ワークフロー情報\n`;
    body += `- **ワークフローID**: ${workflowState.workflow_id || 'N/A'}\n`;
    body += `- **現在フェーズ**: ${workflowState.current_phase || 'N/A'}\n`;
    body += `- **Strictモード**: ${workflowState.strict_mode ? 'Yes' : 'No'}\n`;

    if (workflowState.evidence) {
      const filesRead = Object.keys(workflowState.evidence.files_read || {}).length;
      const filesWritten = Object.keys(workflowState.evidence.files_written || {}).length;
      body += `- **読み込みファイル数**: ${filesRead}\n`;
      body += `- **書き込みファイル数**: ${filesWritten}\n`;
    }
    body += `\n`;
  }

  body += `---\n`;
  body += `_自動生成されたセッションログ_\n`;

  return body;
}

async function createIssue(title, body, cwd) {
  const os = require('os');
  const tempFile = path.join(os.tmpdir(), `taisun-issue-${Date.now()}.md`);

  try {
    // 本文を一時ファイルに書き込み（コマンドインジェクション対策）
    fs.writeFileSync(tempFile, body);

    // タイトルのサニタイズ（危険な文字を除去）
    const safeTitle = title.replace(/[`$"\\]/g, '').substring(0, 200);

    // gh CLIでIssue作成（--body-fileを使用）
    const result = execSync(
      `gh issue create --repo "${REPO}" --title "${safeTitle}" --body-file "${tempFile}"`,
      { cwd, encoding: 'utf8', timeout: 30000 }
    );

    // 一時ファイルを削除
    try { fs.unlinkSync(tempFile); } catch (e) { /* ignore */ }

    return result.trim();
  } catch (e) {
    // 一時ファイルを削除
    try { fs.unlinkSync(tempFile); } catch (e2) { /* ignore */ }

    // gh CLIがない場合やエラーの場合はローカルログに保存
    const logDir = path.join(cwd, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `session-log-${Date.now()}.md`);
    fs.writeFileSync(logFile, `# ${title}\n\n${body}`);
    return `Local log saved: ${logFile}`;
  }
}

async function main() {
  let input = {};

  try {
    const stdinData = await readStdin();
    if (stdinData) {
      input = JSON.parse(stdinData);
    }
  } catch (e) {
    // ignore
  }

  const cwd = input.cwd || process.cwd();

  // 状態を読み込み
  const sessionState = loadSessionState(cwd);
  const workflowState = loadWorkflowState(cwd);
  const gitInfo = getGitInfo(cwd);

  // Issue本文を作成
  const body = createIssueBody(cwd, sessionState, workflowState, gitInfo);
  const date = new Date().toLocaleDateString('ja-JP');
  const title = `[Session Log] ${date} - ${gitInfo.branch}`;

  // Issueを作成
  try {
    const result = await createIssue(title, body, cwd);
    console.log(`Session log created: ${result}`);
  } catch (e) {
    console.error(`Failed to create session log: ${e.message}`);
  }

  // セッション状態をクリア
  const sessionStatePath = path.join(cwd, SESSION_STATE_FILE);
  if (fs.existsSync(sessionStatePath)) {
    try {
      fs.unlinkSync(sessionStatePath);
    } catch (e) {
      // ignore
    }
  }

  process.exit(0);
}

function readStdin(timeout = 1000) {
  return new Promise((resolve) => {
    let data = '';
    let resolved = false;

    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve(data);
      }
    };

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', finish);
    setTimeout(finish, timeout);

    if (process.stdin.isTTY) finish();
  });
}

main().catch(() => process.exit(0));
