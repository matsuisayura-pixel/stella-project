---
name: world-research
description: Global SNS/academic cross-search
  全世界SNS・学術論文・コミュニティ横断キーワード検索リサーチスキル。
  【SNS層】X/Reddit/YouTube/Instagram/TikTok/note.com/Bilibili/Zhihu/小红書/WeChat/Weibo/Medium/Naver等
  【学術層】Arxiv/Papers with Code/OpenReview/Google Scholar/Semantic Scholar/Connected Papers/DBLP/ACL Anthology
  【キュレーション層】HF Daily Papers/Daily AI Papers/@_akhaliq/ML News/Alpha Signal
  【ブログ・解説層】Lil'Log/Distill/The Gradient/Jay Alammar/Karpathy/Raschka/Chip Huyen
  【実装エコシステム層】HF Smolagents/awesome-*repos/LangChain/CrewAI/AutoGPT/OpenDevin
  【コミュニティ層】r/MachineLearning/HN/Discord(Eleuther/LAION/HF)/Slack(MLOps)
  【暗号通貨・ブロックチェーン層】Glassnode/Nansen/Dune/DeFiLlama/CryptoQuant/CoinGecko/Arkham/TradingView
  【暗号通貨コミュニティ層】r/CryptoCurrency/r/Bitcoin/r/Ethereum/CoinDesk/Cointelegraph/KudasaiJP/Bankless
  【暗号通貨トレーディング層】Freqtrade/CCXT/Hummingbot/1inch/Jupiter/Whale Alert
  AIキーワードマスターリストで一括検索。gpt-researcher統合で深層調査も可能。
  トリガー: 「世界リサーチ」「SNSリサーチ」「キーワード検索」「グローバル検索」「世界中で調べて」
         「論文検索」「学術リサーチ」「ペーパーサーチ」「最新研究」「アカデミックリサーチ」
         「暗号通貨リサーチ」「クリプトリサーチ」「仮想通貨調査」「DeFi調査」「オンチェーン分析」
allowed-tools: Read, Write, Edit, Grep, Glob, WebFetch, WebSearch
---

# World Research - 全世界総合リサーチシステム v2.0

## 概要

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   WORLD RESEARCH SYSTEM v2.0                               │
│            論文 → コミュニティ → SNS 完全網羅型リサーチ                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │               AIキーワードマスターリスト                              │  │
│  │  12カテゴリ × 3言語（日本語・英語・中国語）                          │  │
│  └────────────────────────┬─────────────────────────────────────────────┘  │
│                           │                                                │
│     ┌─────────────────────┼─────────────────────────────┐                  │
│     ▼                     ▼                             ▼                  │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────────────────────┐   │
│  │ Layer 1  │  │   Layer 2      │  │  Layer 3                        │   │
│  │ 学術論文 │  │ ペーパー       │  │  テックブログ・解説              │   │
│  │ ─────── │  │ キュレーション │  │  ─────────────────              │   │
│  │ ・Arxiv  │  │ ・HF Daily     │  │  ・Lil'Log (Lilian Weng)       │   │
│  │ ・PwC    │  │ ・@_akhaliq    │  │  ・Distill.pub                 │   │
│  │ ・OpenRev│  │ ・Daily AI     │  │  ・The Gradient                │   │
│  │ ・Scholar│  │ ・Alpha Signal │  │  ・Jay Alammar                 │   │
│  │ ・S2     │  │ ・ML News      │  │  ・Andrej Karpathy             │   │
│  │ ・ConnPap│  │ ・AI News      │  │  ・Sebastian Raschka           │   │
│  │ ・DBLP   │  │               │  │  ・Chip Huyen                  │   │
│  │ ・ACL    │  │               │  │  ・Eugene Yan                  │   │
│  └────┬─────┘  └──────┬────────┘  └──────────────┬───────────────────┘   │
│       │               │                          │                        │
│     ┌─┴───────────────┴──────────────────────────┴──┐                     │
│     ▼                                               ▼                     │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────────────────────┐   │
│  │ Layer 4  │  │   Layer 5      │  │  Layer 6                        │   │
│  │ 実装     │  │   SNS          │  │  コミュニティ                    │   │
│  │ エコシス │  │   プラット     │  │  ─────────────                  │   │
│  │ ─────── │  │   フォーム     │  │  ・r/MachineLearning            │   │
│  │ ・HF Hub │  │  ─────────    │  │  ・Hacker News                  │   │
│  │ ・awesome│  │  ・X(Twitter)  │  │  ・Discord (Eleuther/LAION/HF) │   │
│  │ ・LangCh │  │  ・Reddit      │  │  ・Slack (MLOps Community)     │   │
│  │ ・CrewAI │  │  ・YouTube     │  │  ・Stack Overflow (AI tags)    │   │
│  │ ・AutoGPT│  │  ・note.com    │  │  ・GitHub Discussions           │   │
│  │ ・OpenDev│  │  ・Medium      │  │  ・Weights & Biases Community  │   │
│  │ ・CAMEL  │  │  ・Bilibili    │  │                                │   │
│  │ ・MLOps  │  │  ・知乎/小红書 │  │                                │   │
│  └────┬─────┘  └──────┬────────┘  └──────────────┬───────────────────┘   │
│       │               │                          │                        │
│       └───────────────┼──────────────────────────┘                        │
│                       ▼                                                    │
│            ┌─────────────────────┐                                         │
│            │   gpt-researcher    │                                         │
│            │   統合レイヤー      │                                         │
│            │  ・deep_research    │                                         │
│            │  ・quick_search     │                                         │
│            │  ・write_report     │                                         │
│            └──────────┬──────────┘                                         │
│                       ▼                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       出力形式                                       │  │
│  │  ・論文サーベイレポート      ・グローバルトレンドレポート             │  │
│  │  ・技術動向分析             ・プラットフォーム比較                   │  │
│  │  ・研究トラック別まとめ     ・キーワード別バズ分析                   │  │
│  │  ・引用付き学術レポート     ・実装エコシステムマップ                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ✅ APIキー不要（基本機能）    ✅ gpt-researcher統合（深層調査）          │
│  ✅ 5API統合（高精度検索強化）  ✅ 50+プラットフォーム横断                 │
│  ✅ 日英中3言語対応            ✅ 6層リサーチアーキテクチャ               │
│  ✅ 学術論文〜SNSまで完全網羅  ✅ Tavily/SerpAPI/Brave/NewsAPI/Perplexity │
└────────────────────────────────────────────────────────────────────────────┘
```

## 使い方

```bash
# 基本キーワード検索（全層横断）
/world-research キーワード=Claude Code

# 特定プラットフォーム指定
/world-research キーワード=AIエージェント プラットフォーム=X,Reddit,note

# 言語指定
/world-research キーワード=Vibe Coding 言語=en,ja,zh

# 深層調査モード（gpt-researcher統合）
/world-research キーワード=MCP Server モード=deep

# 学術論文検索モード
/world-research キーワード=ReAct Agent モード=academic

# 論文サーベイモード（特定研究トラック）
/world-research キーワード=Tree of Thoughts モード=survey トラック=reasoning

# トレンド分析
/world-research トレンド カテゴリ=エージェント

# 暗号通貨リサーチ（Dual Investment戦略）
/world-research キーワード=Dual Investment strategy モード=crypto

# 暗号通貨オンチェーン分析
/world-research キーワード=whale tracking on-chain モード=crypto プラットフォーム=Glassnode,Nansen,Dune

# DeFi/DEXリサーチ
/world-research キーワード=DeFi yield farming モード=crypto

# 暗号通貨トレーディングBot調査
/world-research キーワード=crypto trading bot モード=ecosystem

# 地域別レポート
/world-research キーワード=生成AI 地域=日本,中国,米国

# 実装エコシステム検索
/world-research キーワード=multi-agent モード=ecosystem
```

---

## AIキーワードマスターリスト

### カテゴリ別キーワード（全12カテゴリ × 3言語）

| カテゴリ | 日本語 | 英語 | 中国語 |
|---|---|---|---|
| **基盤技術** | 生成AI, LLM, 大規模言語モデル, 機械学習, 深層学習 | Generative AI, LLM, Large Language Model, Machine Learning, Deep Learning | 生成式AI, 大语言模型, 机器学习, 深度学习 |
| **開発ツール** | Claude Code, Vibe Coding, AI駆動開発, AIコーディング | Claude Code, Vibe Coding, AI-driven development, Cursor AI, GitHub Copilot | AI编程, AI辅助开发, AI代码生成 |
| **エージェント** | AIエージェント, MCP Server, 自律AI, マルチエージェント | AI Agent, MCP Server, Autonomous AI, Multi-Agent, Agentic AI | AI智能体, 多智能体, 自主AI |
| **モデル** | GPT, Claude, Gemini, DeepSeek, Qwen, Llama | GPT-5, Claude Opus, Gemini 3, DeepSeek, Qwen 3, Llama 4 | GPT, Claude, Gemini, 通义千问, 文心一言 |
| **応用** | プロンプトエンジニアリング, RAG, ファインチューニング | Prompt Engineering, RAG, Fine-tuning, RLHF | 提示词工程, 检索增强生成, 微调 |
| **ビジネス** | AI副業, AIマネタイズ, AI活用, AI導入事例 | AI side hustle, AI monetization, AI use cases | AI副业, AI变现, AI应用案例 |
| **安全性** | AI安全性, AIアライメント, AI規制, AI倫理 | AI Safety, AI Alignment, AI Regulation, AI Ethics | AI安全, AI对齐, AI监管 |
| **マルチモーダル** | 画像生成AI, 動画生成AI, 音声AI, VLA | Image Generation, Video Generation, Voice AI, VLA, Text-to-Video | AI图像生成, AI视频生成, 语音AI |
| **推論・思考** | 思考連鎖, 推論, ステップバイステップ推論 | Chain of Thought, Tree of Thoughts, Reasoning, ReAct, Reflexion | 思维链, 推理, 逐步推理 |
| **メモリ・知識** | 長期記憶, 知識グラフ, ベクトルDB | Long-term Memory, Knowledge Graph, Vector Database, RAG, Embedding | 长期记忆, 知识图谱, 向量数据库 |
| **MLOps・インフラ** | モデルデプロイ, 推論最適化, 量子化 | MLOps, Model Serving, Quantization, GGUF, vLLM, TensorRT | 模型部署, 推理优化, 量化 |
| **オープンソース** | OSS LLM, ローカルLLM, セルフホスト | Open Source LLM, Local LLM, Self-hosted, Ollama, llama.cpp | 开源大模型, 本地部署, 私有化部署 |
| **暗号通貨・取引所** | 暗号通貨, 仮想通貨, ビットコイン, イーサリアム, 取引所, CEX, DEX, Bitget, Binance, Bybit, OKX | Cryptocurrency, Bitcoin, Ethereum, Exchange, CEX, DEX, Bitget, Binance, Bybit, OKX, Coinbase | 加密货币, 比特币, 以太坊, 交易所, 币安, OKX |
| **ブロックチェーン・DeFi** | ブロックチェーン, DeFi, スマートコントラクト, NFT, Web3, レイヤー2, TVL, イールドファーミング, 流動性マイニング | Blockchain, DeFi, Smart Contract, NFT, Web3, Layer 2, TVL, Yield Farming, Liquidity Mining, Staking | 区块链, 去中心化金融, 智能合约, NFT, Web3, 质押, 流动性挖矿 |
| **トレーディング戦略** | Dual Investment, オプション, ストラクチャードプロダクト, テクニカル分析, ファンダメンタル分析, ホイール戦略, グリッドトレード, アービトラージ | Dual Investment, Options, Structured Products, Technical Analysis, Fundamental Analysis, Wheel Strategy, Grid Trading, Arbitrage, DCA | 双币投资, 期权, 结构化产品, 技术分析, 网格交易, 套利 |
| **暗号通貨データ** | オンチェーン分析, ホエール追跡, センチメント分析, Fear & Greed, 市場データ, 価格フィード | On-chain Analysis, Whale Tracking, Sentiment Analysis, Fear & Greed Index, Market Data, Price Feed, OHLCV | 链上分析, 巨鲸追踪, 情绪分析, 市场数据 |

### 暗号通貨詳細キーワードリファレンス（3言語 × サブカテゴリ）

#### カテゴリA: 暗号通貨・取引所（詳細）

| サブカテゴリ | 日本語 | English | 中文 |
|---|---|---|---|
| **CEX取引所** | バイナンス, コインベース, クラーケン, ビットフィネックス, バイビット, OKX, ゲートアイオー, クーコイン, MEXC, HTX, ビットフライヤー, コインチェック, GMOコイン | Binance, Coinbase, Kraken, Bitfinex, Bybit, OKX, Gate.io, KuCoin, MEXC, HTX, Gemini, Crypto.com, Bitstamp | 币安, Coinbase, 火币(HTX), OKX(欧易), Gate.io, 库币, Bybit, Bitfinex, MEXC(抹茶), Crypto.com |
| **DEX取引所** | ユニスワップ, パンケーキスワップ, カーブ, dYdX, ソーチェーン, ハイパーリキッド, ワンインチ, レイディウム, ジュピター | Uniswap, PancakeSwap, Curve, dYdX, THORChain, Hyperliquid, 1inch, Raydium, Jupiter, Orca, SushiSwap | Uniswap(统一交换), PancakeSwap(薄饼), Curve, dYdX, THORChain, 1inch, SushiSwap(寿司) |
| **取引商品** | 現物取引, 先物取引, オプション取引, 永久先物, レバレッジトークン, 二重投資, シャークフィン, グリッドトレーディング, コピートレード, ステーキング, レンディング | Spot trading, Futures, Options, Perpetual swaps, Leveraged tokens, Dual Investment, Shark Fin, Grid trading, Copy trading, Staking, Lending | 现货交易, 合约交易, 期权, 永续合约, 杠杆代币, 双币投资, 鲨鱼鳍, 网格交易, 跟单交易, 质押, 借贷 |
| **ウォレット** | ハードウェアウォレット, ホットウォレット, コールドウォレット, マルチシグウォレット, シードフレーズ, 秘密鍵, メタマスク, レジャー, トレザー | Hardware wallet, Hot wallet, Cold wallet, Multi-sig wallet, Seed phrase, Private key, MetaMask, Ledger, Trezor, Phantom, Rabby | 硬件钱包, 热钱包, 冷钱包, 多签钱包, 助记词, 私钥, MetaMask(小狐狸), Ledger, Trezor |
| **規制・コンプライアンス** | 資金決済法, 暗号資産交換業, KYC, AML, 金融庁, 税務申告, トラベルルール, 分離管理, 自主規制団体(JVCEA) | KYC, AML/CFT, SEC, CFTC, MiCA, Travel Rule, Regulatory sandbox, Compliance, Licensing, Securities law | KYC(了解你的客户), AML(反洗钱), 合规, 监管沙盒, 虚拟资产服务商(VASP), 旅行规则, 牌照 |

#### カテゴリB: ブロックチェーン・DeFi（詳細）

| サブカテゴリ | 日本語 | English | 中文 |
|---|---|---|---|
| **L1チェーン** | ビットコイン, イーサリアム, ソラナ, BNBチェーン, アバランチ, カルダノ, TON, ヘデラ, SEI, XRPレジャー, ポルカドット, コスモス, ニア, スイ, アプトス | Bitcoin, Ethereum, Solana, BNB Chain, Avalanche, Cardano, TON, Hedera, SEI, XRP Ledger, Polkadot, Cosmos, NEAR, Sui, Aptos | 比特币, 以太坊, Solana(索拉纳), BNB链, 雪崩(Avalanche), 卡尔达诺, TON, Polkadot(波卡), Cosmos, NEAR, Sui, Aptos |
| **L2チェーン** | アービトラム, オプティミズム, ベース, ポリゴン, zkSync, スタークネット, マントル, スタックス, イミュータブルX, スクロール, リネア | Arbitrum, Optimism, Base, Polygon, zkSync, StarkNet, Mantle, Stacks, Immutable X, Scroll, Linea, Zora, Merlin, Blast | Arbitrum(仲裁), Optimism(乐观), Base, Polygon(多边形), zkSync, StarkNet, Scroll, Linea |
| **DeFiプロトコル** | リド, アーベ, アイゲンレイヤー, ユニスワップ, メイカーダオ, コンパウンド, カーブ, パンケーキスワップ, コンベックス, ペンドル | Lido, Aave, EigenLayer, Uniswap, MakerDAO/Sky, Compound, Curve, PancakeSwap, Convex, Pendle, Yearn, Balancer, GMX, Synthetix | Lido, Aave, EigenLayer, Uniswap, MakerDAO, Compound, Curve, PancakeSwap, Pendle, Convex |
| **NFT/GameFi/SocialFi** | NFTマーケットプレイス, オープンシー, ブラー, マジックエデン, ゲームファイ, プレイトゥアーン, メタバース, ソーシャルファイ, ファーキャスター, レンズプロトコル | NFT marketplace, OpenSea, Blur, Magic Eden, GameFi, Play-to-Earn(P2E), Metaverse, SocialFi, friend.tech, Farcaster, Lens Protocol | NFT市场, OpenSea, Blur, GameFi(链游), Play-to-Earn(边玩边赚), 元宇宙, SocialFi, Farcaster |
| **スマートコントラクト開発** | ソリディティ, ラスト, ムーブ, ハードハット, ファウンドリー, リミックス, OpenZeppelin, 監査, 形式検証 | Solidity, Rust, Move, Hardhat, Foundry, Remix, OpenZeppelin, Audit, Formal verification, ERC-20, ERC-721, ERC-1155, EIP, ABI | Solidity, Rust, Move, Hardhat, Foundry, 智能合约审计, 形式化验证, ERC标准 |

#### カテゴリC: トレーディング戦略（詳細）

| サブカテゴリ | 日本語 | English | 中文 |
|---|---|---|---|
| **テクニカル分析** | ローソク足, 移動平均線(MA/EMA/SMA), ボリンジャーバンド, RSI, MACD, フィボナッチ, 一目均衡表, 出来高, サポート/レジスタンス, ダイバージェンス, ゴールデンクロス, デッドクロス | Candlestick, Moving Average(MA/EMA/SMA), Bollinger Bands, RSI, MACD, Fibonacci, Ichimoku Cloud, Volume, Support/Resistance, Divergence, Golden Cross, Death Cross, VWAP, OBV | K线(蜡烛图), 移动平均线, 布林带, RSI(相对强弱指数), MACD, 斐波那契, 一目均衡表, 成交量, 支撑/阻力, 背离, 金叉, 死叉 |
| **アルゴトレーディング** | アルゴリズムトレーディング, 高頻度取引(HFT), マーケットメイキング, アービトラージ, グリッドボット, DCAボット, バックテスト, ペーパートレーディング, クオンツ | Algorithmic trading, HFT, Market making, Arbitrage, Grid bot, DCA bot, Backtesting, Paper trading, Quantitative trading, Signal, MEV, Sandwich attack | 算法交易, 高频交易, 做市商, 套利, 网格机器人, 定投机器人, 回测, 模拟交易, 量化交易, MEV |
| **リスク管理** | ストップロス, テイクプロフィット, ポジションサイジング, リスクリワード比, ドローダウン, ヘッジ, 分散投資, 清算リスク, 証拠金, ファンディングレート | Stop loss, Take profit, Position sizing, Risk-reward ratio, Drawdown, Hedging, Diversification, Liquidation risk, Margin, Funding rate | 止损, 止盈, 仓位管理, 风险收益比, 回撤, 对冲, 分散投资, 清算风险, 保证金, 资金费率 |
| **構造化商品** | 二重投資(Dual Investment), シャークフィン, 元本保証型, ステーキング利回り, レンディング, 流動性マイニング, イールドファーミング, リキッドステーキング | Dual Investment, Shark Fin, Principal-protected, Staking yield, Lending, Liquidity mining, Yield farming, Liquid staking, Restaking, Points | 双币投资, 鲨鱼鳍, 保本型, 质押收益, 借贷, 流动性挖矿, 收益耕作, 流动性质押, 再质押 |

#### カテゴリD: 暗号通貨データ・分析（詳細）

| サブカテゴリ | 日本語 | English | 中文 |
|---|---|---|---|
| **オンチェーンメトリクス** | MVRV比率, NVT比率, SOPR(支出利益率), 実現キャップ, HODL波動, NUPL(未実現損益), ハッシュレート, 難易度, アクティブアドレス数, ガス料金 | MVRV Ratio, NVT Ratio, SOPR, Realized Cap, HODL Waves, NUPL, Hash Rate, Difficulty, Active Addresses, Transaction Count, Gas Fees, Exchange Netflow | MVRV比率, NVT比率, SOPR, 已实现市值, HODL浪潮, NUPL, 哈希率, 难度, 活跃地址, Gas费用, 交易所净流量 |
| **ホエール追跡** | ホエールアラート, クジラの動向, 大口送金, 取引所入出金, ウォレット追跡, スマートマネー, KOLウォレット | Whale Alert, Whale tracking, Large transfers, Exchange inflow/outflow, Wallet tracking, Smart money, KOL wallets | 巨鲸追踪, 大额转账, 交易所流入/流出, 钱包追踪, 聪明钱, KOL钱包 |
| **センチメント指標** | Fear & Greed Index, ソーシャルセンチメント, ファンディングレート, 建玉(OI), ロング/ショート比率, 清算マップ | Fear & Greed Index, Social sentiment, Funding rate, Open Interest(OI), Long/Short ratio, Liquidation heatmap, Galaxy Score | 恐惧贪婪指数, 社交情绪, 资金费率, 持仓量, 多空比, 清算热力图 |
| **日本語固有スラング** | ガチホ, イナゴ, 養分, 億り人, 草コイン, ポジポジ病, 含み損, 含み益, 損切り, 利確 | (N/A - JP slang) | (N/A) |

### キーワード展開ルール

```
入力キーワード → 展開処理：

