#!/usr/bin/env node
/**
 * Context Monitor Hook - Phase 3統合版
 *
 * コンテキスト使用率を自動監視し、自動保存システムと連携
 */

const fs = require('fs');
const path = require('path');

const CONTEXT_THRESHOLDS = {
  WARNING: 70,        // 70% - 警告のみ
  STRONG_WARNING: 80, // 80% - 強い警告 + /compact提案
  CONFIRM_COMPACT: 85, // 85% - 確認ダイアログ後にcompact
  FORCE_COMPACT: 90    // 90% - 強制compact（クラッシュ防止）
};

const FILE_SIZE_THRESHOLDS = {
  SMALL: 5 * 1024,      // 5KB - 直接出力OK
  MEDIUM: 20 * 1024,    // 20KB - 要検討
  LARGE: 50 * 1024      // 50KB - 自動保存推奨
};

/**
 * コンテキスト使用率をチェック
 */
async function checkContextUsage() {
  try {
    // Claude Codeのコンテキスト情報を環境変数から取得（利用可能な場合）
    const contextUsage = parseFloat(process.env.CLAUDE_CONTEXT_USAGE || '0');

    if (contextUsage > 0) {
      return {
        percentage: contextUsage,
        threshold: getThresholdLevel(contextUsage)
      };
    }

    // 環境変数がない場合は推定値を返す
    return estimateContextUsage();
  } catch (error) {
    return null;
  }
}

/**
 * 閾値レベルを判定（安全設計版）
 */
function getThresholdLevel(percentage) {
  if (percentage >= CONTEXT_THRESHOLDS.FORCE_COMPACT) {
    return 'FORCE_COMPACT';     // 90%: 強制compact
  } else if (percentage >= CONTEXT_THRESHOLDS.CONFIRM_COMPACT) {
    return 'CONFIRM_COMPACT';   // 85%: 確認付きcompact
  } else if (percentage >= CONTEXT_THRESHOLDS.STRONG_WARNING) {
    return 'STRONG_WARNING';    // 80%: 強い警告
  } else if (percentage >= CONTEXT_THRESHOLDS.WARNING) {
    return 'WARNING';           // 70%: 警告のみ
  }
  return 'OK';
}

/**
 * コンテキスト使用率を推定
 */
function estimateContextUsage() {
  try {
    // 会話履歴ファイルのサイズから推定（概算）
    const conversationFile = path.join(process.cwd(), '.claude/temp/conversation-history.json');

    if (fs.existsSync(conversationFile)) {
      const stats = fs.statSync(conversationFile);
      const sizeInMB = stats.size / (1024 * 1024);

      // 概算: 1MB ≈ 10%のコンテキスト使用率
      const estimatedPercentage = Math.min(sizeInMB * 10, 100);

      return {
        percentage: estimatedPercentage,
        threshold: getThresholdLevel(estimatedPercentage),
        estimated: true
      };
    }
  } catch (error) {
    // Ignore
  }

  return {
    percentage: 0,
    threshold: 'OK',
    estimated: true
  };
}

/**
 * 警告メッセージを表示（安全設計版）
 */
function suggestCompact(usage) {
  if (usage.threshold === 'FORCE_COMPACT') {
    console.log('\n🆘 FORCE COMPACT: コンテキスト使用率 ' + usage.percentage.toFixed(1) + '%');
    console.log('   ⚠️  クラッシュ防止のため、自動compactを実行します');
    console.log('   💡 /compact を今すぐ実行してください\n');
  } else if (usage.threshold === 'CONFIRM_COMPACT') {
    console.log('\n🚨 CONFIRM COMPACT: コンテキスト使用率 ' + usage.percentage.toFixed(1) + '%');
    console.log('   ⚠️  危険レベル - compact推奨');
    console.log('   💡 /compact を実行することを推奨します\n');
  } else if (usage.threshold === 'STRONG_WARNING') {
    console.log('\n🔶 STRONG WARNING: コンテキスト使用率 ' + usage.percentage.toFixed(1) + '%');
    console.log('   ⚠️  高負荷レベル');
    console.log('   💡 /compact を実行することを検討してください\n');
  } else if (usage.threshold === 'WARNING') {
    console.log('\n⚠️  WARNING: コンテキスト使用率 ' + usage.percentage.toFixed(1) + '%');
    console.log('   📊 現在は問題ありませんが、監視中です\n');
  }
}

/**
 * ファイルサイズをチェック
 */
function checkFileSize(filePath, contentSize) {
  const sizeKB = Math.round(contentSize / 1024);

  if (contentSize >= FILE_SIZE_THRESHOLDS.LARGE) {
    console.log('\n📁 大きなファイル (' + sizeKB + 'KB)');
    console.log('   ✅ Phase 3自動保存が有効');
    console.log('   💾 このファイルは自動的に保存されます\n');
    return 'auto-save';
  } else if (contentSize >= FILE_SIZE_THRESHOLDS.MEDIUM) {
    console.log('\n📄 中規模ファイル (' + sizeKB + 'KB)');
    console.log('   💡 Phase 3自動保存により最適化されます\n');
    return 'optimized';
  }

  return 'ok';
}

/**
 * Phase 3統計を表示
 */
function showPhase3Status() {
  try {
    const statsFile = path.join(process.cwd(), '.claude/temp/memory-stats.json');

    if (fs.existsSync(statsFile)) {
      const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));

      if (stats.totalSaved > 0) {
        console.log('\n✨ Phase 3 スーパーメモリー');
        console.log('   保存回数: ' + stats.totalSaved + '回');
        console.log('   節約: ' + (stats.contextSaved / 1000).toFixed(1) + 'k トークン');
        console.log('   削減: $' + stats.costSaved.toFixed(4) + '\n');
      }
    }
  } catch (error) {
    // Ignore
  }
}

/**
 * メイン処理
 */
async function main() {
  const command = process.argv[2] || 'check';

  if (command === 'check') {
    const usage = await checkContextUsage();
    if (usage && usage.percentage > CONTEXT_THRESHOLDS.WARNING) {
      suggestCompact(usage);
    }
    showPhase3Status();
  } else if (command === 'status') {
    showPhase3Status();
  }
}

// エクスポート
module.exports = {
  checkContextUsage,
  suggestCompact,
  checkFileSize,
  showPhase3Status,
  CONTEXT_THRESHOLDS,
  FILE_SIZE_THRESHOLDS
};

// 直接実行時
if (require.main === module) {
  main().catch(console.error);
}
