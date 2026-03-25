// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppSettings } from '@shared/appSettings'
import { ipcApi } from '../../api/ipcApi'
import { useTextRefinement } from './hooks/useTextRefinement'

const mockSession: ReturnType<typeof useTextRefinement> = {
  check: vi.fn(),
  followUp: vi.fn(),
  reset: vi.fn(),
  result: null,
  loading: false,
  error: null as string | null,
  hasSession: false
}

vi.mock('./hooks/useTextRefinement', () => ({
  useTextRefinement: () => mockSession
}))

let hotkeyListener: Parameters<typeof ipcApi.onHotkeyTriggered>[0] | null = null

const mockIpcApi = {
  onHotkeyTriggered: (listener: (text: string) => void) => {
    hotkeyListener = listener
    return () => {
      hotkeyListener = null
    }
  }
} as typeof ipcApi

vi.mock('../../api/ipcApi', () => ({ ipcApi: mockIpcApi }))

//!!!Important!!! Import after mocks are set up
const { useMainView } = await import('./useMainView')

const SETTINGS: AppSettings = {
  geminiApiKey: 'test-key',
  geminiModel: 'gemini-pro',
  hotkey: 'Ctrl+Shift+Space',
  submitHotkey: 'Ctrl+Enter'
}

async function renderUseMainView(overrides?: Partial<AppSettings>) {
  const result = renderHook(() => useMainView({ ...SETTINGS, ...overrides }))
  await act(async () => {})
  return result
}

