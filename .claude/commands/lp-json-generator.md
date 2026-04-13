# LP JSON Generator コマンド

参考画像のデザインスタイルを維持しながら、テキストのみを変更したLP画像を生成。

## 使用方法

```
/lp-json-generator [参考画像パス] [出力パス]
```

## 引数

| 引数 | 必須 | 説明 |
|-----|------|------|
| 参考画像パス | いいえ | 参考にする画像のパス |
| 出力パス | いいえ | 出力先（デフォルト: output/lp_generated.png） |

## 実行フロー

1. **参考画像の分析**
   - 参考画像をJSON形式で構造化
   - レイアウト、色、フォント、装飾を抽出

2. **テキスト変更**
   - ユーザーから新しいテキスト内容を取得
   - JSONの`text`プロパティのみ更新

3. **画像生成**
   - NanoBanana Pro（Gemini Imagen 3）で生成
   - JSONプロンプトで正確なデザインを指示

## 依存スキル

- `nanobanana-pro` - 画像生成基盤（要認証）

## 事前準備

```bash
# NanoBanana Proの認証（初回のみ）
cd .claude/skills/nanobanana-pro
python3 scripts/run.py auth_manager.py setup
```

## 使用例

### 例1: 対話形式
```
/lp-json-generator

→ 「参考画像のパスを教えてください」
→ 「変更したいテキスト内容を教えてください」
→ 画像生成
```

### 例2: テンプレートから
```
/lp-json-generator --template 7years_silence

→ templates/7years_silence.json を使用して生成
```

## テンプレート一覧

| テンプレート | 説明 |
|-------------|------|
| `basic_lp` | 汎用テンプレート |
| `7years_silence` | 「7年間の沈黙」用 |

## 関連ファイル

- `.claude/skills/lp-json-generator/SKILL.md` - スキル定義
- `.claude/skills/lp-json-generator/WORKFLOW.md` - ワークフロー解説
- `.claude/skills/lp-json-generator/templates/` - JSONテンプレート

## トラブルシューティング

| 問題 | 解決方法 |
|------|----------|
| 認証エラー | `auth_manager.py setup` で再認証 |
| タイムアウト | `--timeout 300` で延長 |
| テキスト崩れ | JSONを簡略化して再試行 |
