// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SETTINGS_DEFAULTS, type AppSettings } from '@shared/appSettings'

let settingsChangedListener: ((s: AppSettings) => void) | null = null

const mockIpcApi = {
  getSettings: vi.fn(),
  setSetting: vi.fn(),
  onSettingsChanged: (listener: (s: AppSettings) => void) => {
    settingsChangedListener = listener
    return () => {
      settingsChangedListener = null
    }
  }
}

vi.mock('../../../api/ipcApi', () => ({ ipcApi: mockIpcApi }))

//!!!Important!!! Import after mocks are set up
const { useSettings } = await import('./useSettings')

const CUSTOM_SETTINGS: AppSettings = {
  geminiApiKey: 'test-key',
  geminiModel: 'gemini-pro',
  hotkey: 'Ctrl+Shift+A',
  submitHotkey: 'Ctrl+Enter'
}

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIpcApi.getSettings.mockResolvedValue(CUSTOM_SETTINGS)
  })

  describe('initial state', () => {
    it('returns defaults and loading=true before settings are fetched', () => {
      const { result } = renderHook(() => useSettings())
      expect(result.current.settings).toEqual(SETTINGS_DEFAULTS)
      expect(result.current.loading).toBe(true)
    })

    it('fetches settings and sets loading=false', async () => {
      const { result } = renderHook(() => useSettings())
      await act(() => mockIpcApi.getSettings.mock.results[0].value)
      expect(result.current.settings).toEqual(CUSTOM_SETTINGS)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('onSettingsChanged', () => {
    it('subscribes to settings changes', async () => {
      settingsChangedListener = null
      const { result } = renderHook(() => useSettings())
      await act(() => mockIpcApi.getSettings.mock.results[0].value)
      expect(settingsChangedListener).not.toBeNull()

      const updated: AppSettings = { ...CUSTOM_SETTINGS, geminiModel: 'gemini-2.0-flash' }
      act(() => settingsChangedListener!(updated))
      expect(result.current.settings).toEqual(updated)
    })

    it('unsubscribes on unmount', async () => {
      settingsChangedListener = null
      const { unmount } = renderHook(() => useSettings())
      expect(settingsChangedListener).not.toBeNull()
      unmount()
      expect(settingsChangedListener).toBeNull()
    })
  })

  describe('updateSetting', () => {
    it('calls setSetting and updates local state', async () => {
      const { result } = renderHook(() => useSettings())
      await act(() => mockIpcApi.getSettings.mock.results[0].value)

      await act(() => result.current.updateSetting('geminiApiKey', 'new-key'))
      expect(mockIpcApi.setSetting).toHaveBeenCalledWith('geminiApiKey', 'new-key')
      expect(result.current.settings.geminiApiKey).toBe('new-key')
    })
  })
})