1. 同義語展開（例: Claude Code → Claude Code, Claude CLI, Anthropic CLI）
2. 言語変換（日→英→中）
3. ハッシュタグ変換（例: AI Agent → #AIAgent #AI_Agent #ArtificialIntelligence）
4. 組み合わせ生成（例: Claude Code + tutorial, guide, 入門, 活用）
5. 学術キーワード変換（例: AI Agent → "autonomous agent" "tool-augmented LLM"）
6. Arxivカテゴリ変換（例: LLM → cs.CL, cs.AI, cs.LG）
```

---

## Layer 1: 学術論文検索

### 1-1. Arxiv

**検索URL**: `https://arxiv.org/search/`
**API**: `https://export.arxiv.org/api/query`

#### AI関連カテゴリ

| カテゴリ | コード | 主要トピック |
|---|---|---|
| Computation and Language | `cs.CL` | NLP, LLM, Transformer, Prompt Engineering |
| Artificial Intelligence | `cs.AI` | Agent, Planning, Reasoning, Knowledge |
| Machine Learning | `cs.LG` | Training, Optimization, Architecture |
| Computer Vision | `cs.CV` | Vision-Language, Multimodal, Image Generation |
| Information Retrieval | `cs.IR` | RAG, Search, Recommendation |
| Software Engineering | `cs.SE` | Code Generation, AI-assisted Development |
| Multiagent Systems | `cs.MA` | Multi-Agent, Coordination, Communication |
| Robotics | `cs.RO` | Embodied AI, VLA, Robot Learning |

#### 検索クエリテンプレート

```
# Arxiv API検索
GET https://export.arxiv.org/api/query?search_query=all:{keyword}&sortBy=submittedDate&sortOrder=descending&max_results=20

# カテゴリ絞り込み
GET https://export.arxiv.org/api/query?search_query=cat:cs.CL+AND+all:{keyword}&max_results=20

# 著者検索
GET https://export.arxiv.org/api/query?search_query=au:{author_name}&max_results=10

# Web検索（Arxiv内）
https://arxiv.org/search/?query={keyword}&searchtype=all&order=-announced_date_first

# 日付範囲指定
https://arxiv.org/search/?query={keyword}&start=0&order=-announced_date_first
```

#### 主要キーワード（論文検索用）

| 研究トラック | 検索キーワード |
|---|---|
| LLMエージェント | `"LLM agent" OR "tool-augmented" OR "agentic"` |
| 推論・思考 | `"chain of thought" OR "tree of thoughts" OR "reasoning"` |
| RAG | `"retrieval augmented generation" OR "RAG"` |
| マルチエージェント | `"multi-agent" OR "agent collaboration" OR "agent communication"` |
| コード生成 | `"code generation" OR "program synthesis" OR "AI coding"` |
| アライメント | `"alignment" OR "RLHF" OR "DPO" OR "constitutional AI"` |
| 効率化 | `"quantization" OR "distillation" OR "pruning" OR "efficient"` |

---

### 1-2. Papers with Code

**検索URL**: `https://paperswithcode.com/search?q=`
**API**: `https://paperswithcode.com/api/v1/`

#### 検索テンプレート

```
# 論文検索
https://paperswithcode.com/search?q_meta=&q_type=&q={keyword}

# トレンド（最新）
https://paperswithcode.com/latest

# メソッド検索
https://paperswithcode.com/methods

# データセット検索
https://paperswithcode.com/datasets

# API: 論文検索
GET https://paperswithcode.com/api/v1/papers/?q={keyword}&ordering=-published&page=1

# API: リポジトリ付き論文
GET https://paperswithcode.com/api/v1/papers/?q={keyword}&has_code=true
```

#### 注目カテゴリ

| カテゴリ | URL |
|---|---|
| Language Models | `https://paperswithcode.com/task/language-modelling` |
| Question Answering | `https://paperswithcode.com/task/question-answering` |
| Text Generation | `https://paperswithcode.com/task/text-generation` |
| Code Generation | `https://paperswithcode.com/task/code-generation` |
| Image Generation | `https://paperswithcode.com/task/image-generation` |
| Object Detection | `https://paperswithcode.com/task/object-detection` |

---

### 1-3. OpenReview

**検索URL**: `https://openreview.net/search?term=`

#### 主要会議

| 会議 | 分野 | 時期 |
|---|---|---|
| NeurIPS | ML全般 | 12月 |
| ICML | ML全般 | 7月 |
| ICLR | 表現学習・DL | 5月 |
| ACL | NLP | 7月 |
| EMNLP | NLP | 12月 |
| NAACL | NLP | 6月 |
| CVPR | CV | 6月 |
| AAAI | AI全般 | 2月 |
| COLM | 言語モデル | 10月 |

#### 検索テンプレート

```
# キーワード検索
https://openreview.net/search?term={keyword}&content=all

# 会議別検索
https://openreview.net/group?id=NeurIPS.cc/2025/Conference

# API検索
GET https://api2.openreview.net/notes/search?query={keyword}&limit=25&offset=0
```

---

### 1-4. Google Scholar

**検索URL**: `https://scholar.google.com/scholar?q=`

#### 検索テンプレート

```
# 基本検索
https://scholar.google.com/scholar?q={keyword}&as_ylo=2025

# 完全一致検索
https://scholar.google.com/scholar?q="{exact_phrase}"&as_ylo=2025

# 著者検索
https://scholar.google.com/scholar?q=author:"{author_name}"

# 被引用数順ソート
https://scholar.google.com/scholar?q={keyword}&as_ylo=2024&scisbd=1

# 特定ジャーナル/会議
https://scholar.google.com/scholar?q={keyword}+source:"{venue_name}"
```

#### Google Scholar Profiles（要注目研究者）

| 研究者 | 所属 | 専門 |
|---|---|---|
| Yann LeCun | Meta AI / NYU | Self-supervised Learning, World Models |
| Geoffrey Hinton | University of Toronto | Deep Learning, Capsule Networks |
| Yoshua Bengio | Mila / U. Montreal | Generative Models, Causality |
| Ilya Sutskever | Safe Superintelligence | Scaling Laws, Alignment |
| Jason Wei | OpenAI | Chain-of-Thought, Emergent Abilities |
| Hyung Won Chung | OpenAI | Instruction Tuning, Scaling |
| Tri Dao | Princeton / Together AI | FlashAttention, Efficient Training |
| Percy Liang | Stanford | Foundation Models (HELM), Benchmarks |
| Denny Zhou | Google DeepMind | Reasoning, Chain-of-Thought |

---

### 1-5. Semantic Scholar

**検索URL**: `https://www.semanticscholar.org/search?q=`
**API**: `https://api.semanticscholar.org/graph/v1/`

#### 検索テンプレート

```
# Web検索
https://www.semanticscholar.org/search?q={keyword}&sort=relevance&year%5B0%5D=2025

# API: 論文検索
GET https://api.semanticscholar.org/graph/v1/paper/search?query={keyword}&year=2025-&limit=20&fields=title,abstract,year,citationCount,authors,url

# API: 論文詳細（引用グラフ含む）
GET https://api.semanticscholar.org/graph/v1/paper/{paper_id}?fields=title,abstract,citations,references

# API: 著者検索
GET https://api.semanticscholar.org/graph/v1/author/search?query={author_name}&limit=5

# API: 推薦論文
GET https://api.semanticscholar.org/recommendations/v1/papers/?positivePaperIds={paper_id}&limit=10
```

#### Semantic Scholar特有機能

- **TLDR**: 論文の自動要約（1行）
- **Citation Intent**: 引用の意図分類（背景/手法/結果比較）
- **Influential Citations**: 影響力の高い引用のみフィルタ
- **Research Feeds**: パーソナライズドフィード

---

### 1-6. Connected Papers

**URL**: `https://www.connectedpapers.com/`

#### 使い方

```
# 論文の引用グラフを可視化
https://www.connectedpapers.com/search?q={keyword}

# 特定論文の関連論文マップ
https://www.connectedpapers.com/main/{arxiv_id}

# Prior Work（この論文が引用している重要論文）
# Derivative Work（この論文を引用している重要論文）
```

#### 活用シナリオ

- 新しい研究分野のランドスケープ把握
- 特定論文の前後関係の理解
- サーベイ論文の発見
- 見落としている重要論文の発見

---

### 1-7. DBLP

**検索URL**: `https://dblp.org/search?q=`
**API**: `https://dblp.org/search/publ/api`

```
# 著者の全出版物
https://dblp.org/search?q={author_name}

# API検索
GET https://dblp.org/search/publ/api?q={keyword}&format=json&h=20
```

---

### 1-8. ACL Anthology

**検索URL**: `https://aclanthology.org/search/?q=`

```
# NLP論文専門検索
https://aclanthology.org/search/?q={keyword}

# 会議別
https://aclanthology.org/venues/acl/
https://aclanthology.org/venues/emnlp/
https://aclanthology.org/venues/naacl/
```

---

### 1-9. ResearchRabbit

**URL**: `https://www.researchrabbit.ai/`

- 論文コレクション作成
- 類似論文の自動推薦
- 引用ネットワーク可視化
- メールアラート設定

---

## Layer 2: ペーパーキュレーション・デイリートラッキング

### 2-1. Hugging Face Daily Papers

**URL**: `https://huggingface.co/papers`

```
# 今日の注目論文
https://huggingface.co/papers

# 日付指定
https://huggingface.co/papers?date=2026-02-08

# 検索
https://huggingface.co/papers?q={keyword}
```

