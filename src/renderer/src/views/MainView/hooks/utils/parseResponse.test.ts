import { describe, expect, it } from 'vitest'
import { parseResponse } from './parseResponse'

describe('parseResponse', () => {
  it('parses clean JSON with options and explanation', () => {
    const json = JSON.stringify({
      options: [
        { label: 'Clear', correctedText: 'Hello there.' },
        { label: 'Formal', correctedText: 'Greetings.' },
        { label: 'Casual', correctedText: 'Hey!' }
      ],
      explanation: 'Fixed greeting.'
    })
    const result = parseResponse(json)
    expect(result.options).toHaveLength(3)
    expect(result.options[0].label).toBe('Clear')
    expect(result.options[0].correctedText).toBe('Hello there.')
    expect(result.explanation).toBe('Fixed greeting.')
  })

  it('strips ```json code fences before parsing', () => {
    const json = JSON.stringify({
      options: [{ label: 'A', correctedText: 'B' }]
    })
    const wrapped = '```json\n' + json + '\n```'
    const result = parseResponse(wrapped)
    expect(result.options).toHaveLength(1)
    expect(result.options[0].label).toBe('A')
  })

  it('strips ``` code fences without json tag', () => {
    const json = JSON.stringify({
      options: [{ label: 'A', correctedText: 'B' }]
    })
    const wrapped = '```\n' + json + '\n```'
    const result = parseResponse(wrapped)
    expect(result.options).toHaveLength(1)
  })

  it('returns undefined explanation when field is missing', () => {
    const json = JSON.stringify({
      options: [{ label: 'A', correctedText: 'B' }]
    })
    const result = parseResponse(json)
    expect(result.explanation).toBeUndefined()
  })

  it('returns undefined explanation when field is non-string', () => {
    const json = JSON.stringify({
      options: [{ label: 'A', correctedText: 'B' }],
      explanation: 42
    })
    const result = parseResponse(json)
    expect(result.explanation).toBeUndefined()
  })

  it('throws on invalid JSON', () => {
    expect(() => parseResponse('not json at all')).toThrow()
  })

  it('throws when options is missing', () => {
    const json = JSON.stringify({ explanation: 'no options here' })
    expect(() => parseResponse(json)).toThrow('Response missing "options" array')
  })

  it('throws when options is not an array', () => {
    const json = JSON.stringify({ options: 'not-an-array' })
    expect(() => parseResponse(json)).toThrow('Response missing "options" array')
  })

  it('throws when an option is missing label', () => {
    const json = JSON.stringify({
      options: [{ correctedText: 'B' }]
    })
    expect(() => parseResponse(json)).toThrow('label')
  })

  it('throws when an option is missing correctedText', () => {
    const json = JSON.stringify({
      options: [{ label: 'A' }]
    })
    expect(() => parseResponse(json)).toThrow('correctedText')
  })

  it('parses JSON-like model responses with trailing commas', () => {
    const json = `{
      "options": [
        {
          "label": "Clear",
          "correctedText": "Hey everyone",
        },
        {
          "label": "Professional",
          "correctedText": "Hi team",
        },
        {
          "label": "Concise",
          "correctedText": "Hi all!",
        }
      ],
      "explanation": "Corrected punctuation and grammar."
    }`

    const result = parseResponse(json)

    expect(result.options).toHaveLength(3)
    expect(result.options[2].label).toBe('Concise')
    expect(result.options[2].correctedText).toContain('Hi all!')
    expect(result.explanation).toBe('Corrected punctuation and grammar.')
  })

  it('keeps comma and brace text inside strings when removing trailing commas', () => {
    const json = `{
      "options": [
        {
          "label": "Clear",
          "correctedText": "Keep this text unchanged: comma, } and bracket, ].",
        }
      ]
    }`

    const result = parseResponse(json)

    expect(result.options[0].correctedText).toBe(
      'Keep this text unchanged: comma, } and bracket, ].'
    )
  })
})
