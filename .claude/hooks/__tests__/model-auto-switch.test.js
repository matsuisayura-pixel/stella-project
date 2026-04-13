/**
 * Model Auto-Switch Hook テスト
 */

const { estimateComplexity, getRecommendedModel, ROUTING_RULES } = require('../model-auto-switch.js')

describe('Model Auto-Switch', () => {
  describe('estimateComplexity', () => {
    test('expert レベル: アーキテクチャ設計', () => {
      const result = estimateComplexity('アーキテクチャ設計をリファクタリングして、セキュリティ監査もして')
      expect(result.complexity).toBe('expert')
      expect(result.confidence).toBeGreaterThan(0.4)
    })

    test('expert レベル: 統合実装', () => {
      const result = estimateComplexity('統合実装して、分散システムのインフラを構築')
      expect(result.complexity).toBe('expert')
    })

    test('complex レベル: 新機能実装', () => {
      const result = estimateComplexity('新機能を実装して、APIエンドポイントとテストも作成')
      expect(result.complexity).toBe('complex')
    })

    test('complex レベル: ワークフロー構築', () => {
      const result = estimateComplexity('ワークフローのパイプラインとフックを統合')
      expect(result.complexity).toBe('complex')
    })

    test('moderate レベル: 修正と更新', () => {
      const result = estimateComplexity('この関数を修正して、テストも更新して')
      expect(result.complexity).toBe('moderate')
    })

    test('simple レベル: 状態確認', () => {
      const result = estimateComplexity('状況を確認して教えて')
      expect(result.complexity).toBe('simple')
    })

    test('trivial レベル: 短い応答', () => {
      const result = estimateComplexity('はい')
      expect(result.complexity).toBe('trivial')
    })

    test('trivial レベル: 進行指示', () => {
      const result = estimateComplexity('進めて')
      expect(result.complexity).toBe('trivial')
    })

    test('空入力: デフォルトmoderate', () => {
      const result = estimateComplexity('')
      expect(result.complexity).toBe('moderate')
      expect(result.confidence).toBe(0.3)
    })

    test('null入力: デフォルトmoderate', () => {
      const result = estimateComplexity(null)
      expect(result.complexity).toBe('moderate')
    })

    test('長い入力: complex/expertに補正', () => {
      const longInput = 'この機能を実装してください。'.repeat(50)
      const result = estimateComplexity(longInput)
      expect(['complex', 'expert', 'moderate']).toContain(result.complexity)
    })

    test('信頼度が0-1の範囲内', () => {
      const inputs = [
        'アーキテクチャ設計',
        '修正して',
        'はい',
        '',
        'APIを実装してテストも書いて',
      ]
      inputs.forEach(input => {
        const result = estimateComplexity(input)
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      })
    })

    test('reasonが文字列で返る', () => {
      const result = estimateComplexity('アーキテクチャ設計')
      expect(typeof result.reason).toBe('string')
      expect(result.reason.length).toBeGreaterThan(0)
    })
  })

  describe('getRecommendedModel', () => {
    test('trivial → haiku', () => {
      const rec = getRecommendedModel('trivial')
      expect(rec.claudeModel).toBe('haiku')
    })

    test('simple → haiku', () => {
      const rec = getRecommendedModel('simple')
      expect(rec.claudeModel).toBe('haiku')
    })

    test('moderate → sonnet', () => {
      const rec = getRecommendedModel('moderate')
      expect(rec.claudeModel).toBe('sonnet')
    })

    test('complex → sonnet', () => {
      const rec = getRecommendedModel('complex')
      expect(rec.claudeModel).toBe('sonnet')
    })

    test('expert → opus', () => {
      const rec = getRecommendedModel('expert')
      expect(rec.claudeModel).toBe('opus')
    })

    test('不明な複雑度 → デフォルトsonnet', () => {
      const rec = getRecommendedModel('unknown')
      expect(rec.claudeModel).toBe('sonnet')
    })
  })

  describe('ROUTING_RULES', () => {
    test('5つのルールが定義されている', () => {
      expect(ROUTING_RULES).toHaveLength(5)
    })

    test('全ルールに必須フィールドがある', () => {
      ROUTING_RULES.forEach(rule => {
        expect(rule).toHaveProperty('complexity')
        expect(rule).toHaveProperty('model')
        expect(rule).toHaveProperty('claudeModel')
        expect(rule).toHaveProperty('maxCost')
        expect(rule).toHaveProperty('description')
      })
    })

    test('コストが昇順', () => {
      for (let i = 1; i < ROUTING_RULES.length; i++) {
        expect(ROUTING_RULES[i].maxCost).toBeGreaterThanOrEqual(ROUTING_RULES[i - 1].maxCost)
      }
    })
  })

  describe('パフォーマンス', () => {
    test('複雑度推定が10ms以内', () => {
      const inputs = [
        'アーキテクチャ設計をリファクタリングして分散システムを構築',
        '新機能を実装してAPIとテストも作成',
        'この関数を修正して',
        '状況確認',
        'はい',
      ]

      inputs.forEach(input => {
        const start = Date.now()
        estimateComplexity(input)
        const elapsed = Date.now() - start
        expect(elapsed).toBeLessThan(10)
      })
    })
  })
})