#### 特徴
- コミュニティ投票によるランキング
- 論文ごとにデモ/モデル/データセットへの直リンク
- Upvote数で注目度を把握

---

### 2-2. Daily AI Papers (GitHub)

**リポジトリ**: `https://github.com/daily-ai-papers`

- Arxiv新着論文の日次キュレーション
- カテゴリ別整理
- GitHub Starで人気度を追跡

---

### 2-3. @_akhaliq（AK）Twitter/X

**プロフィール**: `https://x.com/_akhaliq`

```
# AKの最新投稿（論文速報）
from:_akhaliq min_faves:100 since:{date}

# AKの論文紹介（特定トピック）
from:_akhaliq "{keyword}" min_faves:50
```

#### 特徴
- Arxiv新着論文の最速キュレーション（毎日数十本）
- デモ動画/GIF付きで直感的
- HuggingFace Papers Pageの主要コントリビューター

---

### 2-4. Alpha Signal

**URL**: `https://alphasignal.ai/`

- AIニュースの日次ダイジェスト
- 論文・リリース・ツールの統合フィード
- メールニュースレター

---

### 2-5. ML News Aggregators

| サービス | URL | 特徴 |
|---|---|---|
| **Papers with Code Newsletter** | `https://paperswithcode.com/newsletter` | 週次ベストペーパー |
| **The Batch (Andrew Ng)** | `https://www.deeplearning.ai/the-batch/` | 週次AI業界ニュース |
| **Import AI (Jack Clark)** | `https://importai.substack.com/` | 週次AI研究動向 |
| **AI Tidbits** | `https://aitidbits.substack.com/` | 日次AI最新情報 |
| **Ahead of AI (Sebastian Raschka)** | `https://magazine.sebastianraschka.com/` | LLM研究月次まとめ |
| **The Neuron** | `https://www.theneurondaily.com/` | 日次AIニュース |
| **TLDR AI** | `https://tldr.tech/ai` | 日次AI技術ニュース |
| **Ben's Bites** | `https://bensbites.beehiiv.com/` | 日次AIプロダクト |
| **Davis Summarizes Papers** | YouTube | 論文の動画解説 |
| **Yannic Kilcher** | YouTube | 論文の詳細レビュー |
| **AI Explained** | YouTube | AI技術の解説 |

---

### 2-6. X（Twitter）論文速報アカウント

| アカウント | 専門 | フォロー推奨度 |
|---|---|---|
| `@_akhaliq` | Arxiv新着全般（毎日数十本） | ★★★★★ |
| `@lilianweng` | LLMエージェント・サーベイ | ★★★★★ |
| `@kaboroevich` | ML研究・ベンチマーク | ★★★★ |
| `@rasaborjr` | NLP・LLM研究 | ★★★★ |
| `@oaborjr` | CV・マルチモーダル | ★★★★ |
| `@reach_vb` | HuggingFace・OSS ML | ★★★★ |
| `@lababorjr` | ロボティクス・VLA | ★★★ |
| `@ylaborjr` | エージェント・ツール | ★★★ |

```
# 論文速報の横断検索
(from:_akhaliq OR from:lilianweng OR from:kaboroevich) "{keyword}" since:{date}
```

### 2-7. 暗号通貨 X（Twitter）アカウント

#### マクロ経済・機関投資家

| アカウント | 専門分野 | フォロワー | フォロー推奨度 |
|---|---|---|---|
| `@saylor` (Michael Saylor) | BTC機関投資 | ~3.8M | ★★★★★ |
| `@RaoulGMI` (Raoul Pal) | マクロ経済×暗号通貨 | ~1.1M | ★★★★★ |
| `@APompliano` (Anthony Pompliano) | マクロ×BTC | ~1.6M | ★★★★ |
| `@BarrySilbert` (Barry Silbert) | DCG CEO | ~700K | ★★★★ |

#### テクニカル分析・トレーディング

| アカウント | 専門分野 | フォロワー | フォロー推奨度 |
|---|---|---|---|
| `@woabordy` (Willy Woo) | オンチェーン分析・BTC | ~1M | ★★★★★ |
| `@BenjCowen` (Benjamin Cowen) | データ分析・リスク指標 | ~920K | ★★★★★ |
| `@CryptoMichNL` (Michael van de Poppe) | TA・アルトコイン | ~680K | ★★★★ |
| `@scottmelker` (Scott Melker) | TA | ~700K | ★★★★ |
| `@ali_charts` | TA・チャート | ~500K | ★★★★ |
| `@ToneVays` | TA（元ウォール街） | ~300K | ★★★★ |

#### ニュース速報・オンチェーン

| アカウント | 専門分野 | フォロワー | フォロー推奨度 |
|---|---|---|---|
| `@whale_alert` | 大口送金追跡（100+チェーン） | ~2.3M | ★★★★★ |
| `@lookonchain` | ホエール追跡・リアルタイム | ~700K | ★★★★★ |
| `@WatcherGuru` | ニュース速報 | ~385K | ★★★★ |

#### DeFi・ブロックチェーン開発

| アカウント | 専門分野 | フォロワー | フォロー推奨度 |
|---|---|---|---|
| `@VitalikButerin` | Ethereum共同創設者 | ~5.2M | ★★★★★ |
| `@aantonop` (Andreas Antonopoulos) | BTC教育・哲学 | ~700K | ★★★★★ |
| `@defi_dad` | DeFi教育 | ~175K | ★★★★ |
| `@DeFiPulse` | DeFi指標・TVL | ~158K | ★★★★ |

#### 日本語圏

| アカウント | 専門分野 | フォロワー | フォロー推奨度 |
|---|---|---|---|
| `@coin_post` (CoinPost) | 国内最大級メディア | ~300K | ★★★★★ |
| `@bokujyuumai` (墨汁うまい) | ETH/DeFi/オンチェーン | ~200K | ★★★★★ |
| `@CryptoTimes_mag` | 総合メディア | ~80K | ★★★★ |
| `@kudasai_japan` (KudasaiJP) | 最大級コミュニティ | 大規模 | ★★★★ |

```
# 暗号通貨速報の横断検索
(from:whale_alert OR from:lookonchain OR from:WatcherGuru) "{keyword}" since:{date}

# 暗号通貨アナリスト横断検索
(from:woabordy OR from:BenjCowen OR from:ali_charts) "{keyword}" since:{date}

# 日本語暗号通貨速報
(from:coin_post OR from:bokujyuumai OR from:CryptoTimes_mag) "{keyword}" lang:ja since:{date}
```

---

## Layer 3: テックブログ・研究解説

### 3-1. Lil'Log（Lilian Weng）

**URL**: `https://lilianweng.github.io/`

| テーマ | 代表記事 |
|---|---|
| LLMエージェント | "LLM Powered Autonomous Agents" |
| プロンプト | "Prompt Engineering" |
| 拡散モデル | "What are Diffusion Models?" |
| アテンション | "Attention? Attention!" |
| 強化学習 | "A Long Peek into Reinforcement Learning" |

```
# サイト内検索
site:lilianweng.github.io {keyword}
```

---

### 3-2. Distill.pub

**URL**: `https://distill.pub/`

- インタラクティブな可視化付き論文
- Transformer, Attention, Feature Visualizationの名解説
- 2021年以降更新停止だが、基礎理解に必須

---

### 3-3. The Gradient

**URL**: `https://thegradient.pub/`

- AI研究の長文解説記事
- インタビュー・オピニオン
- 学術とビジネスの橋渡し

---

### 3-4. Jay Alammar

**URL**: `https://jalammar.github.io/`

| テーマ | 代表記事 |
|---|---|
| Transformer | "The Illustrated Transformer" |
| BERT | "The Illustrated BERT" |
| GPT-2/3 | "The Illustrated GPT-2" |
| Word2Vec | "The Illustrated Word2Vec" |
| Stable Diffusion | "The Illustrated Stable Diffusion" |

---

### 3-5. Andrej Karpathy

**URL**: `https://karpathy.ai/`
**YouTube**: `https://www.youtube.com/@AndrejKarpathy`

| コンテンツ | 特徴 |
|---|---|
| "Neural Networks: Zero to Hero" | ゼロからのNN実装シリーズ |
| "Let's build GPT" | GPTを手作りで実装 |
| "Intro to LLMs" | LLMの包括的入門 |
| ブログ記事 | 技術的深掘り |

```
# YouTube検索
site:youtube.com "Andrej Karpathy" {keyword}
```

---

### 3-6. Sebastian Raschka

**URL**: `https://sebastianraschka.com/`
**Substack**: `https://magazine.sebastianraschka.com/`

| コンテンツ | 特徴 |
|---|---|
| "Ahead of AI" Magazine | LLM研究の月次まとめ（必読） |
| "Build a Large Language Model" | 書籍（LLM実装ガイド） |
| ブログ | DL/ML研究の解説 |

---

### 3-7. Chip Huyen

**URL**: `https://huyenchip.com/blog/`

| テーマ | 代表記事 |
|---|---|
| MLOps | "Designing Machine Learning Systems"（書籍） |
| LLMOps | LLMデプロイ・運用のベストプラクティス |
| キャリア | ML/AI業界のキャリアガイド |

---

### 3-8. Eugene Yan

**URL**: `https://eugeneyan.com/`

| テーマ | 代表記事 |
|---|---|
| RecSys | 推薦システムの実務 |
| LLM応用 | LLMの産業応用パターン |
| ML実務 | MLエンジニアリングの実践 |

---

### 3-9. その他の注目ブログ・リソース

| ブログ | URL | 特徴 |
|---|---|---|
| **Anthropic Research** | `https://www.anthropic.com/research` | Claude開発元の研究 |
| **OpenAI Research** | `https://openai.com/research` | GPT/DALL-E等の公式研究 |
| **Google AI Blog** | `https://blog.google/technology/ai/` | Google/DeepMind研究 |
| **Meta AI Research** | `https://ai.meta.com/research/` | Llama/FAIR研究 |
| **DeepMind Blog** | `https://deepmind.google/discover/blog/` | Gemini/AlphaFold研究 |
| **Microsoft Research** | `https://www.microsoft.com/en-us/research/blog/` | AutoGen/Copilot研究 |
| **Hugging Face Blog** | `https://huggingface.co/blog` | OSS ML最新動向 |
| **Weights & Biases Blog** | `https://wandb.ai/fully-connected` | MLOps・実験管理 |
| **Cohere For AI** | `https://cohere.com/research` | Aya/Command-R研究 |
| **AI2 Blog (Allen AI)** | `https://blog.allenai.org/` | OLMo/Tulu研究 |

---

## Layer 4: 実装エコシステム

### 4-1. Hugging Face Hub

**URL**: `https://huggingface.co/`

```
# モデル検索
https://huggingface.co/models?search={keyword}&sort=trending

# データセット検索
https://huggingface.co/datasets?search={keyword}&sort=trending

# Spaces（デモ）検索
https://huggingface.co/spaces?search={keyword}&sort=trending

# コレクション
https://huggingface.co/collections

# Smolagents（エージェントフレームワーク）
https://huggingface.co/docs/smolagents
```

#### HF Smolagents

```python
# Smolagentsの検索
https://huggingface.co/docs/smolagents/index
https://github.com/huggingface/smolagents

# Smolagentsのツール検索
https://huggingface.co/spaces?search=smolagents&sort=trending
```

---

### 4-2. awesome-* リポジトリ

| リポジトリ | Stars | 内容 |
|---|---|---|
| `awesome-llm` | 20K+ | LLM論文・ツール・リソース総合 |
| `awesome-chatgpt-prompts` | 100K+ | プロンプトテンプレート集 |
| `awesome-langchain` | 7K+ | LangChainエコシステム |
| `awesome-generative-ai` | 5K+ | 生成AI全般 |
| `awesome-llm-agents` | 3K+ | LLMエージェント論文・実装 |
| `awesome-ai-agents` | 5K+ | AIエージェントフレームワーク |
| `awesome-machine-learning` | 65K+ | ML全般 |
| `awesome-deep-learning` | 22K+ | DL全般 |
| `awesome-mlops` | 13K+ | MLOps全般 |
| `awesome-production-machine-learning` | 16K+ | 本番ML |
| `awesome-self-hosted` | 190K+ | セルフホスト可能ツール |
| `awesome-rag` | 2K+ | RAG論文・実装 |
| `awesome-local-ai` | 1K+ | ローカルAI |

```
# GitHub検索テンプレート
https://github.com/search?q={keyword}+awesome&type=repositories&s=stars&o=desc
```

---

### 4-3. エージェントフレームワーク

| フレームワーク | GitHub | 特徴 |
|---|---|---|
| **LangChain** | `langchain-ai/langchain` | 最大のLLMフレームワーク |
| **LlamaIndex** | `run-llama/llama_index` | RAG特化フレームワーク |
| **CrewAI** | `crewAIInc/crewAI` | マルチエージェントオーケストレーション |
| **AutoGen** | `microsoft/autogen` | MS製マルチエージェント |
| **AutoGPT** | `Significant-Gravitas/AutoGPT` | 自律AIエージェント |
| **OpenDevin** | `All-Hands-AI/OpenHands` | AI開発エージェント |
| **CAMEL** | `camel-ai/camel` | コミュニカティブエージェント |
| **MetaGPT** | `geekan/MetaGPT` | マルチエージェントフレームワーク |
| **Voyager** | `MineDojo/Voyager` | 具身エージェント（Minecraft） |
| **BabyAGI** | `yoheinakajima/babyagi` | タスク駆動自律エージェント |
| **DSPy** | `stanfordnlp/dspy` | プログラマティックLLM制御 |
| **Semantic Kernel** | `microsoft/semantic-kernel` | MS製AI統合フレームワーク |
| **Haystack** | `deepset-ai/haystack` | RAGパイプライン |
| **Pydantic AI** | `pydantic/pydantic-ai` | 型安全AIエージェント |
| **Claude Code** | Anthropic | CLIベースAIエージェント |
| **Devin** | Cognition Labs | 自律ソフトウェアエンジニア |
| **SWE-agent** | `princeton-nlp/SWE-agent` | コーディングエージェント |

```
# GitHub Trending（ML/AI）
https://github.com/trending?since=weekly&spoken_language_code=&language=python

# GitHub検索（エージェント）
https://github.com/search?q=llm+agent&type=repositories&s=stars&o=desc
```

---

### 4-4. MLOps・インフラ

| ツール/サービス | URL | 用途 |
|---|---|---|
| **vLLM** | `https://github.com/vllm-project/vllm` | 高速LLM推論 |
| **Ollama** | `https://ollama.com/` | ローカルLLM実行 |
| **llama.cpp** | `https://github.com/ggerganov/llama.cpp` | CPU推論 |
| **TensorRT-LLM** | NVIDIA | GPU最適化推論 |
| **MLflow** | `https://mlflow.org/` | 実験管理 |
| **Weights & Biases** | `https://wandb.ai/` | 実験追跡 |
| **DVC** | `https://dvc.org/` | データバージョン管理 |
| **BentoML** | `https://www.bentoml.com/` | モデルサービング |
| **Ray** | `https://www.ray.io/` | 分散学習/推論 |
| **Unsloth** | `https://github.com/unslothai/unsloth` | 高速ファインチューニング |
| **Axolotl** | `https://github.com/OpenAccess-AI-Collective/axolotl` | LLMファインチューニング |
| **LitGPT** | `https://github.com/Lightning-AI/litgpt` | GPT実装・訓練 |

---

### 4-5. 教育・コースリソース

