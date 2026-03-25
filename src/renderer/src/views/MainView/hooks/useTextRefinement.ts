import { AppSettings } from '@shared/appSettings'
import { useCallback, useRef, useState } from 'react'
import { GeminiChat } from './utils/GeminiChat'
import { parseResponse } from './utils/parseResponse'

export interface TextOption {
  label: string
  correctedText: string
}

export interface RefinementResult {
  options: TextOption[]
  explanation?: string
}

type Props = Pick<AppSettings, 'geminiApiKey' | 'geminiModel'>

export function useTextRefinement(config: Props) {
  const [result, setResult] = useState<RefinementResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatRef = useRef<GeminiChat | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  const sendChatMessage = useCallback(async (chat: GeminiChat, message: string) => {
    setLoading(true)
    setError(null)
    try {
      const raw = await chat.sendMessage(message)
      setResult(parseResponse(raw))
    } catch (err) {
      setError(toUserError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const check = useCallback(
    async (text: string) => {
      const apiKey = configRef.current.geminiApiKey
      const model = configRef.current.geminiModel
      if (!apiKey) {
        setError('No Gemini API key configured. Go to Settings to add one.')
        return
      }
      if (!text.trim()) {
        setError('No text to check.')
        return
      }

      chatRef.current = null
      setResult(null)

      const chat = new GeminiChat(apiKey, model)
      chatRef.current = chat
      await sendChatMessage(chat, `Text to check:\n${text}`)
    },
    [sendChatMessage]
  )

  const followUp = useCallback(
    async (message: string) => {
      if (!chatRef.current) {
        setError('No active session. Run a grammar check first.')
        return
      }

      await sendChatMessage(
        chatRef.current,
        `${message}\n\nRemember: Return ONLY valid JSON with the same format (options array + explanation). No markdown, no code fences.`
      )
    },
    [sendChatMessage]
  )

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    chatRef.current = null
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

function toUserError(err: unknown): string {
  if (err instanceof SyntaxError) return 'Gemini returned an unexpected format. Please try again.'
  if (err instanceof Error) return `API Error: ${err.message}`
  return 'An unknown error occurred.'
}
