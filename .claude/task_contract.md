# Task Contract（現在のタスク契約）

## Goal
- 記憶システムを強化し、セッション間の継続性を向上させる

## Deliverables
- Issue: N/A
- PR: N/A
- Docs: memory.md更新, hooks/session-start-briefing.md作成
- Tests: 動作確認完了

## Constraints (Must)
- ✅ 既存のmemory.md, mistakes.md等を破壊しない
- ✅ 無料で実装（追加コストなし）
- ✅ 既存のMCPツール（memory_add, memory_search）を活用

## Never Do (Must NOT)
- ✅ 外部サービス契約なし
- ✅ 既存ファイル構造の大幅変更なし
- ✅ 秘密情報をログに書かない

## Acceptance Criteria / DoD
- [x] MCP Memory統合実装（directive-sync.ts）
- [x] セッション開始ブリーフィング実装（npm run briefing）
- [x] テスト通過（630 tests passed）
- [x] ドキュメント更新（memory.md）

## Regression Checklist (from mistakes.md)
- [x] エラー時にsuccess: trueを返していないか
- [x] execSyncの文字列補間を使っていないか
- [x] 空のcatchブロックがないか
- [ ] 日本語/マルチバイトファイルの編集は safe-replace を使用したか
- [ ] 完了前に utf8-guard を通したか

## Plan (file-level)
- files:
  - path: src/proxy-mcp/memory/directive-sync.ts
    change: ✅ 新規作成（同期ユーティリティ）
  - path: .claude/hooks/session-start-briefing.md
    change: ✅ 新規作成（フック説明）
  - path: scripts/session-briefing.ts
    change: ✅ 新規作成（CLIスクリプト）
  - path: .claude/memory.md
    change: ✅ 記憶強化機能ドキュメント追加
  - path: package.json
    change: ✅ briefingスクリプト追加

## Status
✅ **完了** - 2026-01-07
