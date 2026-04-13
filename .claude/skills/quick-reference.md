---
name: quick-reference
description: 高度な機能のクイックリファレンス。使い方を忘れた時に参照。
---

# Quick Reference

## 環境診断・トラブルシューティング
```
「環境を診断して」           → environment-doctor が自動実行
「エラーログを分析して」      → log-analyzer が原因特定
「依存関係をチェックして」    → dependency-validator が検証
「このエラーの修復方法は？」  → error-recovery-planner が提案
「システムの状態を確認」      → system-diagnostician が診断
```

## Context7: 最新ドキュメント取得（ハルシネーション防止）
```
「use context7 でNext.js 15のApp Routerについて教えて」
「use context7 React 19の新機能でコンポーネントを作って」
「use context7 Tailwind v4の設定方法」

→ 訓練データではなく、最新の公式ドキュメントから取得
→ 存在しないAPIの生成（ハルシネーション）を防止
```

## GPT Researcher: 自律型深層リサーチ
```
「AIエージェントフレームワークの最新動向を調査して」
「予測市場プラットフォームの競合分析をして」
「2026年のSaaS市場トレンドをレポートにまとめて」

→ 数百ソースを自律的に探索・検証
→ 引用付きの包括的レポートを生成
```

## Figma: デザイン→コード変換
```
「このFigmaデザインを実装して: https://www.figma.com/file/...」
「FigmaのButtonコンポーネントをReactで作って」
「Figmaからデザイントークンを抽出して」

→ デザインファイルに直接アクセス
→ ピクセルパーフェクトな実装を実現
```

## Qdrant: ベクトル検索・長期記憶
```
「このパターンを覚えておいて」
「以前話した認証の実装方法は？」
「類似のコードパターンを検索して」

→ セマンティック検索で意味的に類似した情報を取得
→ セッションをまたいだ永続的な記憶
```

## 階層メモリ: Mem0ベース3層アーキテクチャ
```
短期記憶 → taisun-proxy (セッション内)
長期記憶 → Qdrant (永続ベクトル)
エピソード → claude-mem (決定履歴)

→ Mem0研究に基づく26%精度向上
→ 91%レイテンシ削減、90%トークン節約
```

## よく使うコマンド
```bash
# エージェント実行
/agent-run

# スキル使用
/copywriting-helper
/youtube-thumbnail
/security-scan

# 状態確認
/taiyou-status
/mcp-health
```
