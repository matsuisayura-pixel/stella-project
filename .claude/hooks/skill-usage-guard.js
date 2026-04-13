#!/usr/bin/env node
/**
 * Skill Usage Guard - スキル使用指示の検出と自動マッピング強制
 *
 * UserPromptSubmit 時に実行され、
 * 1. 「〇〇のスキルを使って」という明示的指示を検出
 * 2. タスク種別から必須スキルを自動推定して強制
 *
 * v3.0: skill-mapping.json による自動マッピング機能追加
 *       スキル名を明示しなくても、タスク種別から必須スキルを強制
 *
 * 防止する問題:
 * - スキル使用の指示を無視する
 * - 手動で同等の処理を実装してしまう
 * - 正しいスキルを使わずに古いワークフローを使ってしまう
 */

const fs = require('fs');
const path = require('path');
const stateManager = require('./workflow-state-manager.js');
const { readStdin } = require('./utils/read-stdin');

// スキルマッピング設定ファイルのパス
const SKILL_MAPPING_PATH = path.join(__dirname, 'config', 'skill-mapping.json');

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

  const prompt = input.prompt || '';
  const context = [];

  // スキル使用パターンを検出（明示的指示）
  const skillPatterns = [
    /([a-zA-Z0-9_-]+)\s*(?:の)?スキルを使(?:って|用)/gi,
    /(?:use|using)\s+(?:the\s+)?([a-zA-Z0-9_-]+)\s+skill/gi,
    /\/([a-zA-Z0-9_-]+)/g,  // スラッシュコマンド
  ];

  const detectedSkills = [];

  skillPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      detectedSkills.push(match[1]);
    }
  });

  // 「同じワークフロー」パターンを検出
  const sameWorkflowPatterns = [
    /同じ(?:ワークフロー|スクリプト|方法|手順)で/gi,
    /(?:same|identical)\s+(?:workflow|script|method)/gi,
    /前回と同じ/gi,
    /既存の(?:スクリプト|ワークフロー)を/gi,
  ];

  let requiresSameWorkflow = false;
  sameWorkflowPatterns.forEach(pattern => {
    if (pattern.test(prompt)) {
      requiresSameWorkflow = true;
    }
  });

  // ===== 新機能: タスク種別から自動マッピング =====
  const autoMappedSkills = detectAutoMappedSkills(prompt);

  // コンテキストを追加
  const hasExplicitSkills = detectedSkills.length > 0;
  const hasAutoMappedSkills = autoMappedSkills.length > 0;
  const hasAnyRequirement = hasExplicitSkills || hasAutoMappedSkills || requiresSameWorkflow;

  if (hasAnyRequirement) {
    // v3.1: コンテキスト最適化 - stdoutは最小限、詳細はJSONファイルに書き出し
    const detailData = {
      timestamp: new Date().toISOString(),
      autoMapped: autoMappedSkills.map(m => ({
        name: m.name,
        description: m.description,
        required_skills: m.required_skills,
        strict: m.strict || false,
        skill_path: m.skill_path || null
      })),
      explicit: [...new Set(detectedSkills)],
      requiresSameWorkflow
    };

    // 詳細をJSONファイルに書き出し（AIがReadで参照可能）
    const detailPath = path.join(__dirname, 'data', 'skill-guard-detail.json');
    try {
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(detailPath, JSON.stringify(detailData, null, 2));
    } catch (e) { /* ignore */ }

    // stdoutには1-3行の圧縮サマリーのみ出力
    const allSkills = [
      ...autoMappedSkills.flatMap(m => m.required_skills),
      ...new Set(detectedSkills)
    ];
    const uniqueSkills = [...new Set(allSkills)];
    const strictSkills = autoMappedSkills.filter(m => m.strict);

    context.push(`[Skill Guard] 必須: ${uniqueSkills.join(', ')}${strictSkills.length > 0 ? ' (STRICT)' : ''} | Skill tool必須、手動実装禁止`);

    if (requiresSameWorkflow) {
      context.push(`[Skill Guard] 同一ワークフロー指示あり → 既存ファイルをRead後に作業`);
    }
  }

  // スキル要求を .workflow_state.json に記録
  const allRequiredSkills = [
    ...detectedSkills,
    ...autoMappedSkills.flatMap(m => m.required_skills)
  ];

  if (allRequiredSkills.length > 0 || requiresSameWorkflow) {
    const cwd = input.cwd || process.cwd();
    let state = stateManager.loadState(cwd);

    if (!state) {
      // 状態がない場合は新規作成
      state = stateManager.createInitialState('user_request', true);
    }

    // 要求されたスキルを記録（evidence.required_skills）
    if (!state.evidence.required_skills) {
      state.evidence.required_skills = {};
    }

    allRequiredSkills.forEach(skill => {
      state.evidence.required_skills[skill] = {
        requestedAt: new Date().toISOString(),
        used: false,
        autoMapped: !detectedSkills.includes(skill)
      };
    });

    // 自動マッピング情報を記録
    if (autoMappedSkills.length > 0) {
      state.meta.autoMappedSkills = autoMappedSkills.map(m => ({
        name: m.name,
        required_skills: m.required_skills,
        strict: m.strict
      }));
    }

    // 「同じワークフロー」要求を記録
    if (requiresSameWorkflow) {
      state.meta.requiresSameWorkflow = true;
      state.meta.sameWorkflowRequestedAt = new Date().toISOString();
    }

    stateManager.saveState(state, cwd);
  }

  if (context.length > 0) {
    console.log(context.join('\n'));
  }

  process.exit(0);
}