| リソース | URL | 特徴 |
|---|---|---|
| **Full Stack Deep Learning** | `https://fullstackdeeplearning.com/` | DLの実務的コース |
| **Made With ML** | `https://madewithml.com/` | MLOps実践コース |
| **fast.ai** | `https://www.fast.ai/` | 実践重視DLコース |
| **Stanford CS224N** | `https://web.stanford.edu/class/cs224n/` | NLP（Manning） |
| **Stanford CS229** | `https://cs229.stanford.edu/` | ML（Andrew Ng） |
| **Stanford CS25** | `https://web.stanford.edu/class/cs25/` | Transformer |
| **MIT 6.S191** | `https://introtodeeplearning.com/` | DL入門 |
| **Hugging Face Course** | `https://huggingface.co/learn` | Transformers/NLP/RL |
| **DeepLearning.AI** | `https://www.deeplearning.ai/` | Andrew Ngのコース群 |

---

## Layer 5: SNSプラットフォーム検索

### 5-1. X（旧Twitter）

**検索URL**: `https://x.com/search-advanced`

#### 検索演算子

| 演算子 | 用途 | 例 |
|---|---|---|
| `"完全一致"` | フレーズ検索 | `"Claude Code"` |
| `from:` | 特定ユーザー | `from:AnthropicAI` |
| `min_faves:` | 最低いいね数 | `"AI Agent" min_faves:100` |
| `min_retweets:` | 最低RT数 | `"LLM" min_retweets:50` |
| `since:` / `until:` | 期間指定 | `"Vibe Coding" since:2026-01-01` |
| `filter:links` | リンク付き | `"RAG" filter:links` |
| `lang:` | 言語指定 | `lang:ja` / `lang:en` / `lang:zh` |
| `-filter:replies` | リプライ除外 | `"MCP" -filter:replies` |
| `OR` | OR検索 | `"Claude Code" OR "Cursor AI"` |

#### テンプレートクエリ

```
# 英語バイラル
"{keyword}" min_faves:200 since:{date} lang:en -filter:replies

# 日本語バイラル
"{keyword_ja}" lang:ja min_faves:50 since:{date}

# 中国語バイラル
"{keyword_zh}" lang:zh min_faves:100 since:{date}

# 論文速報
"paper" ("{keyword}" OR "LLM") min_faves:500 filter:links since:{date}
```

---

### 5-2. Reddit

**検索URL**: `https://www.reddit.com/search/`

#### AI関連Subreddit

| Subreddit | 検索クエリテンプレート |
|---|---|
| r/MachineLearning | `subreddit:MachineLearning "{keyword}"` |
| r/LocalLLaMA | `subreddit:LocalLLaMA "{keyword}"` |
| r/artificial | `subreddit:artificial "{keyword}"` |
| r/ChatGPT | `subreddit:ChatGPT "{keyword}"` |
| r/ClaudeAI | `subreddit:ClaudeAI "{keyword}"` |
| r/MLOps | `subreddit:MLOps "{keyword}"` |
| r/LLMDevs | `subreddit:LLMDevs "{keyword}"` |
| r/singularity | `subreddit:singularity "{keyword}"` |
| r/StableDiffusion | `subreddit:StableDiffusion "{keyword}"` |
| r/learnmachinelearning | `subreddit:learnmachinelearning "{keyword}"` |
| r/deeplearning | `subreddit:deeplearning "{keyword}"` |
| r/LanguageTechnology | `subreddit:LanguageTechnology "{keyword}"` |

#### 暗号通貨・ブロックチェーン関連Subreddit

| Subreddit | メンバー数 | 検索クエリテンプレート |
|---|---|---|
| r/CryptoCurrency | ~9.9M | `subreddit:CryptoCurrency "{keyword}"` |
| r/Bitcoin | ~7.9M | `subreddit:Bitcoin "{keyword}"` |
| r/Ethereum | ~3.3M | `subreddit:Ethereum "{keyword}"` |
| r/Dogecoin | ~2.4M | `subreddit:Dogecoin "{keyword}"` |
| r/CryptoMarkets | ~1.7M | `subreddit:CryptoMarkets "{keyword}"` |
| r/CryptoTechnology | ~1.3M | `subreddit:CryptoTechnology "{keyword}"` |
| r/DeFi | ~141K | `subreddit:DeFi "{keyword}"` |
| r/Altcoin | 中規模 | `subreddit:Altcoin "{keyword}"` |
| r/CryptoMoonShots | 中規模 | `subreddit:CryptoMoonShots "{keyword}"` |
| r/SatoshiStreetBets | 中規模 | `subreddit:SatoshiStreetBets "{keyword}"` |
| r/BitcoinBeginners | 中規模 | `subreddit:BitcoinBeginners "{keyword}"` |
| r/EthDev | 小~中規模 | `subreddit:EthDev "{keyword}"` |
| r/CryptoCurrencyTrading | 小~中規模 | `subreddit:CryptoCurrencyTrading "{keyword}"` |

#### 検索API

```
# 公式Reddit検索
GET https://www.reddit.com/search.json?q={keyword}&sort=relevance&t=week&limit=25

# Subreddit内検索
GET https://www.reddit.com/r/{subreddit}/search.json?q={keyword}&restrict_sr=1&sort=top&t=week

# サードパーティ
# PullPush: https://pullpush.io/
# ForumScout: https://forumscout.app/reddit-api
```

---

### 5-3. note.com（日本）

**検索URL**: `https://note.com/search?q={keyword}&context=note`
**トピックページ**: `https://note.com/topic/science_technology/ai_machine_learning`

#### 非公式API

| エンドポイント | URL |
|---|---|
| ユーザー情報 | `GET https://note.com/api/v2/creators/{username}` |
| 記事一覧 | `GET https://note.com/api/v2/creators/{username}/contents?kind=note&page=1` |
| 記事詳細 | `GET https://note.com/api/v1/notes/{note_key}` |
| タグ検索 | `GET https://note.com/api/v3/articles?tag={tag_name}&page=1` |
| トレンド | `GET https://note.com/api/v3/trending/notes` |

---

### 5-4. YouTube

**検索URL**: `https://www.youtube.com/results?search_query=`

#### ハッシュタグ・キーワード

| カテゴリ | キーワード |
|---|---|
| 技術解説 | `#AI #MachineLearning #DeepLearning #LLM #GenerativeAI` |
| 開発 | `#ClaudeCode #VibeCoding #CursorAI #GitHubCopilot #AIAgent` |
| 日本語 | `#生成AI #ChatGPT活用 #AIエージェント #プロンプトエンジニアリング` |
| 中国語 | `#AI编程 #大语言模型 #AI智能体` |

#### AI YouTube チャンネル

| チャンネル | 内容 |
|---|---|
| **Yannic Kilcher** | 論文レビュー（詳細） |
| **Two Minute Papers** | 論文速報（2分解説） |
| **AI Explained** | AI技術の解説 |
| **3Blue1Brown** | 数学/DLの可視化 |
| **Andrej Karpathy** | NN/LLM実装 |
| **Fireship** | 技術速報（10分） |
| **Matt Williams (Ollama)** | ローカルLLM |
| **Matthew Berman** | AIツールレビュー |
| **Dave's Garage** | AI技術解説 |

#### 暗号通貨 YouTube チャンネル

| チャンネル | 内容 | 登録者 | 言語 |
|---|---|---|---|
| **Coin Bureau** | 教育・レビュー・分析 | ~2.7M | EN |
| **Into the Cryptoverse** (Benjamin Cowen) | データ分析・リスク指標 | ~920K | EN |
| **Altcoin Daily** | デイリーニュース・インタビュー | ~1.5M | EN |
| **Bankless** | DeFi・Ethereum・Web3 | ~900K | EN |
| **The Crypto Lark** | マクロ分析・投資教育 | ~640K | EN |
| **CryptosRUs** | デイリー市場分析 | ~812K | EN |
| **Whiteboard Crypto** | 初心者教育（アニメ解説） | ~1M+ | EN |
| **Finematics** | DeFi解説（アニメ） | ~500K | EN |
| **DataDash** | マクロトレンド・オンチェーン | ~500K | EN |
| **The Defiant** | DeFi・開発者向け | ~200K | EN |
| **每日幣研** | TA・トレード手法 | ~100K | ZH-TW |
| **區塊鏈日報** | デイリーニュース | ~80K | ZH-TW |
| **mr block (區塊先生)** | エアドロップ・DeFi | ~100K | ZH-TW |

---

### 5-5. Instagram / TikTok / Shorts

#### ハッシュタグ

| プラットフォーム | トップハッシュタグ |
|---|---|
| **Instagram** | `#AI #ArtificialIntelligence #GenerativeAI #ChatGPT #AIArt #MachineLearning #AITools #TechTrends2026` |
| **TikTok** | `#AI #AITools #ChatGPT #AIHack #TechTok #LearnOnTikTok #VibeCoding #AIAgent` |
| **YouTube Shorts** | `#Shorts #AI #AITutorial #GenerativeAI #ClaudeCode` |

---

### 5-6. 中国SNS

| プラットフォーム | 検索URL | AI検索キーワード |
|---|---|---|
| **知乎** | `https://www.zhihu.com/search?q=` | 大语言模型, AI智能体, DeepSeek, 通义千问 |
| **Bilibili** | `https://search.bilibili.com/all?keyword=` | AI编程, Claude Code, 大模型, AI Agent |
| **小红书** | アプリ内検索 | AI工具, ChatGPT教程, AI副业, AI绘画 |
| **微信** | 搜一搜 | 生成式AI, AI大模型, AI Agent, MCP |
| **微博** | `https://s.weibo.com/weibo?q=` | AI, 人工智能, 大语言模型, DeepSeek |
| **CSDN** | `https://so.csdn.net/so/search?q=` | LLM开发, AI Agent, RAG, 微调 |

#### 横断検索API

```
# TikHub API（Bilibili/小红书/微博/知乎 横断）
https://api.tikhub.io/

# 小红書 MCP Server（AI Agent連携）
https://www.pulsemcp.com/servers/chenningling-xiaohongshu-search-comment
```

---

### 5-7. その他プラットフォーム

| プラットフォーム | 検索URL | キーワード |
|---|---|---|
| **Medium** | `https://medium.com/search?q=` | AI Agent, RAG, Vibe Coding, LLM |
| **Qiita** | `https://qiita.com/search?q=` | Claude Code, 生成AI, AIエージェント |
| **Zenn** | `https://zenn.dev/search?q=` | LLM, RAG, MCP, AI開発 |
| **Hacker News** | `https://hn.algolia.com/?q=` | AI Agent, Claude, GPT, LLM |
| **Naver Blog** | `https://search.naver.com/search.naver?where=blog&query=` | AI 개발, 생성형 AI, AI 에이전트 |
| **LinkedIn** | `https://www.linkedin.com/search/results/content/?keywords=` | AI Agent, Generative AI, MCP |
| **Dev.to** | `https://dev.to/search?q=` | AI, LLM, Agent, MCP |
| **Hashnode** | `https://hashnode.com/search?q=` | AI, Machine Learning, LLM |
| **Stack Overflow** | `https://stackoverflow.com/search?q=` | [llm], [langchain], [openai] |
| **Product Hunt** | `https://www.producthunt.com/search?q=` | AI tools, AI agent |

---

## Layer 6: コミュニティ・フォーラム

### 6-1. Discord

| サーバー | 招待/URL | 特徴 |
|---|---|---|
| **Hugging Face** | `https://discord.gg/huggingface` | OSS ML最大コミュニティ |
| **EleutherAI** | `https://discord.gg/eleutherai` | GPT-NeoX, Pythia等 |
| **LAION** | `https://discord.gg/laion` | CLIP, Open Dataset |
| **LangChain** | `https://discord.gg/langchain` | LangChain開発者 |
| **Ollama** | `https://discord.gg/ollama` | ローカルLLM |
| **Stable Diffusion** | `https://discord.gg/stablediffusion` | 画像生成 |
| **Midjourney** | `https://discord.gg/midjourney` | 画像生成 |
| **Together AI** | Discord | オープンモデル |

### 6-1b. 暗号通貨 Discord

| サーバー | メンバー数 | 特徴 |
|---|---|---|
| **WallStreetBets** | 600K+ | 短期トレード、投機、ミーム株/暗号通貨 |
| **Axion Trading** | 82K+ | トレーディングシグナル、戦略共有 |
| **r/CryptoCurrency Discord** | 大規模 | 総合議論、ニュース、市場分析 |
| **Jacob Crypto Bury** | 23K+ | DeFi、ICO、トレーディングシグナル |
| **DeFi Pulse** | ~22K | DeFiプロトコル分析、TVLデータ |
| **boarding bridge (bb)** | 中規模 | 日本語、DeFi/GameFi/NFT/エアドロップ |

### 6-1c. 暗号通貨 Telegram

| チャンネル | メンバー数 | 特徴 |
|---|---|---|
| **Binance Killers** | 250K+ | Binance向けトレーディングシグナル |
| **Bitcoin Bullets** | ~36K | BTC特化シグナル |
| **KudasaiJP** | 大規模 | 日本最大級暗号資産コミュニティ |
| **Evening Trader** | 中規模 | 無料シグナル |

> **注意**: Telegramの暗号通貨シグナルの約1/3は信頼性が低い。2024-2025年にマルウェア攻撃が2000%増加。参加時は十分な検証が必要。

### 6-1d. 日本語暗号通貨コミュニティ

| 名前 | プラットフォーム | 説明 |
|---|---|---|
| **KudasaiJP** | Telegram/X | 日本最大級暗号資産コミュニティ（`@kudasai_japan`） |
| **boarding bridge (bb)** | Discord | DeFi/GameFi/NFT/エアドロップ情報 |
| **NinjaGuild_Japan (NGG)** | LINE/Discord/Telegram | 暗号資産/Web3情報交換（`@ngg_japan`） |

### 6-2. Slack

| ワークスペース | 特徴 |
|---|---|
| **MLOps Community** | MLOps実務者コミュニティ（15K+メンバー） |
| **dbt Community** | データエンジニアリング |
| **Locally Optimistic** | データ分析 |

### 6-3. GitHub Discussions

```
# リポジトリ内ディスカッション
https://github.com/{owner}/{repo}/discussions?q={keyword}

# 注目ディスカッション
https://github.com/langchain-ai/langchain/discussions
https://github.com/microsoft/autogen/discussions
https://github.com/vllm-project/vllm/discussions
```

### 6-4. Stack Overflow AI Tags

```
# AI関連タグ
https://stackoverflow.com/questions/tagged/large-language-model
https://stackoverflow.com/questions/tagged/langchain
https://stackoverflow.com/questions/tagged/openai-api
https://stackoverflow.com/questions/tagged/huggingface-transformers
https://stackoverflow.com/questions/tagged/pytorch
```

---

## 研究トラック別検索ガイド

### Track 1: LLMオーケストレーション & エージェント協調

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"multi-agent" "LLM"` | AutoGen, CAMEL, MetaGPT |
| `"agent collaboration"` | Voyager, Generative Agents |
| `"tool-augmented LLM"` | Toolformer, Gorilla |
| `"ReAct"` | ReAct: Synergizing Reasoning and Acting |
| `"tree of thoughts"` | Tree of Thoughts: Deliberate Problem Solving |
| `"function calling"` | Tool Use in LLMs |
| `"agentic workflow"` | Agentic Patterns (Andrew Ng) |

```
# Arxiv検索
https://arxiv.org/search/?query="multi-agent"+LLM&searchtype=all&order=-announced_date_first

