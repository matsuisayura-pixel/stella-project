# Mistakes Ledger（ミス台帳）

このファイルは過去のミスと再発防止策を記録する台帳です。
失敗が起きたら必ず追記し、関連タスク開始時に参照します。

---

## CRITICAL PATTERNS TO AVOID

### Pattern 1: スキル指示の無視
```
ユーザー: 「〇〇スキルを使って作成してください」
❌ 間違い: 手動でコードを書く
✅ 正解: Skillツールで /〇〇 を呼び出す
```

### Pattern 2: 既存ファイルの無視
```
ユーザー: 「同じワークフローで動画2を作成してください」
❌ 間違い: 新しいスクリプトを作成する
✅ 正解: まず動画1のスクリプトをReadで読み、それを使用する
```

### Pattern 3: 要約比率の無視
```
ユーザー: 「80%要約で作成してください」
❌ 間違い: 「シンプルにするため30%に圧縮しました」
✅ 正解: 80%の内容を維持して要約する
```

### Pattern 4: セッション継続時の状態無視
```
状況: セッションを継続した
❌ 間違い: 前のセッションの状態を確認せずに作業開始
✅ 正解: SESSION_HANDOFF.mdを読み、既存ファイルを確認してから作業
```

---

## 2026-01-17 Mistake: skill-instruction-ignored
- **Symptom**: 「youtubeschool-creatorのスキルを使って」という指示を無視し、手動実装を行った
- **Where it happened**: 動画2-10の生成時
- **Fix**: スキル指示がある場合は必ずSkillツールを使用する
- **Prevention**:
  - [ ] スキル指示を検出したら必ずSkillツールで呼び出す
  - [ ] 手動実装は絶対禁止

---

## 2026-01-17 Mistake: workflow-instruction-ignored
- **Symptom**: 「同じワークフローで」という指示を無視し、異なるワークフローで実行した
- **Where it happened**: 動画2-10の生成時
- **Fix**: 既存スクリプト（create_video.py等）をReadツールで読んでから作業する
- **Prevention**:
  - [ ] 「同じワークフロー」指示がある場合は既存ファイルをReadする
  - [ ] 確認せずに新規作成は絶対禁止

---

## 2026-01-17 Mistake: existing-file-not-read
- **Symptom**: 動画1のcreate_video.pyを読まずに、新しいスクリプトを作成した
- **Where it happened**: 動画2-10の生成時
- **Fix**: 既存スクリプトをReadツールで確認してから作業する
- **Prevention**:
  - [ ] 既存スクリプトが存在する場合は必ずReadで確認
  - [ ] 確認せずに新規作成は絶対禁止

---

## 2026-01-17 Mistake: summary-ratio-ignored
- **Symptom**: 「80%要約」という指示を「30%に圧縮」と解釈した
- **Where it happened**: コンテンツ生成時
- **Fix**: 要約比率を厳守する
- **Prevention**:
  - [ ] 指定された要約比率を変更しない
  - [ ] 勝手な圧縮率変更は絶対禁止

---

## 2026-01-07 Mistake: success-true-on-error
- **Symptom**: オプショナル依存エラー時に `success: true` を返していた
- **Root cause**: エラーハンドリングの設計ミス。失敗を成功として報告
- **Where it happened**: `src/proxy-mcp/ops/schedule/runner.ts`
- **Fix**: `success: false, skipped: true` に変更
- **Prevention**:
  - [ ] catch ブロックで success: true を返す前に、本当に成功なのか確認する
  - [ ] オプショナル依存のエラーは skipped フラグで区別する
- **Related constraints**: エラー状態を正確に報告する

---

## 2026-01-07 Mistake: command-injection-vulnerability
- **Symptom**: execSync で文字列補間を使用、コマンドインジェクション脆弱性
- **Root cause**: シェルコマンド構築時のセキュリティ考慮不足
- **Where it happened**: `src/proxy-mcp/supervisor/github.ts` (5箇所)
- **Fix**: execSync → spawnSync + 配列引数に変更
- **Prevention**:
  - [ ] ユーザー入力をシェルコマンドに渡す際は必ず spawnSync + 配列引数を使う
  - [ ] execSync の文字列補間は禁止
- **Related constraints**: OWASP Top 10 準拠

---

## 2026-01-07 Mistake: silent-error-catch
- **Symptom**: catch ブロックでエラーを握りつぶし、デバッグ困難
- **Root cause**: エラーログの欠如
- **Where it happened**: `src/proxy-mcp/browser/cdp/session.ts`
- **Fix**: console.debug でエラーメッセージをログ出力
- **Prevention**:
  - [ ] 空の catch ブロックは禁止
  - [ ] 最低でも debug レベルでエラーをログする