/**
 * タスク種別からスキルを自動マッピング
 * v4.0: triggers形式 + skills配列（複数スキル同時発動）対応
 *
 * マッピング形式:
 *   triggers: 部分一致キーワード配列（いずれかがヒットでマッチ）
 *   skill:    単一スキル名（従来形式）
 *   skills:   複数スキル名配列（全スキル同時発動）
 *   mode:     "first"（最初のマッチで停止）or "all"（該当スキル全発動）
 */
function detectAutoMappedSkills(prompt) {
  const mappings = loadSkillMappings();
  if (!mappings || !mappings.mappings) {
    return [];
  }

  const settings = mappings.settings || {};
  const caseInsensitive = settings.case_insensitive !== false;

  const normalizedPrompt = caseInsensitive ? prompt.toUpperCase() : prompt;
  const matched = [];

  for (const mapping of mappings.mappings) {
    const { triggers, when_contains_all, when_contains_any, priority } = mapping;
    let isMatch = false;

    // triggers形式: いずれかのキーワードが部分一致でマッチ
    if (triggers && triggers.length > 0) {
      for (const trigger of triggers) {
        const normalizedTrigger = caseInsensitive ? trigger.toUpperCase() : trigger;
        if (normalizedPrompt.includes(normalizedTrigger)) {
          isMatch = true;
          break;
        }
      }
    }

    // when_contains_all / when_contains_any 形式（後方互換）
    if (!isMatch && (when_contains_all || when_contains_any)) {
      let allMatch = true;
      if (when_contains_all && when_contains_all.length > 0) {
        for (const keyword of when_contains_all) {
          const normalizedKeyword = caseInsensitive ? keyword.toUpperCase() : keyword;
          if (!normalizedPrompt.includes(normalizedKeyword)) {
            allMatch = false;
            break;
          }
        }
      }

      if (allMatch) {
        let anyMatch = false;
        if (!when_contains_any || when_contains_any.length === 0) {
          anyMatch = true;
        } else {
          for (const keyword of when_contains_any) {
            const normalizedKeyword = caseInsensitive ? keyword.toUpperCase() : keyword;
            if (normalizedPrompt.includes(normalizedKeyword)) {
              anyMatch = true;
              break;
            }
          }
        }
        isMatch = allMatch && anyMatch;
      }
    }

    if (isMatch) {
      // skills配列またはskill単体からrequired_skillsを構築
      const required_skills = mapping.skills
        ? [...mapping.skills]
        : (mapping.skill ? [mapping.skill] : []);

      matched.push({
        ...mapping,
        name: mapping.description || mapping.skill || 'unknown',
        required_skills,
        matchedPriority: priority || 0
      });

      // mode: "all" でなければ最初のマッチで停止
      if (mapping.mode !== 'all') {
        break;
      }
    }
  }

  // 優先度でソート（高い順）
  matched.sort((a, b) => (b.matchedPriority || 0) - (a.matchedPriority || 0));

  return matched;
}

/**
 * スキルマッピング設定を読み込む
 */
function loadSkillMappings() {
  try {
    if (fs.existsSync(SKILL_MAPPING_PATH)) {
      const content = fs.readFileSync(SKILL_MAPPING_PATH, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error(`Warning: Failed to load skill mappings: ${e.message}`);
  }
  return null;
}

main().catch(() => process.exit(0));
