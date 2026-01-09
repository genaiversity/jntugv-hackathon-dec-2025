import fs from 'fs/promises'
import path from 'path'
import leven from 'leven'

export type Example = {
  id?: string
  input: string
  expected: string
}

export type EvalResult = {
  id?: string
  input: string
  expected: string
  predicted: string
  exactMatch: boolean
  normalizedLevenshtein: number
}

export async function evaluateDataset(
  invokeModel: (prompt: string) => Promise<string> | string,
  datasetPath?: string
): Promise<{ accuracy: number; avgNormalizedLevenshtein: number; results: EvalResult[]; reportPath: string }>
{
  const dsPath = datasetPath ?? path.resolve(process.cwd(), 'tests', 'evals', 'dataset.json')
  const raw = await fs.readFile(dsPath, 'utf8')
  const examples: Example[] = JSON.parse(raw)

  const results: EvalResult[] = []

  for (const ex of examples) {
    const prompt = ex.input
    const predicted = String(await invokeModel(prompt))

    const normExpected = ex.expected.trim().toLowerCase()
    const normPred = predicted.trim().toLowerCase()

    const exactMatch = normExpected === normPred

    const dist = leven(normExpected, normPred)
    const maxLen = Math.max(1, Math.max(normExpected.length, normPred.length))
    const normalizedLev = Math.max(0, 1 - dist / maxLen)

    results.push({
      id: ex.id,
      input: ex.input,
      expected: ex.expected,
      predicted,
      exactMatch,
      normalizedLevenshtein: Number(normalizedLev.toFixed(4))
    })
  }

  const accuracy = results.filter(r => r.exactMatch).length / Math.max(1, results.length)
  const avgNormalizedLevenshtein = results.reduce((s, r) => s + r.normalizedLevenshtein, 0) / Math.max(1, results.length)

  // ensure reports folder
  const reportsDir = path.resolve(process.cwd(), 'reports')
  try { await fs.mkdir(reportsDir, { recursive: true }) } catch (e) { /* ignore */ }

  const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const reportPath = path.join(reportsDir, `eval-${date}.json`)
  const report = { date: new Date().toISOString(), dataset: dsPath, accuracy, avgNormalizedLevenshtein, results }
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')

  return { accuracy, avgNormalizedLevenshtein, results, reportPath }
}

export default evaluateDataset
