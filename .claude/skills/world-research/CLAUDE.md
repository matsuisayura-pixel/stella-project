# world-research v2.0 + 5API統合

全世界総合リサーチシステム。6層アーキテクチャ + 5API統合で論文からSNSまで完全網羅。

## 6層構造
- Layer 1: 学術論文（Arxiv/PwC/OpenReview/Scholar/S2/Connected Papers/DBLP/ACL）
- Layer 2: ペーパーキュレーション（HF Daily Papers/@_akhaliq/Alpha Signal/ニュースレター）
- Layer 3: テックブログ（Lil'Log/Distill/Karpathy/Raschka/Chip Huyen/企業研究ブログ）
- Layer 4: 実装エコシステム（HF Hub/awesome-*/LangChain/CrewAI/AutoGPT/MLOps）
- Layer 5: SNS（X/Reddit/YouTube/note/Bilibili/知乎/小红書/Medium/Qiita/Zenn）
- Layer 6: コミュニティ（Discord/Slack/GitHub Discussions/Stack Overflow/HN）

## 統合API（5API）
- Tavily（AI検索特化・高精度）
- SerpAPI（Google検索結果取得）
- Brave Search（広範囲Web検索）
- NewsAPI（ニュース集約）
- Perplexity（AI検索+要約）

## モード
基本: quick | standard | deep | academic | survey | ecosystem
API強化: api-quick | api-deep | api-news | api-trend

gpt-researcher統合 + 5API統合。詳細は SKILL.md を参照。

## 統合スキル
- note-research: note.com非公式API + WebSearch/WebFetchでゼロコストリサーチ

## APIキー (.env)
Tavily / SerpAPI / Brave Search / NewsAPI / Perplexity が設定済み。
.envパス: プロジェクトルート or ~/Desktop/開発2026/リサーチ専門/.env or ~/taisun_agent/.env