# Semantic Scholar
https://www.semanticscholar.org/search?q=multi-agent+LLM+collaboration&sort=relevance
```

### Track 2: メモリ & リフレクション

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"long-term memory" "LLM"` | MemGPT, Mem0 |
| `"reflection" "agent"` | Reflexion, Self-Refine |
| `"retrieval augmented"` | RAG, RETRO, Atlas |
| `"episodic memory"` | Generative Agents (Stanford) |
| `"knowledge graph" "LLM"` | GraphRAG (Microsoft) |
| `"context window" "extension"` | LongRoPE, YaRN, ALiBi |

```
# Arxiv検索
https://arxiv.org/search/?query="memory"+LLM+agent&searchtype=all&order=-announced_date_first
```

### Track 3: マルチモーダル統合

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"vision language action"` | VLA, RT-2 |
| `"multimodal LLM"` | GPT-4V, Gemini, LLaVA |
| `"text-to-video"` | Sora, Veo, Kling |
| `"text-to-image"` | DALL-E 3, Stable Diffusion 3, Flux |
| `"code generation" "multimodal"` | CogAgent, SeeClick |
| `"embodied AI"` | PaLM-E, SayCan |

```
# Arxiv検索
https://arxiv.org/search/?query="vision+language+action"+OR+"VLA"&searchtype=all
```

### Track 4: 効率化 & スケーリング

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"mixture of experts"` | Mixtral, Switch Transformer |
| `"quantization" "LLM"` | GPTQ, AWQ, GGUF |
| `"knowledge distillation"` | TinyLlama, Phi |
| `"flash attention"` | FlashAttention-2, FlashAttention-3 |
| `"speculative decoding"` | Medusa, EAGLE |
| `"scaling laws"` | Chinchilla, Kaplan et al. |

### Track 5: アライメント & 安全性

| キーワード | 代表論文/プロジェクト |
|---|---|
| `"RLHF"` | InstructGPT, Constitutional AI |
| `"DPO"` | Direct Preference Optimization |
| `"red teaming"` | Red Teaming LLMs |
| `"jailbreak"` | Jailbreak Attacks & Defenses |
| `"AI safety"` | Anthropic Research, ARC |
| `"interpretability"` | Mechanistic Interpretability |

---

## Layer 7: 暗号通貨オンチェーン分析プラットフォーム

### 7-1. オンチェーン分析

| プラットフォーム | URL | API | 無料 | 主機能 |
|---|---|---|---|---|
| **Nansen** | `https://www.nansen.ai` | あり | トライアル | 500M+ラベル付きアドレス、20+チェーン、スマートマネー追跡 |
| **Dune Analytics** | `https://dune.com` | あり | あり（基本） | SQLでブロックチェーンデータをクエリ、100+チェーン、150万+ダッシュボード |
| **Glassnode** | `https://glassnode.com` | あり | あり（制限付き） | BTC/ETH特化、ネットワーク健全性、供給/需要シグナル |
| **CryptoQuant** | `https://cryptoquant.com` | あり | あり（制限付き） | マイナー/ホエール/取引所フロー分析 |
| **DeFiLlama** | `https://defillama.com` | あり（無料） | 完全無料 | TVL追跡のゴールドスタンダード、広告なし |
| **Chainalysis** | `https://www.chainalysis.com` | あり | エンタープライズ | トランザクション追跡、コンプライアンス |
| **Messari** | `https://messari.io` | あり | あり（制限付き） | プロトコルリサーチ、ガバナンスデータ |
| **Santiment** | `https://santiment.net` | あり | あり（制限付き） | ソーシャルトレンド、センチメント+オンチェーン統合 |
| **Etherscan** | `https://etherscan.io` | あり | あり | Ethereumブロックエクスプローラー |

### 7-2. ホエール追跡

| プラットフォーム | URL | 主機能 |
|---|---|---|
| **Arkham Intelligence** | `https://www.arkham.ai` | 800M+ウォレットラベル、Ultra AIエンジン、カスタムアラート |
| **Whale Alert** | `https://whale-alert.io` | リアルタイム大口取引通知（API提供） |
| **DeBank** | `https://debank.com` | DeFiウォレット透明性、ポートフォリオ追跡 |
| **Whalemap** | `https://www.whalemap.io` | BTC特化ホエール行動マッピング |

### 7-3. センチメント分析

| プラットフォーム | URL | 主機能 |
|---|---|---|
| **The Tie** | `https://www.thetie.io` | 2017年~1000+暗号通貨のソーシャルデータ |
| **Santiment** | `https://santiment.net` | トレンドコイン発見、時間軸別トピック分析 |
| **StockGeist** | `https://www.stockgeist.ai` | リアルタイム暗号通貨センチメント、多言語対応 |
| **CFGI.io** | `https://cfgi.io` | 52+トークンのFear & Greedインデックス |
| **Token Metrics** | `https://www.tokenmetrics.com` | AI予測シグナル、ファンダメンタルスコア |

### 7-4. 検索テンプレート（オンチェーン）

```
# Dune Analytics ダッシュボード検索
https://dune.com/browse/dashboards?q={keyword}

# DeFiLlama TVL検索
https://defillama.com/protocols

# Etherscan アドレス/トランザクション検索
https://etherscan.io/search?f=0&q={address_or_tx}

# CoinGecko トークン検索
https://www.coingecko.com/en/search?query={keyword}

# Nansen スマートマネー
https://app.nansen.ai/smart-money

# Arkham Intelligence
https://platform.arkhamintelligence.com/explorer
```

---

## Layer 8: 暗号通貨データAPI

### 8-1. 無料市場データAPI

| API | URL | キー不要 | 主機能 |
|---|---|---|---|
| **CoinGecko API** | `https://www.coingecko.com/api` | 基本はキー不要 | 70+エンドポイント、価格/OHLC/オンチェーン/DEX/NFT |
| **CoinMarketCap API** | `https://coinmarketcap.com/api` | 要登録（無料） | 2.4M+トークン、790+取引所 |
| **FreeCryptoAPI** | `https://freecryptoapi.com` | 要登録（無料） | Binance/OKX/Bybit等の標準化データ |

### 8-2. 取引所API

| 取引所 | API Doc | 特徴 |
|---|---|---|
| **Bitget** | `https://www.bitget.com/api-doc/` | V2 API: Spot/Earn/Shark Fin対応（Dual Investment APIは非公開） |
| **Binance** | `https://binance-docs.github.io/apidocs/` | 最大の取引量、Spot/Futures/Earn |
| **Bybit** | `https://bybit-exchange.github.io/docs/` | Spot/Derivatives/Earn |
| **OKX** | `https://www.okx.com/docs-v5/` | Spot/Futures/Options/Earn |
| **Coinbase** | `https://docs.cloud.coinbase.com/` | 米国最大、規制対応 |

### 8-2b. 追加マーケットデータAPI

| API | URL | 無料枠 | レート制限 | 認証 |
|---|---|---|---|---|
| **CoinAPI** | `https://www.coinapi.io` | 限定無料 | プランによる | APIキー |
| **CoinPaprika** | `https://api.coinpaprika.com` | 無料あり | プランによる | APIキー |
| **EODHD** | `https://eodhd.com` | 20回/日(無料) | プランによる | APIキー |
| **Messari** | `https://messari.io/api` | 無料枠あり | プランによる | APIキー |
| **CoinRanking** | `https://coinranking.com` | 無料あり | プランによる | APIキー |

### 8-2c. オンチェーンデータAPI

| API | URL | データ種別 | 無料枠 | 認証 |
|---|---|---|---|---|
| **Glassnode API** | `https://glassnode.com` | MVRV, NUPL, SOPR, HODL Waves | 限定無料(T3指標) | APIキー |
| **CryptoQuant API** | `https://cryptoquant.com` | 取引所フロー, マイナーデータ | 限定無料 | APIキー |
| **Nansen API** | `https://www.nansen.ai` | 500M+ラベル付きウォレット | 有料(トライアルあり) | APIキー |
| **IntoTheBlock** | `https://www.intotheblock.com` | AI予測, オンチェーン指標 | 限定無料 | APIキー |
| **Dune API** | `https://dune.com` | SQLクエリ型オンチェーン分析 | 無料(コミュニティ) | APIキー |

### 8-2d. DeFi・TVL API

| API | URL | データ種別 | 無料枠 | 認証 |
|---|---|---|---|---|
| **DefiLlama API** | `https://api-docs.defillama.com` | TVL, APY, Volume, Fees, Bridge | 完全無料 | 不要 |
| **Zapper API** | `https://zapper.xyz` | ポートフォリオ追跡, DeFiポジション | API限定提供 | APIキー |
| **1inch API** | `https://1inch.io` | DEXアグリゲーション, スワップ | 無料 | APIキー |

### 8-2e. センチメント・ソーシャルAPI

| API | URL | データ種別 | 無料枠 | 認証 |
|---|---|---|---|---|
| **LunarCrush** | `https://lunarcrush.com` | Galaxy Score, ソーシャルメトリクス | 限定無料 | APIキー |
| **Santiment API** | `https://api.santiment.net` | ソーシャル+オンチェーン複合 | 限定無料 | APIキー(GraphQL) |
| **Alternative.me** | `https://alternative.me/crypto/fear-and-greed-index/` | Fear & Greed Index | 完全無料 | 不要 |

### 8-2f. ホエール追跡API

| API | URL | データ種別 | 無料枠 | 認証 |
|---|---|---|---|---|
| **Whale Alert API** | `https://whale-alert.io` | 大口送金(100+チェーン) | X/Telegram通知は無料 | APIキー($49/月〜) |
| **Arkham API** | `https://intel.arkm.com` | ウォレット特定, KOL追跡 | 無料(Web) | APIキー(有料) |

### 8-2g. ブロックチェーンノードAPI

| API | URL | データ種別 | 無料枠 | 認証 |
|---|---|---|---|---|
| **Blockstream Esplora** | `https://github.com/Blockstream/esplora` | BTC/Liquid(アドレス, TX, UTXO) | 完全無料 | 不要 |
| **mempool.space** | `https://mempool.space/docs/api/rest` | BTCメンプール, 手数料推定 | 完全無料 | 不要 |
| **BlockCypher** | `https://www.blockcypher.com` | BTC/ETH/LTC(アドレス, TX) | 200回/時(無料) | APIキー |
| **Blockchair** | `https://blockchair.com/api/docs` | 14チェーン(集約クエリ対応) | 限定無料 | APIキー |
| **Alchemy** | `https://www.alchemy.com` | EVM全般, NFT, WebSocket | 無料枠あり | APIキー |
| **QuickNode** | `https://www.quicknode.com` | マルチチェーンRPC | 無料枠あり | APIキー |
| **Moralis** | `https://moralis.io` | NFT, EVM, Solana | 無料枠あり | APIキー |

### 8-2h. NFT API

| API | URL | データ種別 | 無料枠 | 認証 |
|---|---|---|---|---|
| **Moralis NFT API** | `https://moralis.io` | NFTメタデータ, 最多チェーン対応 | 無料枠あり | APIキー |
| **OpenSea API** | `https://docs.opensea.io` | NFTマーケットデータ, ストリーム | 無料(帰属表示必須) | APIキー |
| **Alchemy NFT API** | `https://www.alchemy.com` | クロスチェーンNFT | 無料 | APIキー |
| **SimpleHash** | `https://simplehash.com` | 20チェーン, フロア価格, スパムフィルタ | 限定無料 | APIキー |

### 8-3. 統合ライブラリ

| ライブラリ | GitHub | 言語 | 特徴 |
|---|---|---|---|
| **CCXT** | `ccxt/ccxt` (40.9K★) | Python/JS/PHP | 100+取引所統合、業界標準 |
| **python-binance** | `sammchardy/python-binance` | Python | Binance特化 |
| **ccxt-rest** | `ccxt/ccxt/rest` | REST API | CCXT REST wrapper |

### 8-4. 検索テンプレート（API）

```
# CoinGecko API: 価格取得
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,jpy

# CoinGecko API: OHLC
GET https://api.coingecko.com/api/v3/coins/{id}/ohlc?vs_currency=usd&days=30

# CoinGecko API: トレンド
GET https://api.coingecko.com/api/v3/search/trending

# CoinMarketCap API: ランキング
GET https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100

# Whale Alert API: 大口送金
GET https://api.whale-alert.io/v1/transactions?api_key={key}&min_value=500000
```

---

## Layer 9: 暗号通貨トレーディングツール

### 9-1. オープンソーストレーディングBot

| Bot | GitHub | 言語 | 特徴 |
|---|---|---|---|
| **Freqtrade** | `freqtrade/freqtrade` | Python | 全主要取引所対応、バックテスト、ML最適化、Telegram/WebUI |
| **Hummingbot** | `hummingbot/hummingbot` | Python | CEX/DEXマーケットメイキング、Apache 2.0 |
| **Superalgos** | `Superalgos/Superalgos` | JS | ビジュアルBot設計、チャート統合 |
| **Jesse** | `jesse-ai/jesse` | Python | 高柔軟性、金融指標/ML連携 |
| **OctoBot** | `Drakkar-Software/OctoBot` | Python | テクニカル/ソーシャル/AI指標対応 |

### 9-2. アルゴリズム取引プラットフォーム

| プラットフォーム | URL | 特徴 |
|---|---|---|
| **QuantConnect** | `https://www.quantconnect.com` | オープンソース、300K+投資家、マルチアセット |
| **Cryptohopper** | `https://www.cryptohopper.com` | 24/7クラウドBot、AI機能 |
| **TradingView** | `https://www.tradingview.com` | Pine Script v6、80種+テクニカル指標 |
| **Tradetron** | `https://tradetron.tech` | ノーコード戦略構築 |

### 9-3. DEXアグリゲーター

| アグリゲーター | URL | 特徴 |
|---|---|---|
| **1inch** | `https://1inch.io` | 400+流動性プロバイダー、12チェーン |
| **Jupiter** | `https://jup.ag` | Solana最大のDEXアグリゲーター |
| **OpenOcean** | `https://openocean.finance` | 30+チェーン、1000+プール |

### 9-4. ポートフォリオ追跡・税務

| ツール | URL | 種別 | 特徴 |
|---|---|---|---|
| **CoinStats** | `https://coinstats.app` | ポートフォリオ | 20K+暗号通貨対応 |
| **Koinly** | `https://koinly.io` | ポートフォリオ/税務 | 700+統合 |
| **CoinLedger** | `https://coinledger.io` | ポートフォリオ/税務 | 800+ブロックチェーン |

---

## Layer 10: 暗号通貨ニュース・メディア

### 10-1. 英語圏メディア

| サイト | URL | 特徴 |
|---|---|---|
| **CoinDesk** | `https://coindesk.com` | 最大級暗号通貨メディア、2013年創設 |
| **Cointelegraph** | `https://cointelegraph.com` | 世界最大規模、多言語対応 |
| **The Block** | `https://theblock.co` | ニュース+ライブデータ |
| **Decrypt** | `https://decrypt.co` | 初心者向け無料コース付き |
| **Crypto.news** | `https://crypto.news` | BTC/ETH/DeFi/NFT/規制 |

### 10-2. 日本語メディア

| サイト | URL | 特徴 |
|---|---|---|
| **CoinPost** | `https://coinpost.jp` | 国内最大級、世界3位の月間訪問者 |
| **CRYPTO TIMES** | `https://crypto-times.jp` | 総合ニュース・リサーチ |
| **あたらしい経済** | `https://neweconomy.jp` | 幻冬舎運営、ポッドキャスト/YouTube |
| **CoinDesk JAPAN** | `https://coindeskjapan.com` | 暗号資産/Web3ビジネスニュース |
| **HEDGE GUIDE Web3** | `https://hedge.guide` | サステナビリティ×ブロックチェーン |

### 10-3. 中国語圏メディア・コミュニティ

