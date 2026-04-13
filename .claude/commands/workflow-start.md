---
description: ワークフロー開始 - 状態管理による段階的タスク実行
---

ワークフローを開始します。Phase 0-8等の複雑なタスクを段階的に進めます。

Arguments: $ARGUMENTS (workflowId --strict)

## 使い方

```bash
# 動画生成ワークフロー開始
npm run workflow:start -- video_generation_v1

# strict mode で開始（Phase 2で強制機能追加予定）
npm run workflow:start -- video_generation_v1 --strict
```

## 利用可能なワークフロー

- `video_generation_v1`: 動画生成ワークフロー（Phase 0-8）

## 開始後の流れ

1. `npm run workflow:status` - 現在の状態確認
2. 現在フェーズの作業を実施
3. `npm run workflow:next` - 次のフェーズへ進む
4. 繰り返し
5. `npm run workflow:verify` - 完了確認

Start workflow with state management for complex multi-phase tasks.
