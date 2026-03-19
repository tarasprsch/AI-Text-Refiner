import { GoogleGenAI } from '@google/genai'
import { useCallback, useRef, useState } from 'react'

export interface TextOption {
  label: string
  correctedText: string
}

export interface RefinementResult {
  options: TextOption[]
  explanation?: string
}

interface UseTextRefinementConfig {
  apiKey: string
  model: string
}

export interface TextRefinementSession {
  check: (text: string) => Promise<void>
  followUp: (instruction: string) => Promise<void>
  reset: () => void
  result: RefinementResult | null
  loading: boolean
  error: string | null
  hasSession: boolean
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

export interface ChatClient {
  sendMessage(msg: { message: string }): Promise<{ text?: string }>
}

type ChatFactory = (apiKey: string, model: string, systemPrompt: string) => ChatClient

const defaultChatFactory: ChatFactory = (apiKey, model, systemPrompt) => {
  const ai = new GoogleGenAI({ apiKey })
  return ai.chats.create({ model, config: { systemInstruction: systemPrompt } })
}

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

export function useTextRefinement(
  config: UseTextRefinementConfig,
  chatFactory: ChatFactory = defaultChatFactory
): TextRefinementSession {
  const [result, setResult] = useState<RefinementResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatRef = useRef<ChatClient | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    chatRef.current = null
  }, [])

  const check = useCallback(
    async (text: string) => {
      const { apiKey, model } = configRef.current
      if (!apiKey) {
        setError('No Gemini API key configured. Go to Settings to add one.')
        return
      }
      if (!text.trim()) {
        setError('No text to check.')
        return
      }

      // Implicitly reset prior session
      chatRef.current = null
      setLoading(true)
      setError(null)
      setResult(null)

      try {
        const chat = chatFactory(apiKey, model, SYSTEM_PROMPT)
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
    },
    [chatFactory]
  )

  const followUp = useCallback(async (message: string) => {
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

  return {
    check,
    followUp,
    reset,
    result,
    loading,
    error,
    hasSession: chatRef.current !== null
  }
}