| サイト | URL | 特徴 |
|---|---|---|
| **白話区塊鏈** | `https://www.hellobtc.com` | ブロックチェーン科普・入門学習 |
| **登鏈社区** | `https://learnblockchain.cn` | Web3開発者コミュニティ |
| **Web3Caff** | `https://web3caff.com` | Web3/RWA深度分析 |
| **BlockBeats** | `https://www.theblockbeats.info` | 暗号通貨市場ニュース |
| **知乎（暗号通貨）** | `https://www.zhihu.com` | 長文議論・投資分析 |

### 10-4. 暗号通貨ニュースレター

| 名前 | URL | 頻度 | 内容 |
|---|---|---|---|
| **Milk Road** | `https://milkroad.com` | 毎日 | 5分デイリー暗号通貨ニュース |
| **Bankless** | `https://bankless.com` | 週2-3回 | DeFi・Ethereum特化（22万+購読者） |
| **Glassnode Insights** | `https://insights.glassnode.com` | 毎週 | オンチェーンデータ分析（80万+読者） |
| **The Defiant** | `https://thedefiant.io` | 毎日 | DeFi特化（8万+読者） |
| **Week in Ethereum** | `https://weekinethereumnews.com` | 毎週 | Ethereum開発者向け |
| **Crypto Research (Demelza Hays)** | Substack | 週1 | プロ金融分析 |

### 10-5. 検索テンプレート（ニュース）

```
# CoinDesk検索
https://www.coindesk.com/search?s={keyword}

# Cointelegraph検索
https://cointelegraph.com/search?query={keyword}

# CoinPost検索（日本語）
https://coinpost.jp/?s={keyword}

# CoinGecko ニュース
https://www.coingecko.com/en/news?keyword={keyword}
```

---

## 暗号通貨研究トラック別検索ガイド

### Track C1: Dual Investment & ストラクチャードプロダクト

| キーワード | 代表ツール/概念 |
|---|---|
| `"dual investment" cryptocurrency` | Bitget/Binance/Bybit Dual Investment |
| `"covered call" crypto` | Sell High = Covered Call戦略 |
| `"cash-secured put" crypto` | Buy Low = Cash-Secured Put戦略 |
| `"wheel strategy" crypto` | Buy Low→Sell High循環戦略 |
| `"structured products" DeFi` | Ribbon Finance, StakeDAO |

### Track C2: DeFi & オンチェーン

| キーワード | 代表プロジェクト |
|---|---|
| `"yield farming" "liquidity mining"` | Uniswap, Aave, Compound |
| `"DEX aggregator"` | 1inch, Jupiter, OpenOcean |
| `"liquid staking"` | Lido, Rocket Pool |
| `"real world assets" RWA` | Ondo Finance, Maple Finance |
| `"TVL" "total value locked"` | DeFiLlama追跡 |

### Track C3: オンチェーン分析 & ホエール

| キーワード | 代表ツール |
|---|---|
| `"whale tracking" "on-chain"` | Arkham, Nansen, Whale Alert |
| `"smart money" crypto` | Nansen Smart Money追跡 |
| `"exchange flow" "net flow"` | CryptoQuant, Glassnode |
| `"MVRV" OR "NVT" OR "SOPR"` | Glassnode指標 |

### Track C4: トレーディングBot & 自動化

| キーワード | 代表プロジェクト |
|---|---|
| `"crypto trading bot" "open source"` | Freqtrade, Hummingbot, OctoBot |
| `"grid trading" automation` | Pionex, Bitget Grid |
| `"DCA" "dollar cost averaging" crypto` | 自動積立戦略 |
| `"backtesting" cryptocurrency` | Freqtrade, Jesse |
| `"CCXT" exchange API` | 100+取引所統合ライブラリ |

---

## 暗号通貨プラットフォーム別検索テンプレート

### X (Twitter) 暗号通貨検索テンプレート

#### バイラル検索
```
# 英語
(crypto OR bitcoin OR ethereum OR BTC OR ETH) (breaking OR just OR announced OR alert) min_faves:500 -filter:replies

# 日本語
(暗号通貨 OR 仮想通貨 OR ビットコイン) (速報 OR 緊急 OR 重大) min_faves:100 lang:ja

# 中国語
(加密货币 OR 比特币 OR 以太坊) (突发 OR 重大 OR 最新) min_faves:200 lang:zh
```

#### ホエールアラート検索
```
from:whale_alert (transferred OR moved OR minted OR burned) min_faves:100
(whale OR 🐳) (transfer OR moved OR exchange) (BTC OR ETH OR USDT) min_faves:200
from:lookonchain (whale OR smart money OR bought OR sold) min_faves:300
```

#### 新規上場情報検索
```
# 英語
(listing OR listed OR "will list" OR "new listing") (Binance OR Coinbase OR OKX OR Bybit) min_faves:100

# 日本語
(上場 OR リスティング OR 新規取扱) (バイナンス OR コインベース OR ビットフライヤー) lang:ja

# 中国語
(上币 OR 新上线 OR 首发) (币安 OR OKX OR Coinbase) lang:zh min_faves:50
```

#### DeFiトレンド検索
```
(DeFi OR "yield farming" OR "liquid staking" OR restaking OR TVL) (new OR launch OR live OR alpha) min_faves:200 -filter:replies
(airdrop OR エアドロップ OR 空投) (confirmed OR live OR claim) min_faves:300
("on-chain" OR onchain) (analysis OR data OR signal OR alpha) min_faves:100 -filter:replies
```

#### トレーディングシグナル検索
```
(BTC OR ETH OR $BTC OR $ETH) (breakout OR reversal OR support OR resistance) (chart OR TA OR analysis) min_faves:100
(funding rate OR open interest OR liquidation) (high OR extreme OR record) min_faves:50
(Fear Greed Index OR "fear and greed") (extreme OR shift OR change) min_faves:50
```

#### 規制ニュース検索
```
# 英語
(SEC OR CFTC OR MiCA OR regulation OR regulatory) (crypto OR bitcoin OR ethereum OR stablecoin) min_faves:200

# 日本語
(金融庁 OR 規制 OR 法案) (暗号資産 OR 仮想通貨 OR ステーブルコイン) lang:ja min_faves:30
```

### Reddit 暗号通貨検索テンプレート

#### 取引戦略ディスカッション
```
subreddit:CryptoMarkets (strategy OR trading plan OR risk management OR position sizing)
subreddit:CryptoCurrency (DCA OR dollar cost averaging OR accumulation strategy) flair:"STRATEGY"
subreddit:algotrading (crypto OR bitcoin OR cryptocurrency) (backtest OR strategy OR bot)
```

#### テクニカル分析
```
subreddit:CryptoMarkets (technical analysis OR TA OR chart) (BTC OR ETH OR bitcoin)
subreddit:CryptoCurrency (RSI OR MACD OR "Bollinger Bands" OR "moving average") flair:"ANALYSIS"
subreddit:BitcoinMarkets (weekly OR daily) (analysis OR outlook OR prediction)
```

#### DeFiプロトコルレビュー
```
subreddit:defi (review OR comparison OR audit) (Aave OR Compound OR Uniswap OR Lido)
subreddit:defi (yield OR APY OR APR) (best OR highest OR safe OR risk)
subreddit:ethereum (DeFi OR protocol OR TVL) (new OR launch OR update)
```

#### オンチェーン分析
```
subreddit:CryptoCurrency (on-chain OR onchain) (MVRV OR NVT OR SOPR OR whale)
subreddit:CryptoMarkets (Glassnode OR CryptoQuant OR Nansen) (data OR analysis OR signal)
```

#### 開発者向け
```
subreddit:ethdev (Solidity OR Hardhat OR Foundry) (tutorial OR guide OR best practice)
subreddit:solana (Rust OR Anchor) (smart contract OR program OR development)
subreddit:cosmosnetwork (IBC OR CosmWasm) (development OR tutorial)
```

### GitHub 暗号通貨検索テンプレート

#### トレーディングBot
| リポジトリ | URL | 特徴 |
|---|---|---|
| **freqtrade** | `github.com/freqtrade/freqtrade` | Python, ML最適化, 最人気 |
| **hummingbot** | `github.com/hummingbot/hummingbot` | HFT, マーケットメイキング |
| **OctoBot** | `github.com/Drakkar-Software/OctoBot` | CCXT統合, AI指標 |
| **Superalgos** | `github.com/Superalgos/Superalgos` | ビジュアルデザイン |
| **Jesse** | `github.com/jesse-ai/jesse` | バックテスト特化 |
| **Krypto-trading-bot** | `github.com/ctubio/Krypto-trading-bot` | C++ HFT |
| **awesome-crypto-trading-bots** | `github.com/botcrypto-io/awesome-crypto-trading-bots` | キュレーションリスト |

#### DeFi開発ツール
| リポジトリ | URL | 特徴 |
|---|---|---|
| **Uniswap V3 SDK** | `github.com/Uniswap/v3-sdk` | AMM統合 |
| **Aave V3 Core** | `github.com/aave/aave-v3-core` | レンディングコントラクト |
| **OpenZeppelin** | `github.com/OpenZeppelin/openzeppelin-contracts` | セキュリティ標準 |
| **Foundry** | `github.com/foundry-rs/foundry` | Solidityテストフレームワーク |
| **Hardhat** | `github.com/NomicFoundation/hardhat` | Ethereum開発環境 |
| **Scaffold-ETH 2** | `github.com/scaffold-eth/scaffold-eth-2` | フルスタックdApp |
| **DeFi Developer Road Map** | `github.com/OffcierCia/DeFi-Developer-Road-Map` | 学習ロードマップ |

#### ブロックチェーン分析ツール
| リポジトリ | URL | 特徴 |
|---|---|---|
| **CCXT** | `github.com/ccxt/ccxt` | 108取引所統合API |
| **DefiLlama SDK** | `github.com/DefiLlama/api-sdk` | TVL/APYデータ |
| **DefiLlama yield-server** | `github.com/DefiLlama/yield-server` | イールドデータ |

```
# GitHub検索クエリ例
# トレーディングBot（Python, Stars順）
https://github.com/search?q=crypto+trading+bot+language%3APython&type=repositories&s=stars

# DeFi開発フレームワーク
https://github.com/search?q=defi+framework&type=repositories&s=stars

# オンチェーン分析ツール
https://github.com/search?q=on-chain+analysis&type=repositories&s=stars

# MEV Bot
https://github.com/search?q=MEV+bot&type=repositories&s=stars
```

---

## gpt-researcher 統合

### 統合モード

| モード | 動作 | 適用場面 |
|---|---|---|
| **quick** | WebSearch + SNS検索のみ（APIキー不要） | 速報・トレンド確認 |
| **standard** | quick + note.com API + Reddit API | 日常リサーチ |
| **deep** | standard + gpt-researcher deep_research | 包括的調査レポート |
| **academic** | Layer 1-2特化（Arxiv/S2/PwC + キュレーション） | 論文サーベイ |
| **survey** | academic + Layer 3（ブログ解説）+ 研究トラック分析 | 研究動向レポート |
| **ecosystem** | Layer 4特化（GitHub/HF/フレームワーク比較） | 実装調査 |
| **crypto** | Layer 7-10特化（オンチェーン/API/トレーディング/ニュース） | 暗号通貨調査 |
| **crypto-deep** | crypto + Layer 5-6（SNS/コミュニティ）+ gpt-researcher | 暗号通貨包括調査 |
| **api-quick** | Tavily + Brave API（高速API検索） | 高精度ファクトチェック |
| **api-deep** | 全5API + クロス検証 + 6層検索 | 徹底調査・出典付きレポート |
| **api-news** | NewsAPI + Perplexity | ニュース・トレンド特化 |
| **api-trend** | Brave + NewsAPI + Perplexity | トレンド分析・市場調査 |

### 実行フロー（5 API統合版）

