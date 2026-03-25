// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSendMessage = vi.fn()

vi.mock('./utils/GeminiChat', () => ({
  GeminiChat: class {
    sendMessage = mockSendMessage
  }
}))

//!!!Important!!! Import after mocks are set up
const { useTextRefinement } = await import('./useTextRefinement')

function validResponse(text = 'Hello'): string {
  return JSON.stringify({
    options: [
      { label: 'Clear', correctedText: text },
      { label: 'Formal', correctedText: text },
      { label: 'Casual', correctedText: text }
    ],
    explanation: 'Fixed.'
  })
}

describe('useTextRefinement', () => {
  const config = { geminiApiKey: 'test-key', geminiModel: 'gemini-pro' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSendMessage.mockResolvedValue(validResponse())
  })

  describe('initial state', () => {
    it('returns null result, no loading, no error', () => {
      const { result } = renderHook(() => useTextRefinement(config))
      expect(result.current.result).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('check', () => {
    it('sets error when API key is empty', async () => {
      const { result } = renderHook(() =>
        useTextRefinement({ geminiApiKey: '', geminiModel: 'gemini-pro' })
      )
      await act(() => result.current.check('hello'))
      expect(result.current.error).toMatch(/API key/)
      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('sets error when text is empty', async () => {
      const { result } = renderHook(() => useTextRefinement(config))
      await act(() => result.current.check('   '))
      expect(result.current.error).toMatch(/No text/)
    })

    it('calls GeminiChat and parses result on success', async () => {
      const { result } = renderHook(() => useTextRefinement(config))
      await act(() => result.current.check('fix this'))
      expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining('fix this'))
      expect(result.current.result).not.toBeNull()
      expect(result.current.result!.options).toHaveLength(3)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('sets error on API failure', async () => {
      mockSendMessage.mockRejectedValue(new Error('Network error'))
      const { result } = renderHook(() => useTextRefinement(config))
      await act(() => result.current.check('hello'))
      expect(result.current.error).toMatch(/Network error/)
      expect(result.current.result).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('sets syntax error message on SyntaxError', async () => {
      mockSendMessage.mockResolvedValue('not valid json')
      const { result } = renderHook(() => useTextRefinement(config))
      await act(() => result.current.check('hello'))
      expect(result.current.error).toMatch(/unexpected format/)
    })
  })

  describe('followUp', () => {
    it('sets error when no active session', async () => {
      const { result } = renderHook(() => useTextRefinement(config))
      await act(() => result.current.followUp('make it shorter'))
      expect(result.current.error).toMatch(/No active session/)
    })

    it('sends follow-up message after check', async () => {
      const { result } = renderHook(() => useTextRefinement(config))
      await act(() => result.current.check('fix this'))
      mockSendMessage.mockClear()
      mockSendMessage.mockResolvedValue(validResponse('Shorter'))

      await act(() => result.current.followUp('make it shorter'))
      expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining('make it shorter'))
      expect(result.current.result!.options[0].correctedText).toBe('Shorter')
    })
  })

  describe('reset', () => {
    it('clears result and error', async () => {
      const { result } = renderHook(() => useTextRefinement(config))
      await act(() => result.current.check('fix this'))
      expect(result.current.result).not.toBeNull()

      act(() => result.current.reset())
      expect(result.current.result).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('prevents followUp after reset', async () => {
      const { result } = renderHook(() => useTextRefinement(config))
      await act(() => result.current.check('fix this'))
      act(() => result.current.reset())

      await act(() => result.current.followUp('shorter'))
      expect(result.current.error).toMatch(/No active session/)
    })
  })
})
