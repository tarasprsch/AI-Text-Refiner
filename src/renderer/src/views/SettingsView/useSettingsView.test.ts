// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppSettings } from '@shared/appSettings'
import type { ModelEntry } from '@shared/geminiModelsEntry'

const mockIpcApi = {
  getModels: vi.fn<() => Promise<ModelEntry[]>>(),
  registerShortcut: vi.fn<() => Promise<boolean>>()
}

vi.mock('../../api/ipcApi', () => ({ ipcApi: mockIpcApi }))

//!!!Important!!! Import after mocks are set up
const { useSettingsView } = await import('./useSettingsView')

const MODELS: ModelEntry[] = [
  { id: 'gemini-pro', label: 'Gemini Pro' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }
]

const SETTINGS: AppSettings = {
  geminiApiKey: 'test-key',
  geminiModel: 'gemini-pro',
  hotkey: 'Ctrl+Shift+Space',
  submitHotkey: 'Ctrl+Enter'
}

const mockUpdateFn = vi.fn()

async function renderSettingsView(overrides?: Partial<AppSettings>) {
  const result = renderHook(() =>
    useSettingsView({ settings: { ...SETTINGS, ...overrides }, onUpdate: mockUpdateFn })
  )
  await act(async () => {})
  return result
}

describe('useSettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockIpcApi.getModels.mockResolvedValue(MODELS)
    mockIpcApi.registerShortcut.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('initializes apiKey and hotkey from settings', async () => {
      const { result } = await renderSettingsView()
      expect(result.current.apiKey).toBe('test-key')
      expect(result.current.hotkey).toBe('Ctrl+Shift+Space')
      expect(result.current.isRecording).toBe(false)
      expect(result.current.hotkeyStatus).toBe('idle')
      expect(result.current.apiKeySaved).toBe(false)
    })

    it('fetches models on mount', async () => {
      const { result } = await renderSettingsView()
      expect(result.current.models).toEqual(MODELS)
    })
  })

  describe('handleChangeApiKey', () => {
    it('updates apiKey state', async () => {
      const { result } = await renderSettingsView()
      act(() => result.current.handleChangeApiKey({ target: { value: 'new-key' } } as never))
      expect(result.current.apiKey).toBe('new-key')
    })
  })

  describe('saveApiKey', () => {
    it('calls onUpdate and shows saved indicator', async () => {
      const { result } = await renderSettingsView()
      await act(() => result.current.saveApiKey())
      expect(mockUpdateFn).toHaveBeenCalledWith('geminiApiKey', 'test-key')
      expect(result.current.apiKeySaved).toBe(true)
    })

    it('hides saved indicator after 2 seconds', async () => {
      const { result } = await renderSettingsView()
      await act(() => result.current.saveApiKey())
      expect(result.current.apiKeySaved).toBe(true)

      act(() => vi.advanceTimersByTime(2000))
      expect(result.current.apiKeySaved).toBe(false)
    })
  })

  describe('handleChangeModel', () => {
    it('calls onUpdate with geminiModel', async () => {
      const { result } = await renderSettingsView()
      await act(() =>
        result.current.handleChangeModel({ target: { value: 'gemini-2.0-flash' } } as never)
      )
      expect(mockUpdateFn).toHaveBeenCalledWith('geminiModel', 'gemini-2.0-flash')
    })
  })

  describe('handleChangeSubmitHotkey', () => {
    it('calls onUpdate with submitHotkey', async () => {
      const { result } = await renderSettingsView()
      await act(() =>
        result.current.handleChangeSubmitHotkey({ target: { value: 'Enter' } } as never)
      )
      expect(mockUpdateFn).toHaveBeenCalledWith('submitHotkey', 'Enter')
    })
  })

  describe('hotkey recording', () => {
    it('toggleRecording enables recording mode', async () => {
      const { result } = await renderSettingsView()
      act(() => result.current.toggleRecording())
      expect(result.current.isRecording).toBe(true)
    })

    it('cancelRecording disables recording mode', async () => {
      const { result } = await renderSettingsView()
      act(() => result.current.toggleRecording())
      act(() => result.current.cancelRecording())
      expect(result.current.isRecording).toBe(false)
    })

    it('captures key combination and stops recording', async () => {
      const { result } = await renderSettingsView()
      act(() => result.current.toggleRecording())

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'A', ctrlKey: true, shiftKey: true, bubbles: true })
        )
      })

      expect(result.current.hotkey).toBe('Ctrl+Shift+A')
      expect(result.current.isRecording).toBe(false)
    })

    it('ignores modifier-only key presses', async () => {
      const { result } = await renderSettingsView()
      act(() => result.current.toggleRecording())

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }))
      })

      expect(result.current.isRecording).toBe(true)
      expect(result.current.hotkey).toBe('Ctrl+Shift+Space')
    })

    it('maps special keys correctly', async () => {
      const { result } = await renderSettingsView()
      act(() => result.current.toggleRecording())

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, bubbles: true })
        )
      })

      expect(result.current.hotkey).toBe('Ctrl+Space')
    })
  })

  describe('applyHotkey', () => {
    it('registers shortcut and calls onUpdate on success', async () => {
      const { result } = await renderSettingsView()

      act(() => result.current.toggleRecording())
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'B', ctrlKey: true, bubbles: true })
        )
      })

      await act(() => result.current.applyHotkey())
      expect(mockIpcApi.registerShortcut).toHaveBeenCalledWith('Ctrl+B')
      expect(mockUpdateFn).toHaveBeenCalledWith('hotkey', 'Ctrl+B')
      expect(result.current.hotkeyStatus).toBe('success')
    })

    it('sets error status when registration fails', async () => {
      mockIpcApi.registerShortcut.mockResolvedValue(false)
      const { result } = await renderSettingsView()

      act(() => result.current.toggleRecording())
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'B', ctrlKey: true, bubbles: true })
        )
      })

      await act(() => result.current.applyHotkey())
      expect(mockUpdateFn).not.toHaveBeenCalled()
      expect(result.current.hotkeyStatus).toBe('error')
    })

    it('resets hotkeyStatus after 3 seconds', async () => {
      const { result } = await renderSettingsView()
      await act(() => result.current.applyHotkey())
      expect(result.current.hotkeyStatus).toBe('success')

      act(() => vi.advanceTimersByTime(3000))
      expect(result.current.hotkeyStatus).toBe('idle')
    })
  })
})
