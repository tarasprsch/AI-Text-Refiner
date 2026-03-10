import { GoogleGenAI } from '@google/genai'
import { useCallback, useRef, useState } from 'react'

export interface GeminiOption {
  label: string
  correctedText: string
}

export interface GeminiResult {
  options: GeminiOption[]
  explanation?: string
}

interface UseGeminiReturn {
  checkGrammar: (text: string, apiKey: string, model: string) => Promise<void>
  sendFollowUp: (message: string) => Promise<void>
  result: GeminiResult | null
  loading: boolean
  error: string | null
  reset: () => void
}

const SYSTEM_PROMPT = `You are a writing assistant for workplace chat messages.
Your job is to improve messages that will be sent to coworkers via chat (Slack, Teams, etc.).

For each message, fix grammar and spelling, but also make it clearer, more understandable, and appropriately professional. Keep the tone friendly and natural — not overly formal or robotic.

Analyze the text and return a JSON object with:
- "options": an array of 3 improved variants, each with:
  - "label": a short style label (e.g. "Clear", "Professional", "Concise")
  - "correctedText": the improved version in that style
- "explanation": a brief summary of what was improved (or "No changes needed" if the message is already clear)

IMPORTANT: Return ONLY valid JSON — no markdown, no code fences, no extra commentary.`

function parseResponse(raw: string): GeminiResult {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(cleaned) as GeminiResult
}

export function useGemini(): UseGeminiReturn {
  const [result, setResult] = useState<GeminiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatRef = useRef<any>(null)
  const apiKeyRef = useRef<string>('')

  const checkGrammar = useCallback(async (text: string, apiKey: string, model: string) => {
    if (!apiKey) {
      setError('No Gemini API key configured. Go to Settings to add one.')
      return
    }
    if (!text.trim()) {
      setError('No text to check.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const ai = new GoogleGenAI({ apiKey })
      apiKeyRef.current = apiKey
      const chat = ai.chats.create({
        model,
        config: { systemInstruction: SYSTEM_PROMPT }
      })
      chatRef.current = chat

      const response = await chat.sendMessage({
        message: `Text to check:\n${text}`
      })
      const raw = response.text ?? ''

      setResult(parseResponse(raw))
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Gemini returned an unexpected format. Please try again.')
      } else if (err instanceof Error) {
        setError(`API Error: ${err.message}`)
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const sendFollowUp = useCallback(async (message: string) => {
    if (!chatRef.current) {
      setError('No active session. Run a grammar check first.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await chatRef.current.sendMessage({
        message: `${message}\n\nRemember: Return ONLY valid JSON with the same format (options array + explanation). No markdown, no code fences.`
      })
      const raw = response.text ?? ''
      setResult(parseResponse(raw))
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Gemini returned an unexpected format. Please try again.')
      } else if (err instanceof Error) {
        setError(`API Error: ${err.message}`)
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    chatRef.current = null
  }, [])

  return { checkGrammar, sendFollowUp, result, loading, error, reset }
}
