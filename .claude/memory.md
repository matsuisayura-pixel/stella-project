# Project Memory（長期記憶）

このファイルには「長期に効く不変のルール」のみを記載します。
タスク固有の情報は task_contract.md や running_summary.md に記載します。

---

## アーキテクチャルール

### Proxy-Only
- すべての外部MCP通信は `taisun-proxy` 経由で行う
- Claude Desktop からは単一エンドポイントのみ公開
- 内部MCPサーバーは直接公開しない

### 遅延ロード（Lazy Loading）
- 重いモジュールは必要になるまでロードしない
- オプショナル依存はtry-catchでガード
- 起動時間を最小化する

### 出力外部化
- 大量の出力は会話に垂れ流さない
- ファイルに書き出して参照を渡す
- artifacts/ ディレクトリを活用

---

## セキュリティルール

### コマンド実行
- execSync の文字列補間は禁止
- spawnSync + 配列引数を使用
- ユーザー入力は必ずサニタイズ

### ネットワーク
- デフォルトは deny（最小権限）
- ワイルドカード許可は禁止
- localhost バインドが基本

### 秘密情報
- トークン・パスワードをログに書かない
- 環境変数経由で注入
- .gitignore で除外

---

## 品質ルール

### エラーハンドリング
- 空の catch ブロックは禁止
- 最低でも debug レベルでログ
- エラー状態を正確に報告（success: true の誤用禁止）

### テスト
- 変更にはテストを付ける
- カバレッジ 80% 以上を目標
- Critical/High 脆弱性はゼロ

### ドキュメント
- Issue/RUNLOG は日本語
- コード識別子・パスは英語可
- 秘密情報は絶対に含めない

---

## Issue運用ルール

### ログ形式
```markdown
## 概要
...

## 作成リソース
- Issue: #xxx
- PR: #xxx
- Branch: feature/xxx

## 実装内容
...

## テスト結果
...

## 次のステップ
...
```

### ラベル
- `approval-required`: 人間承認が必要
- `bug`: バグ修正
- `feature`: 新機能
- `docs`: ドキュメント

---

## 記憶強化機能

### セッション開始ブリーフィング
新しいセッション開始時に自動表示される情報:
1. 現在の状態（running_summary.md）
2. 現在のタスク契約（task_contract.md）
3. 再発防止リマインダー（mistakes.md）
4. 重要ルール

実行方法:
```bash
npm run briefing        # ブリーフィング表示
npm run briefing:sync   # Memory同期も実行
```

### MCP Memory統合
- directives.md, mistakes.md等をMemoryServiceに同期
- セマンティック検索が可能
- タグベースのフィルタリング

### 関連ファイル
- `src/proxy-mcp/memory/directive-sync.ts` - 同期ユーティリティ
- `.claude/hooks/session-start-briefing.md` - フック説明
- `scripts/session-briefing.ts` - CLIスクリプト

---

---

## Memory++ (v1.1)

### ピン留め（pins.md）
- 「ここを修正して」の"ここ"を固定
- ファイル/関数/行レベルで範囲を指定
- 解除条件が満たされるまでアクティブ

### トレーサビリティ（traceability.yml）
- DoD→変更→テスト→証跡の対応表
- 自動生成・更新
- Issue/RUNLOGに要約を添付

### 契約Lint（contract:lint）
- proxy-only / 日本語既定 / secrets非露出を自動検証
- CIゲートとして使用
- 違反があればビルド失敗

### 回帰テスト生成（mistake:testgen）
- mistakes.md から tests/regression/ にテスト生成
- 再発防止を機械的に担保

### コマンド
```bash
npm run contract:lint    # 契約/ルール違反チェック
npm run mistake:testgen  # 回帰テスト生成
npm run quality:check    # 全品質チェック
```

---

## 変更履歴
- 2026-01-07: Memory++ v1.1 追加（pins, traceability, contract-lint, mistake-to-test）
- 2026-01-07: 記憶強化機能追加（MCP Memory統合、セッション開始ブリーフィング）
- 2026-01-07: 初版作成（Master Prompt Framework導入）