describe('useMainView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hotkeyListener = null
    mockSession.result = null
    mockSession.loading = false
    mockSession.error = null
    mockSession.hasSession = false
  })

  describe('initial state', () => {
    it('returns default values', async () => {
      const { result } = await renderUseMainView()
      expect(result.current.inputText).toBe('')
      expect(result.current.followUpText).toBe('')
      expect(result.current.messageHistory).toEqual([])
      expect(result.current.activeTab).toBe('editor')
      expect(result.current.hasApiKey).toBe(true)
      expect(result.current.isEnabled).toBe(false)
    })

    it('hasApiKey is false when no key configured', async () => {
      const { result } = await renderUseMainView({ geminiApiKey: '' })
      expect(result.current.hasApiKey).toBe(false)
    })
  })

  describe('handleInputChange', () => {
    it('updates inputText', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.handleInputChange({ target: { value: 'hello' } } as never))
      expect(result.current.inputText).toBe('hello')
    })
  })

  describe('handleFollowUpChange', () => {
    it('updates followUpText', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.handleFollowUpChange({ target: { value: 'shorter' } } as never))
      expect(result.current.followUpText).toBe('shorter')
    })
  })

  describe('isEnabled', () => {
    it('is true when has api key, not loading, and has input text', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.handleInputChange({ target: { value: 'hello' } } as never))
      expect(result.current.isEnabled).toBe(true)
    })

    it('is false when input is whitespace only', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.handleInputChange({ target: { value: '   ' } } as never))
      expect(result.current.isEnabled).toBe(false)
    })

    it('is false when loading', async () => {
      mockSession.loading = true
      const { result } = await renderUseMainView()
      act(() => result.current.handleInputChange({ target: { value: 'hello' } } as never))
      expect(result.current.isEnabled).toBe(false)
    })
  })

  describe('check', () => {
    it('calls session.check with input text and records history', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.handleInputChange({ target: { value: 'fix this' } } as never))

      await act(() => result.current.check())
      expect(mockSession.check).toHaveBeenCalledWith('fix this')
      expect(result.current.messageHistory).toEqual(['fix this'])
      expect(result.current.followUpText).toBe('')
    })
  })

  describe('followUp', () => {
    it('calls session.followUp and appends to history', async () => {
      const { result } = await renderUseMainView()
      act(() =>
        result.current.handleFollowUpChange({ target: { value: 'make it shorter' } } as never)
      )

      await act(() => result.current.followUp())
      expect(mockSession.followUp).toHaveBeenCalledWith('make it shorter')
      expect(result.current.messageHistory).toEqual(['make it shorter'])
      expect(result.current.followUpText).toBe('')
    })

    it('does nothing when followUpText is empty', async () => {
      const { result } = await renderUseMainView()
      await act(() => result.current.followUp())
      expect(mockSession.followUp).not.toHaveBeenCalled()
    })
  })

  describe('tab switching', () => {
    it('showHistoryTab switches to history', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.showHistoryTab())
      expect(result.current.activeTab).toBe('history')
    })

    it('showEditorTab switches back to editor', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.showHistoryTab())
      act(() => result.current.showEditorTab())
      expect(result.current.activeTab).toBe('editor')
    })
  })

  describe('handleInputKeyDown', () => {
    it('calls check on Ctrl+Enter when enabled', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.handleInputChange({ target: { value: 'hello' } } as never))

      const event = ctrlEnterEvent()
      await act(() => result.current.handleInputKeyDown(event))
      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockSession.check).toHaveBeenCalledWith('hello')
    })

    it('does not call check when disabled', async () => {
      const { result } = await renderUseMainView()
      const event = ctrlEnterEvent()
      await act(() => result.current.handleInputKeyDown(event))
      expect(mockSession.check).not.toHaveBeenCalled()
    })

    it('ignores non-Enter keys', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.handleInputChange({ target: { value: 'hello' } } as never))

      const event = ctrlEnterEvent({ key: 'a' })
      await act(() => result.current.handleInputKeyDown(event))
      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(mockSession.check).not.toHaveBeenCalled()
    })
  })

  describe('handleFollowUpKeyDown', () => {
    it('calls followUp on Ctrl+Enter', async () => {
      const { result } = await renderUseMainView()
      act(() => result.current.handleFollowUpChange({ target: { value: 'make formal' } } as never))

      const event = ctrlEnterEvent()
      await act(() => result.current.handleFollowUpKeyDown(event))
      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockSession.followUp).toHaveBeenCalledWith('make formal')
    })
  })

  describe('submitHotkey variants', () => {
    it('Enter-only mode triggers on plain Enter', async () => {
      const { result } = await renderUseMainView({ submitHotkey: 'Enter' })
      act(() => result.current.handleInputChange({ target: { value: 'hello' } } as never))

      const event = ctrlEnterEvent({ ctrlKey: false })
      await act(() => result.current.handleInputKeyDown(event))
      expect(mockSession.check).toHaveBeenCalled()
    })

    it('Ctrl+Shift+Enter mode triggers correctly', async () => {
      const { result } = await renderUseMainView({ submitHotkey: 'Ctrl+Shift+Enter' })
      act(() => result.current.handleInputChange({ target: { value: 'hello' } } as never))

      const event = ctrlEnterEvent({ shiftKey: true })
      await act(() => result.current.handleInputKeyDown(event))
      expect(mockSession.check).toHaveBeenCalled()
    })

    it('Ctrl+Enter does not trigger in Ctrl+Shift+Enter mode', async () => {
      const { result } = await renderUseMainView({ submitHotkey: 'Ctrl+Shift+Enter' })
      act(() => result.current.handleInputChange({ target: { value: 'hello' } } as never))

      const event = ctrlEnterEvent({ shiftKey: false })
      await act(() => result.current.handleInputKeyDown(event))
      expect(mockSession.check).not.toHaveBeenCalled()
    })
  })

  describe('onHotkeyTriggered', () => {
    it('subscribes on mount and unsubscribes on unmount', async () => {
      const { unmount } = await renderUseMainView()
      expect(hotkeyListener).not.toBeNull()
      unmount()
      expect(hotkeyListener).toBeNull()
    })

    it('resets state and sets clipboard text', async () => {
      const { result } = await renderUseMainView()

      // Set some state first
      act(() => result.current.handleInputChange({ target: { value: 'old text' } } as never))
      act(() => result.current.showHistoryTab())

      // Trigger hotkey
      act(() => hotkeyListener!('clipboard text'))

      expect(result.current.inputText).toBe('clipboard text')
      expect(result.current.followUpText).toBe('')
      expect(result.current.messageHistory).toEqual([])
      expect(result.current.activeTab).toBe('editor')
      expect(mockSession.reset).toHaveBeenCalled()
    })
  })
})

const ctrlEnterEvent = (overrides: Partial<React.KeyboardEvent> = {}): React.KeyboardEvent =>
  ({
    key: 'Enter',
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
    ...overrides
  }) as React.KeyboardEvent