- **Related constraints**: 可観測性の確保

---

## 2026-01-07 Mistake: chrome-origin-wildcard
- **Symptom**: Chrome CDP の --remote-allow-origins=* で全オリジン許可
- **Root cause**: セキュリティ設定の見落とし
- **Where it happened**: `src/proxy-mcp/browser/cdp/chrome-debug-cli.ts`
- **Fix**: localhost のみに制限
- **Prevention**:
  - [ ] ワイルドカード許可は本番環境で使わない
  - [ ] ネットワークアクセス設定はデフォルト deny
- **Related constraints**: 最小権限の原則

---

## 2026-01-07 Mistake: utf8-boundary-crash
- **Symptom**: 日本語/マルチバイト文字を含むファイルの一括置換でクラッシュ
- **Root cause**: UTF-8文字列をバイト位置でスライス/置換する処理が文字境界を考慮していない
- **Where it happened**: Claude Code内蔵の一括置換機能（外部要因のため修正不可）
- **Fix**: safe-replace.ts を使用した安全な置換に移行
- **Prevention**:
  - [ ] Claude Code内蔵の一括置換は日本語ファイルに使用禁止
  - [ ] 置換は `npm run text:safe-replace` 経由で実行
  - [ ] 完了前に `npm run text:utf8-guard` で文字化けをチェック
- **Related constraints**: 運用手順の遵守、品質ゲートの通過
- **Documentation**: `docs/operations/text-safety-ja.md`

---

## 2026-02-09 Mistake: tts-number-reading-1000man
- **Symptom**: 「1000万円」が「せんまんえん」と読まれた（正しくは「いっせんまんえん」）
- **Root cause 1**: `text_preprocessor.py` の正規表現 `(\d)?千(万|億|兆)` が漢字「千」しかマッチせず、アラビア数字「1000万」を処理できなかった
- **Root cause 2**: `text_preprocessor.py` がTTS送信時に呼び出されていなかった（前処理パイプラインが未接続）
- **Where it happened**: interactive-vsl-v2 の TTS音声生成（Fish Audio API送信前）
- **Fix**:
  - `text_preprocessor.py` を修正: `([\d,]+)(万|億|兆)` パターンで1000万/3000万/8000億等を正しく変換
  - `_number_to_reading()` メソッドを追加: 千(いっせん/さんぜん/はっせん)・百(さんびゃく/ろっぴゃく/はっぴゃく)・十の位を完全対応
- **Prevention**:
  - [ ] TTS音声生成前に **必ず** `text_preprocessor.py` で前処理を実行する
  - [ ] 「1000万」「3000億」等の数字+大単位パターンは前処理結果を目視確認する
  - [ ] Fish Audio APIにテキストを送信する前に、数字→ひらがな変換が完了していることを検証する
- **Related constraints**: SKILL.md / CLAUDE.md にTTS前処理の必須ルールを追加済み

---

## 2026-02-08 Mistake: pipeline-shortcut (パイプラインショートカット)
- **Symptom**: interactive-video-platform スキルで定義されたパイプライン（NanoBanana→agentic-vision→japanese-text-verifier→Fish Audio→Remotion）を無視し、静的 Next.js サイト + macOS say + テキスト過多画像で代替した
- **Root cause**: skill-mapping.json に interactive-video-platform のマッピングが存在せず、Layer 10（Skill Auto-Select）が発火しなかった。さらに .workflow_state.json が存在しなかったため、7/13のガードが無効化されていた
- **Where it happened**: interactive-vsl-2026 プロジェクト全体
- **Fix**: skill-mapping.json に MANDATORY マッピングを追加。mandatory_phases と mandatory_tools で各パイプラインステップを強制
- **Prevention**:
  - [ ] 新スキル作成時は必ず skill-mapping.json にマッピングを追加
  - [ ] mandatory_phases でパイプライン順序を定義
  - [ ] mandatory_tools で使用すべきツールと禁止ツールを明記

---

