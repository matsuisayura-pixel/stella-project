/**
 * Agent Trace Store
 *
 * Agent Trace仕様（v0.1.0）に準拠したトレースストレージライブラリ
 * https://agent-trace.dev/
 *
 * @version 1.0.0
 * @license MIT
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================
// Type Definitions (Agent Trace Spec v0.1.0)
// ============================================

/**
 * 貢献者タイプ
 * - human: 人間が直接記述
 * - ai: AIが生成
 * - mixed: 人間が編集したAIコード、またはAIが編集した人間のコード
 * - unknown: 起源不明
 */
export type ContributorType = 'human' | 'ai' | 'mixed' | 'unknown';

/**
 * 行範囲
 */
export interface TraceRange {
  start_line: number;
  end_line: number;  // -1 = ファイル末尾まで
}

/**
 * 会話/編集セッション情報
 */
export interface Conversation {
  /** 貢献者タイプ */
  contributor_type: ContributorType;
  /** AIモデル識別子（例: anthropic/claude-opus-4-5-20251101） */
  model?: string;
  /** 変更された行範囲 */
  ranges: TraceRange[];
  /** 会話へのリンク（オプション、機密の場合は省略可） */
  context_url?: string;
  /** 説明/メモ */
  description?: string;
}

/**
 * ファイルごとのトレース情報
 */
export interface FileTrace {
  /** リポジトリルートからの相対パス */
  path: string;
  /** このファイルに対する会話/編集のリスト */
  conversations: Conversation[];
}

/**
 * VCS（バージョン管理システム）情報
 */
export interface VcsInfo {
  type: 'git' | 'jj' | 'hg' | 'svn';
  commit?: string;
  branch?: string;
}

/**
 * ツール情報
 */
export interface ToolInfo {
  name: string;
  version: string;
}

/**
 * TAISUN Agent固有のメタデータ
 */
export interface TaisunMetadata {
  /** 使用されたスキル */
  skill_used?: string;
  /** 使用されたエージェント */
  agent_id?: string;
  /** ワークフローフェーズ */
  workflow_phase?: string;
  /** セッションID */
  session_id?: string;
}

/**
 * Agent Trace Record（メインのデータ構造）
 */
export interface TraceRecord {
  /** 仕様バージョン */
  version: string;
  /** 一意識別子（UUID） */
  id: string;
  /** RFC 3339形式のタイムスタンプ */
  timestamp: string;
  /** ファイルごとのトレース情報 */
  files: FileTrace[];
  /** VCS情報（オプション） */
  vcs?: VcsInfo;
  /** ツール情報 */
  tool?: ToolInfo;
  /** ベンダー固有のメタデータ */
  metadata?: {
    'dev.taisun'?: TaisunMetadata;
    [key: string]: unknown;
  };
}

// ============================================
// TraceStore Class
// ============================================

/**
 * Agent Traceストレージクラス
 *
 * トレースレコードの作成、保存、読み込みを管理
 */
export class TraceStore {
  private projectRoot: string;
  private traceDir: string;
  private readonly SPEC_VERSION = '0.1.0';
  private readonly TOOL_NAME = 'taisun-agent';

  /**
   * @param projectRoot プロジェクトルートディレクトリ
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.traceDir = path.join(projectRoot, '.agent-trace', 'traces');
    this.ensureDir();
  }

  /**
   * トレースディレクトリを作成
   */
  private ensureDir(): void {
    if (!fs.existsSync(this.traceDir)) {
      fs.mkdirSync(this.traceDir, { recursive: true });
    }
  }

  /**
   * UUIDを生成
   */
  private generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * 現在のGitコミットハッシュを取得
   */
  private getGitCommit(): string | undefined {
    try {
      const gitDir = path.join(this.projectRoot, '.git');
      if (!fs.existsSync(gitDir)) return undefined;

      const headPath = path.join(gitDir, 'HEAD');
      const headContent = fs.readFileSync(headPath, 'utf-8').trim();

      if (headContent.startsWith('ref: ')) {
        const refPath = path.join(gitDir, headContent.slice(5));
        if (fs.existsSync(refPath)) {
          return fs.readFileSync(refPath, 'utf-8').trim().slice(0, 40);
        }
      }
      return headContent.slice(0, 40);
    } catch {
      return undefined;
    }
  }

