import { describe, it, expect } from 'vitest'
import { evaluateDataset } from '../services/evalService'
import path from 'path'

describe('evaluateDataset', () => {
  it('computes perfect accuracy with oracle invokeModel', async () => {
    const dsPath = path.resolve(__dirname, 'evals', 'dataset.json')
    const invokeModel = async (prompt: string) => {
      const data = await import('./evals/dataset.json')
      const found = data.default?.find((x: any) => x.input === prompt) || data.find((x: any) => x.input === prompt)
      return found ? found.expected : ''
    }

    const res = await evaluateDataset(invokeModel, dsPath)
    expect(res.accuracy).toBe(1)
    expect(res.results.length).toBeGreaterThan(0)
  })
})
