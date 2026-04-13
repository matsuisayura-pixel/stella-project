---
description: OpenCode/OMO セットアップ確認と導入ガイド（opt-in）
---

OpenCode/OMO のセットアップ状況を確認し、必要に応じて導入手順を案内します。

Setup verification: $ARGUMENTS

## セットアップ手順

### 1. OpenCode CLI 確認

```bash
opencode --version
```

既にインストール済みの場合、バージョンが表示されます。

### 2. OpenCode CLI インストール（必要な場合のみ）

OpenCodeが未インストールの場合、公式ドキュメントを参照してインストールしてください：
https://github.com/opencodeorg/opencode

### 3. Oh My OpenCode (OMO) インストール（オプション）

OMOは拡張機能で、Ralph Loopなどの高度な機能を提供します。
導入は**opt-in（任意）**です。必要な場合のみ実行してください。

```bash
# bunx を使う場合
bunx oh-my-opencode install

# または npx を使う場合
npx oh-my-opencode install
```

**注意**: 実行前にユーザーの確認を必ず取ってください。

### 4. 認証設定

```bash
opencode auth login
```

必要なプロバイダー（Anthropic, OpenAI等）の認証を行います。

### 5. 設定ファイルの確認

設定ファイルは以下の階層で管理されます：

- **プロジェクト設定**: `.opencode/oh-my-opencode.json`
- **ユーザー設定**: `~/.config/opencode/oh-my-opencode.json`

プロジェクトには example ファイルが用意されています：
```bash
cp .opencode/oh-my-opencode.json.example .opencode/oh-my-opencode.json
```

### 6. 設定の推奨値

```json
{
  "disabled_hooks": [],
  "disabled_agents": [],
  "ralph_loop": {
    "enabled": false,
    "default_max_iterations": 30,
    "state_dir": ".opencode/"
  }
}
```

**重要**: `ralph_loop.enabled` は既定で `false` にしてください。
使う時だけ有効化する運用を推奨します。

## セットアップ完了後

セットアップが完了したら、以下のコマンドでOpenCodeを活用できます：
- `/opencode-fix` - 難しいバグ修正を依頼
- `/opencode-ralph-loop` - Ralph Loop での反復開発（必要時のみ）

## トラブルシューティング

### OpenCode が見つからない
- PATH に opencode が含まれているか確認
- 再インストールが必要な場合は公式ドキュメントを参照

### 認証エラー
- `opencode auth login` を再実行
- API キーが正しく設定されているか確認

### 設定ファイルが読み込まれない
- JSON 構文エラーがないか確認（JSONC形式も可）
- ファイルパスが正しいか確認

Output setup status and next steps for OpenCode/OMO integration.
