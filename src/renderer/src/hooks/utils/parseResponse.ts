import { RefinementResult } from '../useTextRefinement'

export function parseResponse(raw: string): RefinementResult {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  if (!parsed || !Array.isArray(parsed.options)) {
    throw new Error('Response missing "options" array')
  }

  for (const opt of parsed.options) {
    if (typeof opt.label !== 'string' || typeof opt.correctedText !== 'string') {
      throw new Error('Each option must have "label" and "correctedText" strings')
    }
  }

  return {
    options: parsed.options,
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : undefined
  }
}
