---
description: OpenCode バグ修正支援 - mistakes.md参照・最小差分・大出力はmemory_add
---

難しいバグ修正を OpenCode に相談し、最小差分で確実に直します。
大量のログは会話に貼らず、memory_add(content_path) で退避します。

Bug details: $ARGUMENTS

## 修正フロー

### 1. 再発防止チェックリスト作成（必須）

**最初に `.claude/mistakes.md` を参照し、過去の失敗から学びます**：

```bash
# mistakes.md を読み込む
cat .claude/mistakes.md
```

mistakes.mdから以下を抽出して「再発防止チェックリスト」を作成：
- 過去に発生した類似のバグパターン
- Prevention（予防策）として記載された項目
- 今回のバグ修正で適用すべき検証項目

**チェックリスト例**:
```markdown
## 再発防止チェックリスト

- [ ] エラーハンドリングが適切に実装されているか？
- [ ] テストケースで境界値をカバーしているか？
- [ ] 型チェックが通っているか？
- [ ] UTF-8エンコーディングの安全性は確保されているか？
- [ ] セキュリティ上の問題はないか？
```

### 2. テストログの要約取得

**全文ログは貼らない**。要約のみを取得します：

```bash
# テスト失敗の要約のみ取得
npm run test:summary

# または特定のテストのみ
npm test -- --testNamePattern="バグに関連するテスト" 2>&1 | tail -50
```

### 3. .opencode/ ディレクトリ確認

```bash
# ディレクトリが無ければ作成
mkdir -p .opencode/runs
```

### 4. OpenCode 実行とログ保存

```bash
# タイムスタンプ付きログファイルに出力
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
opencode run "Fix the following bug: <バグ詳細>" > .opencode/runs/fix_${TIMESTAMP}.log 2>&1

# 実行結果を確認
echo "OpenCode execution log saved to: .opencode/runs/fix_${TIMESTAMP}.log"
```

### 5. ログを memory_add に退避

**会話に貼らず、memory_add の content_path で保存**：

```typescript
// ログをメモリに退避
const logPath = `.opencode/runs/fix_${TIMESTAMP}.log`;
const result = await memory_add(undefined, 'short-term', {
  contentPath: logPath,
  metadata: {
    type: 'opencode-fix-log',
    bugDescription: '<バグ詳細>',
    timestamp: new Date().toISOString()
  }
});

// refId を取得
const refId = result.referenceId;
```

### 5.5. セッション記憶の回収（任意）

**OpenCode セッションを後から追えるように回収します**（OpenCode導入済みの場合のみ）：

```bash
# ディレクトリ準備
mkdir -p .opencode/exports

# 最新セッションIDを取得
SESSION_ID=$(opencode session list --max-count 1 --format json 2>/dev/null | jq -r '.[0].id' 2>/dev/null)

# セッションが取得できた場合のみエクスポート
if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  opencode export "$SESSION_ID" > .opencode/exports/session_${TIMESTAMP}.json 2>&1

  echo "Session exported to: .opencode/exports/session_${TIMESTAMP}.json"

  # セッションデータもmemory_addに退避（任意）
  # const sessionPath = `.opencode/exports/session_${TIMESTAMP}.json`;
  # const sessionResult = await memory_add(undefined, 'long-term', {
  #   contentPath: sessionPath,
  #   metadata: {
  #     type: 'opencode-session',
  #     sessionId: SESSION_ID,
  #     timestamp: new Date().toISOString()
  #   }
  # });
else
  echo "Note: OpenCode session export skipped (opencode not available or no sessions)"
fi
```

**重要な注意**:
- セッション回収は**任意機能**です
- OpenCode未導入でもエラーにしない（スキップのみ）
- export失敗でも修正フロー自体は継続可能
- セッションデータは後から解析する用途（トラブルシューティング等）

### 6. Issue/会話に投稿する内容

**大量のログは貼らない**。以下のみを投稿：

```markdown
## OpenCode バグ修正実行結果

### 再発防止チェックリスト
- [x] エラーハンドリング実装済み
- [x] 境界値テスト追加
- [x] 型チェック通過
- [x] UTF-8安全性確保
- [x] セキュリティ検証完了

### 実行サマリー
- OpenCode version: X.X.X
- Execution time: XX秒
- Status: ✅ Success / ❌ Failed
- Modified files: X件
- Tests passed: XXX/XXX

### 詳細ログ
ログは memory_add に保存しました。
参照ID: `${refId}`

必要に応じて `memory_search("${refId}")` で取得可能。

### 修正内容
- ファイル1: 変更内容の要約
- ファイル2: 変更内容の要約

### 検証
```bash
npm test
npm run lint
npm run typecheck
```
```

### 7. 最小差分で適用

OpenCode の提案を **そのままコピペせず**、以下を確認：
- 必要最小限の変更のみを適用
- 既存コードのスタイルと一貫性を保つ
- 不要な空行・コメント・フォーマット変更を避ける
- 過剰なリファクタリングをしない

### 8. 検証とテスト

```bash
# 全テスト実行
npm test

# リント確認
npm run lint

# 型チェック
npm run typecheck

# Unicode安全性チェック
npm run check:unicode
```

## 重要な注意事項

1. **mistakes.md は必ず最初に参照** - 過去の失敗を繰り返さない
2. **大量ログは memory_add(content_path)** - 会話/Issueに貼らない
3. **要約のみを投稿** - 詳細は refId で参照
4. **最小差分** - 必要な変更のみを適用
5. **再発防止チェックリスト** - 全項目を検証してから完了

Output bug fix summary with refId for detailed logs, ensuring minimal changes and regression prevention.