```
入力: /world-research キーワード=MCP Server モード=deep

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 0: API自動検出 & 初期化
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  .envファイルを読み込み、利用可能なAPIを検出:

  source .env 2>/dev/null
  AVAILABLE_APIS=()
  [ -n "$TAVILY_API_KEY" ]       && AVAILABLE_APIS+=(tavily)
  [ -n "$SERPAPI_API_KEY" ]       && AVAILABLE_APIS+=(serpapi)
  [ -n "$BRAVE_SEARCH_API_KEY" ]  && AVAILABLE_APIS+=(brave)
  [ -n "$NEWS_API_KEY" ]          && AVAILABLE_APIS+=(newsapi)
  [ -n "$PERPLEXITY_API_KEY" ]    && AVAILABLE_APIS+=(perplexity)

  検出結果を表示:
  ├── ✅ Tavily      → Layer全般の補完検索
  ├── ✅ SerpAPI     → Google SERP + リッチスニペット
  ├── ✅ Brave       → 独立インデックス（Google非依存）
  ├── ✅ NewsAPI     → ニュース・時事層（80,000+ソース）
  └── ✅ Perplexity  → AI要約 + 引用付き回答

  APIがゼロの場合 → WebSearch + WebFetchのみで続行（従来動作）
  APIが1つ以上   → 各Stepで自動活用

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: キーワード展開
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MCP Server → MCP, Model Context Protocol, MCPサーバー, MCP服务器
  学術変換 → "model context protocol" "tool integration" "LLM plugin"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 2: Layer 1 学術検索（並列実行・最大3バッチ）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Batch 2-A] WebSearch（最大3並列）
  ├── Arxiv: "model context protocol" OR "MCP" cat:cs.CL
  ├── Semantic Scholar: model context protocol LLM
  └── Papers with Code: MCP server

  [Batch 2-B] API補完（APIがある場合、最大3並列）
  ├── 🔍 SerpAPI: Google Scholar結果をJSON取得
  │   curl "https://serpapi.com/search.json?engine=google_scholar&q=MCP+Server&api_key=$SERPAPI_API_KEY"
  ├── 🔍 Tavily: AI検索で学術コンテンツ取得（search_depth=advanced）
  │   curl -X POST "https://api.tavily.com/search" \
  │     -H "Content-Type: application/json" \
  │     -d '{"api_key":"'"$TAVILY_API_KEY"'","query":"MCP Server academic research","search_depth":"advanced","include_domains":["arxiv.org","scholar.google.com","semanticscholar.org"]}'
  └── 🔍 Perplexity: AI要約で学術動向を取得
      curl -X POST "https://api.perplexity.ai/chat/completions" \
        -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"model":"sonar","messages":[{"role":"user","content":"Latest academic research on MCP Server Model Context Protocol 2025-2026. List key papers, authors, citations."}]}'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 3: Layer 2 キュレーション確認（並列実行）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Batch 3-A] WebSearch（最大3並列）
  ├── HF Daily Papers: MCP
  ├── @_akhaliq: from:_akhaliq "MCP"
  └── Alpha Signal: MCP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 4: Layer 3 ブログ・解説検索
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Batch 4-A] WebSearch（最大3並列）
  ├── site:lilianweng.github.io MCP
  ├── site:huggingface.co/blog MCP
  └── Anthropic Research: MCP

  [Batch 4-B] API補完（APIがある場合、最大3並列）
  ├── 🔍 Brave: 独立インデックスでブログ記事検索（Google非依存の補完）
  │   curl -H "X-Subscription-Token: $BRAVE_SEARCH_API_KEY" \
  │     "https://api.search.brave.com/res/v1/web/search?q=MCP+Server+tutorial+guide+blog&count=20&freshness=pm"
  ├── 🔍 Tavily: AI検索でチュートリアル・解説記事取得
  │   curl -X POST "https://api.tavily.com/search" \
  │     -H "Content-Type: application/json" \
  │     -d '{"api_key":"'"$TAVILY_API_KEY"'","query":"MCP Server guide tutorial explanation","search_depth":"basic","max_results":10}'
  └── (次Stepの先行ロード)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 5: Layer 4 実装エコシステム検索
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Batch 5-A] WebSearch（最大3並列）
  ├── GitHub: MCP server stars:>100
  ├── HF Hub: MCP
  └── npm/PyPI: MCP server

  [Batch 5-B] API補完（APIがある場合、最大3並列）
  ├── 🔍 SerpAPI: Google検索でGitHub/npm/PyPIリポジトリ発見
  │   curl "https://serpapi.com/search.json?q=MCP+Server+site:github.com&api_key=$SERPAPI_API_KEY&num=20"
  ├── 🔍 Brave: 独立インデックスでOSS発見
  │   curl -H "X-Subscription-Token: $BRAVE_SEARCH_API_KEY" \
  │     "https://api.search.brave.com/res/v1/web/search?q=MCP+Server+open+source+framework&count=20"
  └── 🔍 Perplexity: 実装エコシステム全体像のAI要約
      curl -X POST "https://api.perplexity.ai/chat/completions" \
        -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"model":"sonar","messages":[{"role":"user","content":"MCP Server implementation ecosystem: top frameworks, libraries, GitHub repos, and tools in 2025-2026"}]}'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 6: Layer 5 SNS横断検索（並列実行）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Batch 6-A] WebSearch（最大3並列）
  ├── X: "MCP Server" min_faves:100 lang:en/ja/zh
  ├── Reddit: subreddit:ClaudeAI "MCP"
  └── note.com: https://note.com/search?q=MCP+Server

  [Batch 6-B] WebSearch（最大3並列）
  ├── YouTube: MCP Server tutorial 2026
  ├── Bilibili: MCP Server AI Agent
  └── Medium: "MCP Server" "AI Agent"

  [Batch 6-C] API補完: ニュース・トレンド（最大3並列）
  ├── 🔍 NewsAPI: 最新ニュース記事を時系列取得
  │   curl "https://newsapi.org/v2/everything?q=MCP+Server+OR+%22Model+Context+Protocol%22&language=en&sortBy=publishedAt&pageSize=20&apiKey=$NEWS_API_KEY"
  ├── 🔍 NewsAPI(JP): 日本語ニュース
  │   curl "https://newsapi.org/v2/everything?q=MCP%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC&language=ja&sortBy=publishedAt&pageSize=10&apiKey=$NEWS_API_KEY"
  └── 🔍 Tavily: SNS・ニュース横断AI検索
      curl -X POST "https://api.tavily.com/search" \
        -H "Content-Type: application/json" \
        -d '{"api_key":"'"$TAVILY_API_KEY"'","query":"MCP Server latest news trends 2026","search_depth":"advanced","max_results":15}'

  [Batch 6-D] API補完: 比較・分析（最大3並列）
  ├── 🔍 SerpAPI: YouTube動画メタデータ取得
  │   curl "https://serpapi.com/search.json?engine=youtube&search_query=MCP+Server+2026&api_key=$SERPAPI_API_KEY"
  ├── 🔍 Brave: SNS投稿・ディスカッション検索
  │   curl -H "X-Subscription-Token: $BRAVE_SEARCH_API_KEY" \
  │     "https://api.search.brave.com/res/v1/web/search?q=MCP+Server+discussion+opinion+review&count=20&freshness=pw"
  └── 🔍 Perplexity: SNS動向のAI要約
      curl -X POST "https://api.perplexity.ai/chat/completions" \
        -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"model":"sonar","messages":[{"role":"user","content":"What are people saying about MCP Server on Twitter, Reddit, YouTube, and tech blogs in 2025-2026? Summarize sentiment and key opinions."}]}'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 7: Layer 6 コミュニティ検索
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Batch 7-A] WebSearch（最大3並列）
  ├── HN: https://hn.algolia.com/?q=MCP+server
  ├── Stack Overflow: [mcp] or MCP server
  └── GitHub Discussions: MCP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 8: gpt-researcher deep_research（deepモード時）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → 100+ソース探索
  → 検証・フィルタリング
  → 引用付きレポート生成

  ※ gpt-researcher未設定の場合のフォールバック:
  ├── 🔍 Perplexity: 包括的AI調査（gpt-researcher代替）
  │   curl -X POST "https://api.perplexity.ai/chat/completions" \
  │     -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  │     -H "Content-Type: application/json" \
  │     -d '{"model":"sonar-pro","messages":[{"role":"user","content":"Comprehensive deep research report on MCP Server: history, architecture, key implementations, adoption trends, challenges, future outlook. Include citations."}]}'
  ├── 🔍 Tavily: 深掘り検索（search_depth=advanced, max_results=20）
  └── 🔍 Brave: 補完検索 + WebFetchで個別ページ深掘り

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 9: API結果クロスバリデーション & 信頼スコア計算
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  全API結果を統合し、信頼スコアを算出:

  ┌─────────────────────────────────────────────────────┐
  │  Trust Score = Σ(重み × 指標)                        │
  │                                                      │
  │  DA           (0.25): ドメイン権威性                  │
  │  Freshness    (0.20): 情報鮮度（3ヶ月以内=高）       │
  │  CrossVal     (0.30): 複数API間での相互検証           │
  │    → Tavily + Brave + SerpAPI で同じ結果 = 高信頼    │
  │    → 1 APIのみ = 低信頼                              │
  │  Citations    (0.15): 引用・参照数                    │
  │  SNS          (0.10): ソーシャル言及数                │
  └─────────────────────────────────────────────────────┘

  クロスバリデーション手順:
  1. 各APIの結果からURL・タイトル・要点を抽出
  2. 重複URL → 信頼度UP（複数APIが推薦 = 重要ソース）
  3. 矛盾する情報 → 新しい方を優先 + 両方を注記
  4. 孤立した情報（1 APIのみ） → "未検証"タグ付与

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 10: 統合レポート出力
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ├── 学術論文サマリー（Layer 1 + SerpAPI Scholar + Perplexity）
  ├── 技術動向分析（Layer 2-3 + Tavily + Brave）
  ├── 実装エコシステムマップ（Layer 4 + SerpAPI + Perplexity）
  ├── プラットフォーム別バズ投稿（Layer 5 + NewsAPI + Brave）
  ├── キーワード別トレンド分析（全API横断集計）
  ├── 地域別インサイト（日/英/中のAPI結果比較）
  ├── 🆕 API別ソース品質レポート（各APIの貢献度）
  ├── 🆕 信頼スコア付きファクト一覧
  └── 引用・ソースリスト（API出典明記）
```

### API実行プロシージャ（実装詳細）

以下は各APIの**実際の呼び出し手順**。Claude Codeが Bash ツールで実行する。

#### 事前準備: .env読み込み

```bash
# .envファイルの場所を自動検出（プロジェクトルートから探索）
ENV_FILE=""
for dir in "." ".." "../.." "$HOME/Desktop/dev/gem自動生成システム" "$HOME/Desktop/開発2026/リサーチ専門" "$HOME/taisun_agent"; do
  if [ -f "$dir/.env" ]; then
    ENV_FILE="$dir/.env"
    break
  fi
done

if [ -n "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
  echo "✅ .env loaded from $ENV_FILE"
else
  echo "⚠️ .env not found - WebSearch/WebFetchのみで実行"
fi
```

#### Tavily API呼び出し関数

```bash
# Tavily Search: AI検索特化・構造化データ返却
tavily_search() {
  local query="$1"
  local depth="${2:-basic}"  # basic or advanced
  local max="${3:-10}"
  local domains="${4:-}"     # 例: '["arxiv.org","github.com"]'

  local body='{"api_key":"'"$TAVILY_API_KEY"'","query":"'"$query"'","search_depth":"'"$depth"'","max_results":'"$max"

  if [ -n "$domains" ]; then
    body="$body"',"include_domains":'"$domains"
  fi
  body="$body"'}'

  curl -s -X POST "https://api.tavily.com/search" \
    -H "Content-Type: application/json" \
    -d "$body"
}

# 使用例:
# tavily_search "MCP Server latest" "advanced" 15
# tavily_search "美容サロン マーケティング" "basic" 10 '["note.com","hotpepper.jp"]'
```

#### SerpAPI呼び出し関数

```bash
# SerpAPI: Google検索結果 + リッチスニペット + ナレッジグラフ
serpapi_search() {
  local query="$1"
  local engine="${2:-google}"  # google, youtube, google_scholar
  local num="${3:-20}"
  local lang="${4:-ja}"
  local country="${5:-jp}"

  curl -s "https://serpapi.com/search.json?engine=$engine&q=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")&api_key=$SERPAPI_API_KEY&hl=$lang&gl=$country&num=$num"
}

# 使用例:
# serpapi_search "MCP Server" "google" 20 "ja" "jp"
# serpapi_search "MCP Server tutorial" "youtube"
# serpapi_search "Model Context Protocol" "google_scholar"
```

#### Brave Search呼び出し関数

```bash
# Brave Search: 独立インデックス・Google非依存
brave_search() {
  local query="$1"
  local count="${2:-20}"
  local freshness="${3:-}"  # pw=past week, pm=past month, py=past year

  local url="https://api.search.brave.com/res/v1/web/search?q=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")&count=$count"

  if [ -n "$freshness" ]; then
    url="$url&freshness=$freshness"
  fi

  curl -s -H "Accept: application/json" \
    -H "Accept-Encoding: gzip" \
    -H "X-Subscription-Token: $BRAVE_SEARCH_API_KEY" \
    "$url"
}

# 使用例:
# brave_search "MCP Server" 20 "pm"
# brave_search "AI Agent framework comparison" 20 "pw"
```

#### NewsAPI呼び出し関数

```bash
# NewsAPI: 80,000+ニュースソースの集約検索
newsapi_search() {
  local query="$1"
  local lang="${2:-en}"      # en, ja, zh, etc.
  local sort="${3:-publishedAt}"  # relevancy, popularity, publishedAt
  local size="${4:-20}"

  curl -s "https://newsapi.org/v2/everything?q=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")&language=$lang&sortBy=$sort&pageSize=$size&apiKey=$NEWS_API_KEY"
}

# 使用例:
# newsapi_search "MCP Server" "en" "publishedAt" 20
# newsapi_search "AI エージェント" "ja" "relevancy" 10
```

#### Perplexity API呼び出し関数

```bash
# Perplexity: AI検索・引用付き回答・最新情報に強い
perplexity_search() {
  local query="$1"
  local model="${2:-sonar}"  # sonar (standard) or sonar-pro (deep)

  curl -s -X POST "https://api.perplexity.ai/chat/completions" \
    -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "model":"'"$model"'",
      "messages":[{"role":"user","content":"'"$query"'"}]
    }'
}

# 使用例:
# perplexity_search "What is MCP Server and how is it being used in 2026?" "sonar"
# perplexity_search "Comprehensive analysis of AI agent frameworks" "sonar-pro"
```

#### 5 API統合実行パターン

```bash
# ━━━ パターン1: 網羅的検索（standard/deepモード）━━━
# 同一クエリを全5 APIに投げて結果をマージ

QUERY="MCP Server"

# Batch A（最大3並列）
tavily_search "$QUERY" "advanced" 15 &
serpapi_search "$QUERY" "google" 20 &
brave_search "$QUERY" 20 "pm" &
wait

# Batch B（最大3並列）
newsapi_search "$QUERY" "en" "publishedAt" 20 &
perplexity_search "Latest developments on $QUERY in 2025-2026. Include key projects, adoption trends, and expert opinions." &
wait

# ━━━ パターン2: 学術特化（academic/surveyモード）━━━

serpapi_search "$QUERY" "google_scholar" 20 &
tavily_search "$QUERY" "advanced" 15 '["arxiv.org","semanticscholar.org","scholar.google.com"]' &
perplexity_search "Academic papers and research on $QUERY. List top papers with authors and citations." &
wait

# ━━━ パターン3: ニュース・トレンド特化 ━━━

newsapi_search "$QUERY" "en" "publishedAt" 20 &
newsapi_search "$QUERY" "ja" "publishedAt" 10 &
brave_search "$QUERY news trends" 20 "pw" &
wait

# ━━━ パターン4: quickモード（APIなしでも動作）━━━
# WebSearch + WebFetchのみ。APIがあれば Tavily 1回だけ補完

# WebSearch "$QUERY" ← Claude組み込み
# APIがあれば:
tavily_search "$QUERY" "basic" 5
```

#### API結果の統合・重複排除

```
結果統合ルール:
1. 各APIの結果をURLベースで正規化
2. 同一URL → マージ（信頼度UP: 複数APIが推薦）
3. 類似タイトル（Levenshtein距離 < 0.3） → マージ候補
4. 結果をTrust Scoreでソート（降順）
5. Top 50（standard）/ Top 100（deep）を最終結果に

API別の特徴活用:
├── Tavily     → content/raw_content フィールドでページ内容を直接取得（WebFetch不要）
├── SerpAPI    → rich_snippet, knowledge_graph, related_searches を活用
├── Brave      → Google非依存の結果で偏り補正、extra_snippets で追加情報
├── NewsAPI    → publishedAt で時系列分析、source.name でメディア分布
└── Perplexity → citations[] で引用ソース、AI要約で全体像を把握
```

### Research API 環境変数

`.env`ファイルに以下のAPIキーを設定することで、リサーチ精度と網羅性が大幅に向上する。

| 変数 | API | 特徴 | 必須 |
|---|---|---|---|
| `TAVILY_API_KEY` | Tavily Search | AI検索特化・構造化データ返却・高精度 | 推奨 |
| `SERPAPI_API_KEY` | SerpAPI | Google検索結果をJSON取得・リッチスニペット対応 | 推奨 |
| `BRAVE_SEARCH_API_KEY` | Brave Search | 独立インデックス・Google非依存・プライバシー重視 | 推奨 |
| `NEWS_API_KEY` | NewsAPI | ニュース集約・80,000+ソース・時系列分析 | 推奨 |
| `PERPLEXITY_API_KEY` | Perplexity | AI検索・引用付き回答・最新情報に強い | 推奨 |
| `OPENAI_API_KEY` | OpenAI | gpt-researcher連携（deepモード時） | deepモード時 |

> **quick/standard/academicモードはAPIキー不要**（WebSearch + WebFetch + 非公式APIのみ）
> APIキーがある場合は自動的に追加ソースとして活用される。
> **api-*モードは.envの5APIキーが必要**（下記「API強化リサーチ」セクション参照）

### 各APIの詳細実装・統合フロー

