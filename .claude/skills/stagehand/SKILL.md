# Stagehand MCP スキル

## 概要

Stagehand は AI+確定的ハイブリッドブラウザ自動操作ツール。自然言語でフォーム入力・ボタン操作・書き込みができる。
Browserbase社製（TypeScript/MIT）、v3でCDP直接実装に移行、auto-cachingで2回目以降はLLM不要で高速再実行。

## 事前準備

1. `.env` に以下を設定:
   ```
   BROWSERBASE_API_KEY=bb_live_xxx
   BROWSERBASE_PROJECT_ID=xxx-xxx-xxx
   ```
2. `.mcp.json` の `stagehand` エントリが `disabled: false` であること

## 主要ツール（Stagehand MCPが提供）

| ツール | 説明 | 使用例 |
|--------|------|--------|
| `stagehand_act` | 自然言語でページを操作 | 「送信ボタンをクリック」「フォームに入力」 |
| `stagehand_extract` | ページからデータを抽出 | 「価格一覧を取得」「テーブルのデータを取得」 |
| `stagehand_observe` | ページの操作可能要素を確認 | 「クリックできる要素を一覧で」 |
| `stagehand_navigate` | URLへ移動 | サイトを開く |
| `stagehand_screenshot` | スクリーンショット取得 | 現在の画面を確認 |

## 利用パターン

### フォーム送信

```
1. stagehand_navigate で対象URLを開く
2. stagehand_observe で入力フィールドを確認（省略可）
3. stagehand_act で「氏名フィールドに"山田太郎"を入力」
4. stagehand_act で「送信ボタンをクリック」
5. stagehand_extract で結果を取得（必要に応じて）
```

### データ抽出

```
1. stagehand_navigate で対象URLを開く
2. stagehand_extract で「商品名と価格の一覧を取得」
```

### ログイン（2FAなし）

```
1. stagehand_navigate でログインページを開く
2. stagehand_act で「メールアドレスフィールドに入力」
3. stagehand_act で「パスワードフィールドに入力」
4. stagehand_act で「ログインボタンをクリック」
```

## vs 他ツール

| ケース | 推奨ツール |
|--------|------------|
| 静的ページのコンテンツ取得 | Firecrawl MCP (L1) |
| ログイン・スクリーンショット（セレクタ既知） | Playwright MCP (L2) |
| 自然言語フォーム入力・動的サイト操作 | **Stagehand MCP (L3)** ← このスキル |
| 2FA/CAPTCHA対応業務システム | Skyvern MCP (L4) |

## auto-caching について

- 一度成功した操作のセレクタをキャッシュ
- 同じサイトへの2回目以降はLLM呼び出しなしで高速実行
- サイトのレイアウト変更時は自動で再学習

## コスト目安

- Browserbase: セッション時間 × 課金。Hobby枠は月間無料時間あり
- LLM: act/extract時にClaude APIを呼び出す（auto-caching後は不要）

## トラブルシューティング

| エラー | 対処 |
|--------|------|
| APIキーエラー | `.env`の`BROWSERBASE_API_KEY`/`BROWSERBASE_PROJECT_ID`を確認 |
| セッションタイムアウト | Browserbaseダッシュボードでセッション状況を確認 |
| 要素が見つからない | `stagehand_observe`で操作可能要素を先に確認 |
| 2FA/CAPTCHAが必要 | Skyvern MCPに切り替え |

## 参考

- Stagehand GitHub: https://github.com/browserbase/stagehand
- Browserbase ダッシュボード: https://www.browserbase.com/
- MCP Server ドキュメント: https://docs.stagehand.dev/v3/integrations/mcp/introduction
