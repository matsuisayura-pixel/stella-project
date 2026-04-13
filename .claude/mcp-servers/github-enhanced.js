#!/usr/bin/env node
/**
 * GitHub Enhanced MCP Server
 * Provides extended GitHub operations for Issue/PR management
 * P20 Update: i18n support for Japanese default
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

// i18n support
function getLocale() {
  const envLocale = process.env.TAISUN_LOCALE;
  if (envLocale === 'en' || envLocale === 'en-US') return 'en';
  if (envLocale === 'ja' || envLocale === 'ja-JP') return 'ja';

  // Try to load from config
  try {
    const configPath = path.join(process.cwd(), 'config', 'proxy-mcp', 'logging.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.issueLogLocale === 'en' || config.issueLogLocale === 'en-US') return 'en';
    }
  } catch {
    // Ignore
  }

  return 'ja'; // Default to Japanese
}

const i18n = {
  ja: {
    'progress.title': '🤖 エージェント進捗更新',
    'progress.status': 'ステータス',
    'progress.section': '進捗',
    'progress.tasks_completed': 'タスク完了',
    'progress.current_task': '現在のタスク',
    'progress.updated': '更新',
    'pr.created': '🤖 エージェントが{draft}PRを作成しました: #{number}',
    'pr.draft': 'ドラフト',
    'quality.title': '📊 品質レポート',
    'quality.score': 'スコア',
    'quality.typescript_errors': 'TypeScriptエラー',
    'quality.eslint_errors': 'ESLintエラー',
    'quality.security_score': 'セキュリティスコア',
    'quality.test_coverage': 'テストカバレッジ',
  },
  en: {
    'progress.title': '🤖 Agent Progress Update',
    'progress.status': 'Status',
    'progress.section': 'Progress',
    'progress.tasks_completed': 'tasks completed',
    'progress.current_task': 'Current Task',
    'progress.updated': 'Updated',
    'pr.created': '🤖 Agent has created a {draft}PR: #{number}',
    'pr.draft': 'draft ',
    'quality.title': '📊 Quality Report',
    'quality.score': 'Score',
    'quality.typescript_errors': 'TypeScript Errors',
    'quality.eslint_errors': 'ESLint Errors',
    'quality.security_score': 'Security Score',
    'quality.test_coverage': 'Test Coverage',
  },
};

function t(key, params = {}) {
  const locale = getLocale();
  let template = i18n[locale]?.[key] || i18n['en'][key] || key;
  for (const [param, value] of Object.entries(params)) {
    template = template.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
  }
  return template;
}

class GitHubEnhancedServer {
  constructor() {
    this.server = new Server(
      {
        name: 'github-enhanced-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Octokit
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    this.octokit = new Octokit({ auth: token });

    // Parse repository
    const repo = process.env.REPOSITORY;
    if (!repo || !repo.includes('/')) {
      throw new Error('REPOSITORY environment variable must be in format "owner/repo"');
    }
    [this.owner, this.repo] = repo.split('/');

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_issue_with_labels',
          description: 'Create GitHub Issue with automatic label assignment based on content',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Issue title',
              },
              body: {
                type: 'string',
                description: 'Issue body (markdown)',
              },
              autoLabel: {
                type: 'boolean',
                description: 'Automatically assign labels based on content',
                default: true,
              },
              assignees: {
                type: 'array',
                items: { type: 'string' },
                description: 'GitHub usernames to assign',
              },
            },
            required: ['title', 'body'],
          },
        },
        {
          name: 'get_agent_tasks',
          description: 'Get all Issues with agent-execute label',
          inputSchema: {
            type: 'object',
            properties: {
              state: {
                type: 'string',
                enum: ['open', 'closed', 'all'],
                default: 'open',
              },
            },
          },
        },
        {
          name: 'update_issue_progress',
          description: 'Update Issue with progress report and task checklist',
          inputSchema: {
            type: 'object',
            properties: {
              issueNumber: {
                type: 'number',
                description: 'Issue number',
              },
              progress: {
                type: 'object',
                properties: {
                  completed: { type: 'number' },
                  total: { type: 'number' },
                  currentTask: { type: 'string' },
                  status: { type: 'string', enum: ['in_progress', 'completed', 'failed'] },
                },
                required: ['completed', 'total', 'status'],
              },
            },
            required: ['issueNumber', 'progress'],
          },
        },
        {
          name: 'create_pr_from_agent',
          description: 'Create PR with agent-generated content and quality report',
          inputSchema: {
            type: 'object',
            properties: {
              issueNumber: {
                type: 'number',
                description: 'Related Issue number',
              },
              branch: {
                type: 'string',
                description: 'Source branch name',
              },
              title: {
                type: 'string',
                description: 'PR title',
              },
              body: {
                type: 'string',
                description: 'PR body',
              },
              qualityReport: {
                type: 'object',
                description: 'Quality assessment report',
              },
              draft: {
                type: 'boolean',
                default: true,
              },
            },
            required: ['issueNumber', 'branch', 'title', 'body'],
          },
        },
        {
          name: 'get_pr_review_status',
          description: 'Get detailed review status including checks and approvals',
          inputSchema: {
            type: 'object',
            properties: {
              prNumber: {
                type: 'number',
                description: 'PR number',
              },
            },
            required: ['prNumber'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_issue_with_labels':
            return await this.createIssueWithLabels(args);
          case 'get_agent_tasks':
            return await this.getAgentTasks(args);
          case 'update_issue_progress':
            return await this.updateIssueProgress(args);
          case 'create_pr_from_agent':
            return await this.createPRFromAgent(args);
          case 'get_pr_review_status':
            return await this.getPRReviewStatus(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async createIssueWithLabels(args) {
    const { title, body, autoLabel = true, assignees = [] } = args;

    // Auto-detect labels
    let labels = [];
    if (autoLabel) {
      labels = this.detectLabels(title, body);
    }

    // Create issue
    const response = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      labels,
      assignees,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'created',
            issue: {
              number: response.data.number,
              url: response.data.html_url,
              labels: response.data.labels.map(l => l.name),
            },
          }, null, 2),
        },
      ],
    };
  }

  detectLabels(title, body) {
    const labels = [];
    const text = `${title} ${body}`.toLowerCase();

    // Feature detection
    if (text.includes('feature') || text.includes('新機能') || text.includes('add')) {
      labels.push('enhancement');
    }

    // Bug detection
    if (text.includes('bug') || text.includes('fix') || text.includes('error') || text.includes('バグ')) {
      labels.push('bug');
    }

    // Documentation detection
    if (text.includes('documentation') || text.includes('docs') || text.includes('readme') || text.includes('ドキュメント')) {
      labels.push('documentation');
    }

    // Security detection
    if (text.includes('security') || text.includes('vulnerability') || text.includes('セキュリティ')) {
      labels.push('security');
    }

    // Performance detection
    if (text.includes('performance') || text.includes('optimize') || text.includes('パフォーマンス')) {
      labels.push('performance');
    }

    return labels;
  }

  async getAgentTasks(args) {
    const { state = 'open' } = args;

    const response = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state,
      labels: '🤖agent-execute',
      per_page: 100,
    });

    const tasks = response.data.map(issue => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      labels: issue.labels.map(l => l.name),
      assignee: issue.assignee?.login,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      url: issue.html_url,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            total: tasks.length,
            tasks,
          }, null, 2),
        },
      ],
    };
  }

  async updateIssueProgress(args) {
    const { issueNumber, progress } = args;

    // Get current issue
    const issue = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    // Create progress comment
    const progressEmoji = {
      in_progress: '🔄',
      completed: '✅',
      failed: '❌',
    };

    const statusText = {
      in_progress: getLocale() === 'ja' ? '進行中' : 'IN PROGRESS',
      completed: getLocale() === 'ja' ? '完了' : 'COMPLETED',
      failed: getLocale() === 'ja' ? '失敗' : 'FAILED',
    };

    const progressBar = this.createProgressBar(progress.completed, progress.total);

    const comment = `
## ${t('progress.title')}

${progressEmoji[progress.status]} **${t('progress.status')}**: ${statusText[progress.status]}

### ${t('progress.section')}
${progressBar}
**${progress.completed}/${progress.total}** ${t('progress.tasks_completed')}

${progress.currentTask ? `**${t('progress.current_task')}**: ${progress.currentTask}` : ''}

---
*${t('progress.updated')}: ${new Date().toISOString()}*
`;

    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body: comment,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'updated',
            issueNumber,
            progress,
          }, null, 2),
        },
      ],
    };
  }

  createProgressBar(completed, total) {
    const percentage = Math.round((completed / total) * 100);
    const filled = Math.round(percentage / 5); // 20 blocks
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
  }

  async createPRFromAgent(args) {
    const { issueNumber, branch, title, body, qualityReport, draft = true } = args;

    // Enhance PR body with quality report
    let enhancedBody = body;
    if (qualityReport) {
      enhancedBody += `\n\n## ${t('quality.title')}\n\n`;
      enhancedBody += `- **${t('quality.score')}**: ${qualityReport.score}/100 ${qualityReport.passed ? '✅' : '❌'}\n`;
      enhancedBody += `- **${t('quality.typescript_errors')}**: ${qualityReport.breakdown?.typeScriptScore || 'N/A'}\n`;
      enhancedBody += `- **${t('quality.eslint_errors')}**: ${qualityReport.breakdown?.eslintScore || 'N/A'}\n`;
      enhancedBody += `- **${t('quality.security_score')}**: ${qualityReport.breakdown?.securityScore || 'N/A'}\n`;
      enhancedBody += `- **${t('quality.test_coverage')}**: ${qualityReport.breakdown?.testCoverageScore || 'N/A'}\n`;
    }

    enhancedBody += `\n\nCloses #${issueNumber}`;

    // Create PR
    const response = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body: enhancedBody,
      head: branch,
      base: 'main',
      draft,
    });

    // Link to issue
    const draftText = draft ? t('pr.draft') : '';
    const prComment = t('pr.created', { draft: draftText, number: response.data.number });
    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body: prComment,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'created',
            pr: {
              number: response.data.number,
              url: response.data.html_url,
              draft: response.data.draft,
            },
          }, null, 2),
        },
      ],
    };
  }

  async getPRReviewStatus(args) {
    const { prNumber } = args;

    // Get PR details
    const pr = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    // Get reviews
    const reviews = await this.octokit.pulls.listReviews({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    // Get checks
    const checks = await this.octokit.checks.listForRef({
      owner: this.owner,
      repo: this.repo,
      ref: pr.data.head.sha,
    });

    const status = {
      pr: {
        number: pr.data.number,
        state: pr.data.state,
        mergeable: pr.data.mergeable,
        merged: pr.data.merged,
        draft: pr.data.draft,
      },
      reviews: {
        total: reviews.data.length,
        approved: reviews.data.filter(r => r.state === 'APPROVED').length,
        changesRequested: reviews.data.filter(r => r.state === 'CHANGES_REQUESTED').length,
      },
      checks: {
        total: checks.data.check_runs.length,
        passed: checks.data.check_runs.filter(c => c.conclusion === 'success').length,
        failed: checks.data.check_runs.filter(c => c.conclusion === 'failure').length,
        pending: checks.data.check_runs.filter(c => c.status === 'in_progress' || c.status === 'queued').length,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub Enhanced MCP Server running on stdio');
  }
}

const server = new GitHubEnhancedServer();
server.run().catch(console.error);