> **詳細は上記セクションを参照:**
> - 各APIのcurlコマンド・bash関数 → [API実行プロシージャ（実装詳細）](#api実行プロシージャ実装詳細)
> - 10ステップ統合フロー → [実行フロー（5 API統合版）](#実行フロー5-api統合版)
> - 4つの実行パターン → [統合実行パターン](#統合実行パターン)
> **api-*モードは.envの5APIキーが必要**（下記「API強化リサーチ」セクション参照）

---

## API強化リサーチ（5API統合）

### 概要

`.env` に設定された5つの検索APIを使用して、WebSearch/WebFetchに加えて高精度な検索を実行。
既存の6層アーキテクチャと組み合わせることで、133+ソースの完全網羅型リサーチを実現。

### API一覧

| API | 特徴 | 用途 | 環境変数 | 月間制限 |
|-----|------|------|---------|---------|
| **Tavily** | AI検索特化、高精度 | セマンティック検索、事実確認 | `TAVILY_API_KEY` | 1,000 |
| **SerpAPI** | Google検索結果取得 | SERP分析、競合調査 | `SERPAPI_API_KEY` | 100 |
| **Brave Search** | プライバシー重視、広範囲 | 一般Web検索 | `BRAVE_API_KEY` | 2,000 |
| **NewsAPI** | ニュース集約 | 最新ニュース、トレンド | `NEWS_API_KEY` | 100/日 |
| **Perplexity** | AI検索+要約 | 要約生成、引用付き回答 | `PERPLEXITY_API_KEY` | 課金制 |

### API呼び出しテンプレート

#### Tavily API（AI検索特化）

```bash
curl -X POST "https://api.tavily.com/search" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "'"${TAVILY_API_KEY}"'",
    "query": "'"${QUERY}"'",
    "search_depth": "advanced",
    "include_answer": true,
    "include_raw_content": true,
    "max_results": 10
  }'
```

#### SerpAPI（Google検索結果）

```bash
curl "https://serpapi.com/search.json?engine=google&q=${QUERY}&api_key=${SERPAPI_API_KEY}&num=10"
```

#### Brave Search（広範囲Web検索）

```bash
curl "https://api.search.brave.com/res/v1/web/search?q=${QUERY}" \
  -H "Accept: application/json" \
  -H "X-Subscription-Token: ${BRAVE_API_KEY}"
```

#### NewsAPI（ニュース集約）

```bash
curl "https://newsapi.org/v2/everything?q=${QUERY}&apiKey=${NEWS_API_KEY}&sortBy=publishedAt&pageSize=10"
```

#### Perplexity API（AI要約）

```bash
curl -X POST "https://api.perplexity.ai/chat/completions" \
  -H "Authorization: Bearer ${PERPLEXITY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-sonar-large-128k-online",
    "messages": [{"role": "user", "content": "'"${QUERY}"'についての最新情報を要約してください。出典URLも含めてください。"}]
  }'
```

### 環境変数設定

```bash
# .env に以下を設定（.gitignoreに含まれているため安全）
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxx
SERPAPI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BRAVE_API_KEY=BSAxxxxxxxxxxxxxxxxxxxxxxxx
NEWS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**APIキー取得先**:
- Tavily: https://tavily.com/
- SerpAPI: https://serpapi.com/
- Brave: https://brave.com/search/api/
- NewsAPI: https://newsapi.org/
- Perplexity: https://www.perplexity.ai/settings/api

### API強化モード実行フロー

```
入力: /world-research キーワード=AI Agent モード=api-deep

Step 1: キーワード展開（既存処理）
  AI Agent → AI Agent, AIエージェント, AI智能体, #AIAgent

Step 2: API並列検索（新規）
  ├── Tavily: "AI Agent" search_depth=advanced（10件）
  ├── SerpAPI: "AI Agent 2026" Google上位（10件）
  ├── Brave: "AI Agent" 広範囲Web（20件）
  ├── NewsAPI: "AI Agent" 最新ニュース（10件）
  └── Perplexity: "AI Agent最新動向" AI要約

Step 3: 6層横断検索（既存処理、APIと並列実行）
  ├── Layer 1: 学術論文（Arxiv/S2/PwC...）
  ├── Layer 2: キュレーション（HF Daily Papers...）
  ├── Layer 3: テックブログ
  ├── Layer 4: 実装エコシステム
  ├── Layer 5: SNS横断
  └── Layer 6: コミュニティ

Step 4: 統合・クロス検証
  ├── API結果 + 6層結果の重複排除
  ├── 信頼度スコアリング（複数ソース確認で加点）
  └── 矛盾情報の検出・フラグ付け

Step 5: 統合レポート出力
  ├── エグゼクティブサマリー（Perplexity AI要約ベース）
  ├── 6層別詳細結果
  ├── API検索による追加インサイト
  └── 出典一覧（全ソースURL付き）
```

### スコアリングアルゴリズム（API結果統合時）

```
信頼度スコア =
  (ドメイン権威度 × 0.3) +
  (情報鮮度 × 0.2) +
  (クロス検証率 × 0.3) +
  (引用数 × 0.2)

ドメイン権威度:
  .gov, .edu     → 100
  主要メディア     → 90
  専門サイト       → 80
  一般サイト       → 60
  フォーラム       → 40
```

### レート制限とベストプラクティス

1. **api-deepは1日5回程度に抑える**（SerpAPI月100回制限）
2. **api-quickは日常使い可能**（Tavily/Brave合計3,000回/月）
3. **api-newsは日100回まで**（NewsAPI制限）
4. **並列実行時は1秒間隔を空ける**（レート制限回避）
5. **結果は複数ソースで確認された情報を優先**
>>>>>>> 8677f4ae478c391e8e8c80004ceb6206a740cb87

---

## 実行テンプレート

### 1. グローバルトレンド調査

```bash
/world-research キーワード=AI Agent 2026 モード=standard

# 実行内容:
# - Layer 5: X/Reddit/note.com/YouTube/中国SNSで横断検索
# - Layer 6: HN/Reddit/Discordでコミュニティ動向
# - 統合トレンドレポート出力
```

### 2. 特定ツール深掘り

```bash
/world-research キーワード=Claude Code Vibe Coding モード=deep

# 実行内容:
# - 全6層で横断検索
# - gpt-researcher で100+ソース深層調査
# - 引用付き包括レポート生成
```

### 3. 地域別比較

```bash
/world-research キーワード=生成AI 地域=日本,中国,米国

# 実行内容:
# - 日本: note.com + Qiita + Zenn + YouTube JP
# - 中国: 知乎 + Bilibili + 小红书 + CSDN
# - 米国: X + Reddit + YouTube + Medium
# - 地域別トレンド比較レポート
```

### 4. 論文サーベイ

```bash
/world-research キーワード=multi-agent LLM モード=survey トラック=agent

# 実行内容:
# - Layer 1: Arxiv/S2/PwC/OpenReviewで論文検索
# - Layer 2: HF Daily Papers/@_akhaliq で最新論文
# - Layer 3: Lil'Log/Karpathyで解説記事
# - Connected Papersで引用グラフ
# - 研究トラック分析レポート
```

### 5. 実装エコシステム調査

```bash
/world-research キーワード=RAG pipeline モード=ecosystem

# 実行内容:
# - Layer 4: GitHub/HF Hub/awesome-*で実装検索
# - フレームワーク比較（LangChain vs LlamaIndex vs Haystack）
# - GitHub Stars推移・コミュニティ活性度
# - 実装エコシステムマップ
```

### 6. 暗号通貨Dual Investment調査

```bash
/world-research キーワード=Dual Investment wheel strategy モード=crypto

# 実行内容:
# - Layer 7: Glassnode/CryptoQuant/DeFiLlamaでオンチェーンデータ確認
# - Layer 8: CoinGecko/Bitget APIで市場データ取得
# - Layer 9: Freqtrade/CCXT連携可能性調査
# - Layer 10: CoinDesk/Cointelegraph/CoinPostでニュース検索
# - 暗号通貨研究Track C1/C4参照
```

### 7. 暗号通貨オンチェーン分析

```bash
/world-research キーワード=whale tracking smart money モード=crypto-deep

# 実行内容:
# - Layer 7: Nansen/Arkham/Whale Alertでホエール追跡
# - Layer 5: X @whale_alert @lookonchain 検索
# - Layer 6: r/CryptoCurrency r/Bitcoin Reddit検索
# - gpt-researcher で100+ソース深層調査
```

### 8. DeFiプロトコル比較

```bash
/world-research キーワード=DeFi yield farming TVL モード=crypto

# 実行内容:
# - Layer 7: DeFiLlama TVL比較、Santimentセンチメント
# - Layer 9: DEXアグリゲーター比較
# - Layer 10: The Defiant/Banklessニュースレター確認
```

### 9. 研究者フォロー

```bash
/world-research 研究者=Lilian Weng モード=academic

# 実行内容:
# - Google Scholar: 最新論文
# - Semantic Scholar: 引用グラフ
# - X: from:lilianweng
# - ブログ: lilianweng.github.io
# - 研究者プロフィールレポート
```

---

## 出力形式

### レポートテンプレート

```markdown
# {keyword} 総合リサーチレポート

**調査日**: {date}
**検索キーワード**: {keywords (ja/en/zh)}
**検索対象**: {layers_used} （6層中）
**プラットフォーム数**: {platform_count}
**モード**: {quick|standard|deep|academic|survey|ecosystem}

---

## エグゼクティブサマリー

{3-5行の要約}

---

## 学術論文（Layer 1）

### 最新論文 Top 10
| # | タイトル | 著者 | 会議/Arxiv | 引用数 | URL |
|---|---------|------|-----------|--------|-----|
{top_papers}

### 研究トレンド
{research_trends}

---

## 注目キュレーション（Layer 2）

### HF Daily Papers
{hf_daily}

### 論文速報（@_akhaliq等）
{paper_alerts}

---

## 技術解説（Layer 3）

### ブログ記事
| ブログ | タイトル | URL |
|--------|---------|-----|
{blog_posts}

---

## 実装エコシステム（Layer 4）

### GitHub リポジトリ Top 10
| # | リポジトリ | Stars | 言語 | 最終更新 | URL |
|---|-----------|-------|------|---------|-----|
{top_repos}

### フレームワーク比較
{framework_comparison}

---

## SNS動向（Layer 5）

### X（旧Twitter）
| 投稿 | いいね | RT | 言語 | URL |
|------|--------|-----|------|-----|
{top_tweets}

### Reddit
| タイトル | スコア | Subreddit | URL |
|---------|--------|-----------|-----|
{top_posts}

### note.com
| タイトル | 著者 | スキ | URL |
|---------|------|------|-----|
{top_notes}

### YouTube
| タイトル | チャンネル | 再生数 | URL |
|---------|----------|--------|-----|
{top_videos}

### 中国SNS
| プラットフォーム | タイトル/投稿 | エンゲージメント | URL |
|----------------|-------------|---------------|-----|
{top_chinese}

---

## コミュニティ動向（Layer 6）

### Hacker News
{hn_discussions}

### Discord / Slack
{community_discussions}

---

## 研究トラック分析

### 主要研究トラック
{research_tracks}

### 引用グラフ（Connected Papers）
{citation_graph}

---

## トレンド分析

### キーワード別バズ度
{keyword_buzz_analysis}

### 地域別インサイト
{regional_insights}

### 時系列トレンド
{timeline_trends}

---

## 引用・ソース
{citations}

---

## 推奨アクション
{recommended_actions}
```

---

## 暗号通貨注目研究者・開発者・学術機関

### プロトコル設計者・学術研究者

| 名前 | 所属 | 専門 | X |
|---|---|---|---|
| **Vitalik Buterin** | Ethereum Foundation | Ethereum設計, L2, アカウント抽象化 | @VitalikButerin (5M+) |
| **Charles Hoskinson** | IOHK/Cardano | ピアレビュー型ブロックチェーン設計 | @IOHK_Charles |
| **Gavin Wood** | Parity/Polkadot | Solidity設計, パラチェーン | @gavofyork |
| **Anatoly Yakovenko** | Solana Labs | 高速L1コンセンサス, PoH | @aaborhesI |
| **Stani Kulechov** | Aave | DeFiレンディングプロトコル | @StaniKulechov |
| **Hayden Adams** | Uniswap Labs | AMM設計 | @haydenzadams |
| **Robert Leshner** | Compound Labs | DeFiレンディングプロトコル | @rleshner |

### オンチェーンアナリスト・リサーチャー

| 名前 | 所属 | 専門 | X |
|---|---|---|---|
| **Willy Woo** | 独立 | NVT Ratio考案者, BTC分析 | @woonomic |
| **Benjamin Cowen** | ITC Crypto | PhD, 暗号通貨メトリクス教育 | @intocryptoverse |
| **Nic Carter** | Coin Metrics/Castle Island | Bitcoin経済学, PoW持続可能性 | @nic__carter |
| **Will Clemente** | Reflexivity Research | オンチェーン分析 | @WClementeIII |
| **James Check** | Glassnode | オンチェーン指標, MVRV分析 | @_Checkmatey_ |
| **Ki Young Ju** | CryptoQuant CEO | 取引所フロー分析 | @ki_young_ju |

### VC・投資リサーチャー

| 名前 | 所属 | 専門 | X |
|---|---|---|---|
| **Haseeb Qureshi** | Dragonfly Capital | VC視点, テクニカル分析 | @hosseeb (280K) |
| **Anthony Pompliano** | Morgan Creek Digital | Bitcoin投資, マクロ分析 | @APompliano (1.6M) |
| **Ryan Sean Adams** | Bankless | Ethereum/DeFiメディア | @RyanSAdams (380K) |
| **Arthur Hayes** | Maelstrom / ex-BitMEX | マクロ・デリバティブ分析 | @CryptoHayes |
| **Raoul Pal** | Real Vision | マクロ経済×暗号通貨 | @RaoulGMI |

### Bitcoin Core開発者

| 名前 | 役割 | 専門 | GitHub |
|---|---|---|---|
| **Pieter Wuille** | メンテナー | SegWit, Taproot, libsecp256k1 | github.com/sipa |
| **Gloria Zhao** | メンテナー | メンプール, トランザクションリレー | github.com/glozow |
| **Andrew Chow** | メンテナー | ウォレット, ディスクリプター | github.com/achow101 |

### 学術研究機関

| 機関 | URL | 専門 |
|---|---|---|
| **Stanford Center for Blockchain Research** | `https://cbr.stanford.edu` | ブロックチェーン基礎研究 |
| **MIT Digital Currency Initiative** | `https://dci.mit.edu` | デジタル通貨, ライトニング |
| **IC3 (Cornell)** | `https://www.initc3.org` | スマートコントラクトセキュリティ |
| **Cryptocurrency Research Conference** | `https://cryptorc.org` | クリプトファイナンス学術 |

### 開発者活動追跡プラットフォーム

| プラットフォーム | URL | 説明 |
|---|---|---|
| **Electric Capital Developer Report** | `https://www.developerreport.com` | 100M+コミット分析, 年次レポート |
| **Cryptometheus** | `https://cryptometheus.com` | 開発活動ランキング |
| **CryptoMiso** | `https://www.cryptomiso.com` | GitHubコミット数ランキング |
| **Token Terminal** | `https://tokenterminal.com` | コア開発者メトリクス |

---

## 制限事項

1. **レート制限**: 各プラットフォームのAPIレート制限を遵守（1秒間隔）
2. **認証**: ログイン必須データ（Instagram DM等）は取得不可
3. **中国SNS**: 一部はアプリ内検索のみ（API非公開）
4. **deepモード**: gpt-researcher使用時はAPIキーが必要
5. **Semantic Scholar API**: 無料枠は100リクエスト/5分
6. **Arxiv API**: 3秒間隔を推奨
7. **Discord/Slack**: 公開チャンネルのみ検索可能
8. **Google Scholar**: スクレイピング制限あり（CAPTCHAが出る場合あり）
9. **Bitget Dual Investment API**: 公開APIなし（Spot/Earn APIで代替）
10. **CoinGecko API**: 無料枠は10-50リクエスト/分（プランによる）
11. **Telegramシグナル**: 約1/3は詐欺的。マルウェア攻撃リスクに注意
12. **取引所API**: リアルタイムデータはWebSocket推奨（REST APIはレート制限あり）

## 関連スキル

- `gpt-researcher` - 深層調査エンジン（統合済み）
- `note-research` - note.com特化リサーチ
- `research-free` - APIキー不要汎用リサーチ
- `mega-research` - 6API統合リサーチ
- `mega-research-plus` - 8ソース統合リサーチ
- `keyword-free` - キーワード抽出
- `keyword-mega-extractor` - 多角的キーワード展開
- `research-cited-report` - 出典付きレポート生成
- `unified-research` - 複数API統合リサーチ
