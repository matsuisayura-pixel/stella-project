# プロジェクト・ステラ スキルマップ

## 今すぐ使う（Phase 0〜1）

### コンテンツ生成
| スキル | コマンド | 使いどころ |
|--------|---------|-----------|
| taiyoスタイル文章化 | `/taiyo-style` | note記事・音声の文章品質向上 |
| タイトル生成 | `/taiyo-style-headline` | 記事・動画タイトル12パターン |
| 品質スコアリング | `/taiyo-analyzer` | 生成後の自動採点・改善 |
| note記事設計 | `/note-marketing` | 記事構成・ファネル |
| ストーリー構成 | `/story-pattern-inner-conflict` | 音声スクリプトの物語化 |

### リサーチ
| スキル | コマンド | 使いどころ |
|--------|---------|-----------|
| noteトレンド分析 | `/note-research` | 売れ筋パターン調査 |
| キーワード抽出 | `/keyword-mega-extractor` | SEO・テーマ選定 |
| 無料リサーチ | `/research-free` | APIなしでリサーチ |

---

## 後から追加（Phase 2〜）

### 動画・音声自動化
| スキル | コマンド | 必要なもの |
|--------|---------|-----------|
| ショート動画全自動 | `/shorts-create` | Fish Audio, NanoBanana等 |
| AIアバター動画 | `/omnihuman1-video` | OmniHuman API |
| 日本語TTS | `/japanese-tts-reading` | VOICEVOX or OpenAI |

### 集客・ファネル
| スキル | コマンド | 必要なもの |
|--------|---------|-----------|
| LINE自動化 | `/line-marketing` | LINE公式アカウント |
| ファネル設計 | `/funnel-builder` | 各種ツール |
| SNS運用 | `/sns-marketing` | 各SNSアカウント |
| LP生成 | `/lp-full-generation` | Ollama（ローカルAI）|

### その他便利スキル
| スキル | コマンド | 使いどころ |
|--------|---------|-----------|
| 既存記事の改善 | `/taiyo-rewriter` | 過去コンテンツを再生 |
| Kindle出版 | `/kindle-publishing` | 電子書籍化 |
| ストーリー（遅れた救い）| `/story-pattern-delayed-rescue` | 感動系コンテンツ |
| ストーリー（欠陥ヒーロー）| `/story-pattern-flawed-hero` | 共感系コンテンツ |

---

## スキル組み合わせレシピ

### レシピA：note記事1本（フル品質版）
```
/note-research → /keyword-mega-extractor → /taiyo-style-headline
→ /note-marketing（記事生成）→ /taiyo-style（変換）→ /taiyo-analyzer（採点）
```

### レシピB：音声スクリプト1本
```
/note-marketing（構成）→ /story-pattern-inner-conflict（物語化）
→ /taiyo-style（口調変換）→ /taiyo-analyzer（採点）
```

### レシピC：過去素材の再生（将来）
```
/taiyo-rewriter（既存コンテンツを投入）→ /taiyo-analyzer（採点）
→ 各媒体に展開
```
