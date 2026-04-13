# Session Start Briefing Hook

## 概要
新しいセッション開始時に、以下の情報を自動的に提示するフック。

## 実行タイミング
- 新規セッション開始時
- `/briefing` コマンド実行時

## 提示内容

### 1. 現在の状態（running_summary.md より）
- 最終更新日時
- 現在のタスク
- 状態（完了/進行中/待機中）

### 2. 現在のタスク契約（task_contract.md より）
- Goal
- 未完了のDoD項目

### 3. 再発防止リマインダー（mistakes.md より）
- 直近3件のミスパターン
- 関連する注意事項

### 4. 重要ルール（memory.md より）
- Proxy-Only
- 最小差分
- No-Guessing
- 日本語優先

## 使用方法

### 自動実行
settings.json で有効化:
```json
{
  "hooks": {
    "sessionStart": {
      "briefing": true
    }
  }
}
```

### 手動実行
```
「ブリーフィングを表示して」
「現在の状態を確認」
「セッション情報を見せて」
```

### プログラム実行
```typescript
import { getSessionBriefing } from './src/proxy-mcp/memory/directive-sync';

const briefing = await getSessionBriefing();
console.log(briefing);
```

## 出力例

```markdown
# セッション開始ブリーフィング

## 現在の状態
- **最終更新**: 2026-01-07 16:35 JST
- **現在のタスク**: Memory Enhancement
- **状態**: 進行中

## 現在のタスク
**Goal**: 記憶システムを強化し、セッション間の継続性を向上させる

**未完了のDoD**:
- [ ] MCP Memory統合実装
- [ ] セッション開始ブリーフィング実装

## 再発防止リマインダー
以下のミスを繰り返さないこと:
- ⚠️ success-true-on-error
- ⚠️ command-injection-vulnerability
- ⚠️ silent-error-catch

## 重要ルール
- Proxy-Only: 外部MCP通信はtaisun-proxy経由
- 最小差分: 勝手にリファクタしない
- No-Guessing: 既存コードを読んでから修正
- 日本語優先: Issue/RUNLOGは日本語
```
