---
description: OpenCode Ralph Loop - 反復開発支援（opt-in、既定OFF、乱用禁止）
---

OpenCode の Ralph Loop を使った反復開発（Red-Green-Refactor）を支援します。
**既定では無効（disabled）** で、必要な時だけ明示的に有効化します。

Task description: $ARGUMENTS

## ⚠️ 重要な前提条件

### Ralph Loop とは

Ralph Loop は **自動反復実行フック** で、以下の特徴があります：
- テスト駆動開発（TDD）の Red-Green-Refactor サイクルを自動化
- 指定された条件（completion promise）を満たすまで反復
- 最大反復回数の上限設定が必須

### 既定状態：OFF（無効）

`.opencode/oh-my-opencode.json` の既定設定：
```json
{
  "ralph_loop": {
    "enabled": false,
    "default_max_iterations": 30,
    "state_dir": ".opencode/"
  }
}
```

**enabled: false** により、**勝手に起動しません**。

## 使用前チェック

以下の条件を **すべて** 満たす場合のみ使用してください：

1. ✅ **仕様が明確に固まっている**
   - 曖昧な要件での使用は避ける
   - 完了条件（completion promise）が明確

2. ✅ **反復可能なタスク**
   - テスト駆動開発に適した作業
   - 機械的な繰り返しで改善できる内容

3. ✅ **上限設定が可能**
   - 最大反復回数を合理的に設定できる
   - 無限ループにならない保証

4. ✅ **コスト許容範囲内**
   - API コストが許容範囲内
   - 実行時間が許容範囲内

## Ralph Loop 実行手順

### 1. 一時的に有効化

**プロジェクト設定を一時的に変更**（終了後に戻すこと）：

```json
{
  "ralph_loop": {
    "enabled": true,
    "default_max_iterations": 10,  // 少なめから開始
    "state_dir": ".opencode/"
  }
}
```

### 2. ディレクトリ準備

```bash
mkdir -p .opencode/state
mkdir -p .opencode/runs
```

### 3. Ralph Loop 実行

```bash
# OMO の ralph-loop コマンドを使用
# --max-iterations: 上限設定（必須）
# --completion-promise: 完了条件（必須）

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

opencode /ralph-loop "Implement feature X with full test coverage" \
  --max-iterations=10 \
  --completion-promise="All tests pass and coverage > 80%" \
  > .opencode/runs/ralph_${TIMESTAMP}.log 2>&1
```

### 4. 実行監視

```bash
# ログをリアルタイムで監視
tail -f .opencode/runs/ralph_${TIMESTAMP}.log

# 状態ファイル確認
ls -la .opencode/state/
```

### 5. ログ退避（memory_add）

```typescript
// 実行完了後、ログを memory_add に退避
const logPath = `.opencode/runs/ralph_${TIMESTAMP}.log`;
const result = await memory_add(undefined, 'short-term', {
  contentPath: logPath,
  metadata: {
    type: 'ralph-loop-log',
    taskDescription: 'Implement feature X',
    maxIterations: 10,
    timestamp: new Date().toISOString()
  }
});

const refId = result.referenceId;
```

### 6. 設定を元に戻す

**重要**: 使用後は必ず無効化：

```json
{
  "ralph_loop": {
    "enabled": false,  // 元に戻す
    "default_max_iterations": 30,
    "state_dir": ".opencode/"
  }
}
```

## 結果の投稿

**会話/Issueには要約のみ**：

```markdown
## Ralph Loop 実行結果

### 実行情報
- Task: Implement feature X with full test coverage
- Max iterations: 10
- Actual iterations: 7 （完了条件達成）
- Execution time: 15分

### 完了条件
- [x] All tests pass
- [x] Coverage > 80%
- [x] Lint通過
- [x] Type check通過

### 詳細ログ
ログは memory_add に保存しました。
参照ID: `${refId}`

### 生成ファイル
- src/feature-x.ts
- tests/feature-x.test.ts
- docs/feature-x.md
```

## 禁止事項（乱用防止）

以下の使用は **禁止** です：

❌ **無制限実行** - 必ず max-iterations を設定
❌ **曖昧な仕様** - completion-promise が不明確な場合
❌ **常時有効化** - 使用後は必ず無効化
❌ **コスト無視** - API コストを考慮しない実行
❌ **大量ログの投稿** - 会話/Issueに全文を貼る

## トラブルシューティング

### ループが止まらない
- `Ctrl+C` で強制終了
- max-iterations を小さい値に設定し直す
- completion-promise を見直す

### コストが膨らむ
- max-iterations を減らす
- より小さい単位のタスクに分割
- 通常の開発方法に戻す

### 期待した結果にならない
- completion-promise が曖昧な可能性
- タスクが反復開発に不向き
- 通常のバグ修正（/opencode-fix）を検討

## 推奨運用

1. **最初は小さく** - max-iterations=5 から開始
2. **監視しながら** - ログを tail -f で確認
3. **使用後は無効化** - enabled: false に戻す
4. **ログは退避** - memory_add(content_path) で保存
5. **要約のみ投稿** - refId 運用を徹底

Output Ralph Loop execution summary with refId for detailed logs, ensuring opt-in usage and cost control.