  /**
   * 現在のGitブランチ名を取得
   */
  private getGitBranch(): string | undefined {
    try {
      const gitDir = path.join(this.projectRoot, '.git');
      const headPath = path.join(gitDir, 'HEAD');
      const headContent = fs.readFileSync(headPath, 'utf-8').trim();

      if (headContent.startsWith('ref: refs/heads/')) {
        return headContent.slice('ref: refs/heads/'.length);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * TAISUNバージョンを取得
   */
  private getTaisunVersion(): string {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        return pkg.version || '2.10.1';
      }
    } catch {
      // ignore
    }
    return process.env.TAISUN_VERSION || '2.10.1';
  }

  /**
   * 新しいトレースレコードを作成
   *
   * @param files ファイルトレース情報
   * @param taisunMeta TAISUN固有のメタデータ
   * @returns トレースレコード
   */
  createTrace(files: FileTrace[], taisunMeta?: TaisunMetadata): TraceRecord {
    const trace: TraceRecord = {
      version: this.SPEC_VERSION,
      id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      files,
      vcs: {
        type: 'git',
        commit: this.getGitCommit(),
        branch: this.getGitBranch()
      },
      tool: {
        name: this.TOOL_NAME,
        version: this.getTaisunVersion()
      },
      metadata: {
        'dev.taisun': taisunMeta || {}
      }
    };

    // VCS情報がない場合は削除
    if (!trace.vcs?.commit) {
      delete trace.vcs;
    }

    return trace;
  }

  /**
   * 単一ファイルの編集トレースを作成（ヘルパー）
   *
   * @param filePath 編集されたファイルのパス
   * @param contributorType 貢献者タイプ
   * @param model 使用されたAIモデル
   * @param description 説明
   * @param taisunMeta TAISUN固有のメタデータ
   */
  createFileEditTrace(
    filePath: string,
    contributorType: ContributorType = 'ai',
    model: string = 'anthropic/claude-opus-4-5-20251101',
    description?: string,
    taisunMeta?: TaisunMetadata
  ): TraceRecord {
    const relativePath = path.isAbsolute(filePath)
      ? path.relative(this.projectRoot, filePath)
      : filePath;

    const files: FileTrace[] = [{
      path: relativePath,
      conversations: [{
        contributor_type: contributorType,
        model,
        ranges: [{ start_line: 1, end_line: -1 }],
        description
      }]
    }];

    return this.createTrace(files, taisunMeta);
  }

  /**
   * トレースレコードをファイルに保存
   *
   * @param trace 保存するトレースレコード
   * @returns 保存先のファイルパス
   */
  save(trace: TraceRecord): string {
    const date = trace.timestamp.split('T')[0];
    const shortId = trace.id.slice(0, 8);
    const filename = `${date}_${shortId}.json`;
    const filepath = path.join(this.traceDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(trace, null, 2), 'utf-8');
    return filepath;
  }

  /**
   * トレースを作成して即座に保存（ヘルパー）
   */
  saveFileEditTrace(
    filePath: string,
    contributorType: ContributorType = 'ai',
    model?: string,
    description?: string,
    taisunMeta?: TaisunMetadata
  ): string {
    const trace = this.createFileEditTrace(
      filePath,
      contributorType,
      model,
      description,
      taisunMeta
    );
    return this.save(trace);
  }

  /**
   * 全トレースレコードを取得
   *
   * @param limit 取得する最大件数（0 = 無制限）
   * @returns トレースレコードの配列（新しい順）
   */
  list(limit: number = 0): TraceRecord[] {
    if (!fs.existsSync(this.traceDir)) {
      return [];
    }

    const files = fs.readdirSync(this.traceDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    const targetFiles = limit > 0 ? files.slice(0, limit) : files;

    return targetFiles.map(f => {
      const content = fs.readFileSync(path.join(this.traceDir, f), 'utf-8');
      return JSON.parse(content) as TraceRecord;
    });
  }

  /**
   * 特定のファイルに関連するトレースを検索
   *
   * @param filePath 検索するファイルパス
   * @returns 該当するトレースレコードの配列
   */
  findByFile(filePath: string): TraceRecord[] {
    const relativePath = path.isAbsolute(filePath)
      ? path.relative(this.projectRoot, filePath)
      : filePath;

    return this.list().filter(trace =>
      trace.files.some(f => f.path === relativePath)
    );
  }

  /**
   * 日付範囲でトレースを検索
   *
   * @param startDate 開始日（YYYY-MM-DD）
   * @param endDate 終了日（YYYY-MM-DD）
   */
  findByDateRange(startDate: string, endDate: string): TraceRecord[] {
    return this.list().filter(trace => {
      const date = trace.timestamp.split('T')[0];
      return date >= startDate && date <= endDate;
    });
  }

  /**
   * 貢献者タイプ別の統計を取得
   */
  getStatistics(): {
    total: number;
    byContributorType: Record<ContributorType, number>;
    byModel: Record<string, number>;
    byDate: Record<string, number>;
  } {
    const traces = this.list();

    const stats = {
      total: traces.length,
      byContributorType: { human: 0, ai: 0, mixed: 0, unknown: 0 } as Record<ContributorType, number>,
      byModel: {} as Record<string, number>,
      byDate: {} as Record<string, number>
    };

    for (const trace of traces) {
      const date = trace.timestamp.split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;

      for (const file of trace.files) {
        for (const conv of file.conversations) {
          stats.byContributorType[conv.contributor_type]++;
          if (conv.model) {
            stats.byModel[conv.model] = (stats.byModel[conv.model] || 0) + 1;
          }
        }
      }
    }

    return stats;
  }

  /**
   * 古いトレースをアーカイブ
   *
   * @param daysToKeep 保持する日数
   * @returns アーカイブされたファイル数
   */
  archive(daysToKeep: number = 30): number {
    const archiveDir = path.join(this.projectRoot, '.agent-trace', 'archive');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    let archivedCount = 0;
    const files = fs.readdirSync(this.traceDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const date = file.split('_')[0];
      if (date < cutoffStr) {
        const src = path.join(this.traceDir, file);
        const dest = path.join(archiveDir, file);
        fs.renameSync(src, dest);
        archivedCount++;
      }
    }

    return archivedCount;
  }

  /**
   * トレースディレクトリのパスを取得
   */
  getTraceDir(): string {
    return this.traceDir;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * デフォルトのTraceStoreインスタンスを取得
 */
export function getDefaultTraceStore(): TraceStore {
  const projectRoot = process.cwd();
  return new TraceStore(projectRoot);
}

/**
 * 簡易的なトレース保存（ワンライナー用）
 */
export function quickTrace(
  filePath: string,
  description?: string
): string {
  const store = getDefaultTraceStore();
  return store.saveFileEditTrace(filePath, 'ai', undefined, description);
}

// CommonJS互換のエクスポート
module.exports = { TraceStore, getDefaultTraceStore, quickTrace };
