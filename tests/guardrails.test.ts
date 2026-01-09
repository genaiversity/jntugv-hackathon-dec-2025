import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { guardedCall } from '../services/guardrails'

describe('guardedCall', () => {
  it('returns default when input invalid', async () => {
    const inputSchema = z.object({ x: z.string() })
    const outputSchema = z.object({ y: z.string() })
    const fn = vi.fn(async (input: any) => ({ y: 'ok' }))
    const wrapped = guardedCall(fn, inputSchema, outputSchema, { y: 'default' })
    const res = await wrapped({ wrong: true })
    expect(res).toEqual({ y: 'default' })
  })

  it('retries and returns default when output invalid', async () => {
    const inputSchema = z.object({ x: z.string() })
    const outputSchema = z.object({ y: z.string() })
    // first call returns invalid, second call throws or returns invalid
    const fn = vi.fn()
      .mockResolvedValueOnce({ bad: true })
      .mockResolvedValueOnce({ bad: true })

    const wrapped = guardedCall(fn as any, inputSchema, outputSchema, { y: 'fallback' })
    const res = await wrapped({ x: 'hello' })
    expect(res).toEqual({ y: 'fallback' })
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
