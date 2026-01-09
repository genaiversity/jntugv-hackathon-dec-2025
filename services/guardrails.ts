import { ZodTypeAny, ZodSchema, ZodError } from 'zod'

export type AnyFn<I, O> = (input: I) => Promise<O> | O

export function guardedCall<I = any, O = any>(
  fn: AnyFn<I, O>,
  inputSchema: ZodTypeAny,
  outputSchema: ZodTypeAny,
  defaultOutput?: O
): (input: unknown) => Promise<O>
{
  return async (input: unknown) => {
    const inCheck = inputSchema.safeParse(input)
    if (!inCheck.success) {
      console.warn('Guardrails: input validation failed', inCheck.error.issues)
      return defaultOutput as O
    }

    // call and validate output, retry once on failure
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // call function
        // @ts-ignore
        const out = await fn(inCheck.data as I)
        const outCheck = outputSchema.safeParse(out)
        if (outCheck.success) return out
        console.warn(`Guardrails: output validation failed (attempt ${attempt+1})`, outCheck.error.issues)
        // retry loop continues
      } catch (err) {
        console.warn(`Guardrails: function threw (attempt ${attempt+1})`, err)
      }
    }

    console.warn('Guardrails: returning default output after failed validations')
    return defaultOutput as O
  }
}

export default guardedCall