## 2026-02-08 Mistake: wrong-tts-engine (間違ったTTSエンジン)
- **Symptom**: Fish Audio が指定されていたのに macOS `say -v Kyoko` コマンドでTTS生成した。品質が商用レベルに達しない
- **Root cause**: workflow-fidelity-guard.js の DANGEROUS_BASH_PATTERNS に `say` コマンドが含まれておらず、検出できなかった。branch-structure.ts に Fish Audio の voiceId が定義されていたが、参照されなかった
- **Where it happened**: generate-tts.sh（macOS say ベースのTTSスクリプト）
- **Fix**: DANGEROUS_BASH_PATTERNS に `/\bsay\s+-v\b/` パターンを追加。WARN_BASH_PATTERNS で say コマンド使用時に Fish Audio を推奨する警告を追加
- **Prevention**:
  - [ ] TTS生成時は必ずスキル定義のTTSエンジンを確認
  - [ ] macOS say コマンドはプロトタイプ以外では使用禁止
  - [ ] skill-mapping.json の mandatory_tools.tts_forbidden で禁止ツールを明記

---

## 2026-02-08 Mistake: text-heavy-images (テキスト過多のAI生成画像)
- **Symptom**: AI生成画像にテキストが大量に含まれ、日本語が文字化け・破損していた。品質検証パイプライン（agentic-vision, japanese-text-verifier）が一切実行されなかった
- **Root cause**: agent-enforcement-guard.js の COMPLEX_TASK_PATTERNS に「画像生成」「品質検証」「TTS」等のマルチメディアタスクパターンがなく、専門エージェント使用を強制できなかった
- **Where it happened**: 25シーン分のAI画像生成（NanoBanana Pro）
- **Fix**: COMPLEX_TASK_PATTERNS にマルチメディア関連パターン（動画生成、VSL、TTS、画像一括生成、品質検証、OCR等）を追加
- **Prevention**:
  - [ ] AI画像生成後は必ず agentic-vision で品質スコアリング
  - [ ] 日本語テキストを含む画像は japanese-text-verifier で検証
  - [ ] 品質検証をスキップした場合はブロック

---

### Pattern 5: マルチメディアパイプラインの省略（NEW）
```
ユーザー: 「インタラクティブVSL動画を生成して」
❌ 間違い: 静的HTMLサイトで代替、macOS sayでTTS、品質検証なし
✅ 正解: interactive-video-platform スキルのフルパイプライン実行
  2a: NanoBanana Pro → 2b: agentic-vision → 2c: japanese-text-verifier → 2d: Fish Audio → 2e: Remotion
```

### Pattern 6: 低品質ツールでの代替（NEW）
```
状況: スキル定義で Fish Audio が指定されている
❌ 間違い: macOS say -v Kyoko で代替（「手軽だから」）
✅ 正解: スキル定義の mandatory_tools を確認し、指定されたツールを使用
```

---

## 2026-02-27 Mistake: skill-ignored-in-gem-prompt-creation (Gemプロンプト作成でスキル無視)
- **Symptom**: 「deep-research と genre-research スキルを参考にしてプロンプトを作成して」という指示を無視し、Claude の知識のみで 99 個の Gemini Gem プロンプト (.md ファイル) を生成した
- **Root cause**: スキル指示の確認が不十分。ユーザーが指定スキルのパスを伝える前に、すでに手動でプロンプト生成を完了してしまっていた
- **Where it happened**: gems_batch/002-100.md の生成時
- **Impact**: 自動化スクリプト (auto_create_gems.py) がすでに Gem を Gemini に登録中（最大 100 個）。リサーチなしのプロンプトが登録されている
- **Fix**: deep-research スキルを使い「Gemini Gems 効果的プロンプト 日本市場」を調査。改善版プロンプトを別途作成する
- **Prevention**:
  - [ ] プロンプト/コンテンツ生成前に必ずスキル指定の有無を確認する
  - [ ] 「〇〇スキルを参考にして」という指示はスキル指定として扱い、Skill ツールで呼び出す
  - [ ] スキルパスが示された場合は、そのスキルの SKILL.md を Read してから作業を開始する

---

## 2026-04-09 Mistake: manual-content-generation-despite-skill-guard
- **Symptom**: Skill Guard が `video-course` を必須指定しているにもかかわらず、note記事・音声スクリプトを Skill ツールを使わず手動で生成した
- **Where it happened**: `stella/content/samples/note-sample-01.md` / `voice-sample-01.md` の生成時
- **Fix**: 生成系コンテンツはスキル指示がある場合、必ず Skill ツールで実行する
- **Prevention**:
  - [ ] Skill Guard の通知を見たら即座に Skill ツールを使う
  - [ ] 「テンプレートを読んで自分で書く」は手動実装に該当する——禁止
  - [ ] スキルが完全にマッチしない場合でも、ユーザーに確認してから進む

---

*このファイルは違反検出時に自動更新されます*
