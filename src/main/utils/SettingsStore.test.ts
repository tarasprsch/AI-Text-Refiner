import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SETTINGS_DEFAULTS } from '@shared/ipc-contract'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/test', getVersion: () => '1.0.0' },
  ipcMain: { on: vi.fn() },
  ipcRenderer: undefined,
  shell: {}
}))

vi.mock('conf', () => {
  return { default: class Conf {} }
})

vi.mock('electron-store', () => {
  return {
    default: class ElectronStore {
      store: Record<string, unknown> = {}
    }
  }
})

// Import after mocks are set up (vitest hoists vi.mock automatically)
const { SettingsStore, SettingsValidationError } = await import('./SettingsStore')

describe('SettingsStore', () => {
  let settingsStore: InstanceType<typeof SettingsStore>

  beforeEach(() => {
    settingsStore = new SettingsStore()
  })

  describe('getAll', () => {
    it('returns defaults when no values have been set', () => {
      expect(settingsStore.getAll()).toEqual(SETTINGS_DEFAULTS)
    })

    it('returns merged defaults with stored values', () => {
      settingsStore.set('geminiApiKey', 'test-key')
      const result = settingsStore.getAll()
      expect(result.geminiApiKey).toBe('test-key')
      expect(result.geminiModel).toBe(SETTINGS_DEFAULTS.geminiModel)
    })
  })

  describe('set', () => {
    it('updates geminiApiKey', () => {
      settingsStore.set('geminiApiKey', 'my-api-key')
      expect(settingsStore.getAll().geminiApiKey).toBe('my-api-key')
    })

    it('updates geminiModel', () => {
      settingsStore.set('geminiModel', 'gemini-pro')
      expect(settingsStore.getAll().geminiModel).toBe('gemini-pro')
    })

    it('updates hotkey', () => {
      settingsStore.set('hotkey', 'Ctrl+Alt+Space')
      expect(settingsStore.getAll().hotkey).toBe('Ctrl+Alt+Space')
    })

    it('updates submitHotkey with valid value', () => {
      settingsStore.set('submitHotkey', 'Enter')
      expect(settingsStore.getAll().submitHotkey).toBe('Enter')
    })

    it('accepts all valid submitHotkey values', () => {
      const validHotkeys = ['Ctrl+Enter', 'Ctrl+Shift+Enter', 'Enter'] as const
      for (const hotkey of validHotkeys) {
        settingsStore.set('submitHotkey', hotkey)
        expect(settingsStore.getAll().submitHotkey).toBe(hotkey)
      }
    })
  })

  describe('validation', () => {
    it('throws SettingsValidationError for non-string geminiApiKey', () => {
      expect(() => settingsStore.set('geminiApiKey', 123 as never)).toThrow(SettingsValidationError)
    })

    it('throws SettingsValidationError for empty geminiModel', () => {
      expect(() => settingsStore.set('geminiModel', '')).toThrow(SettingsValidationError)
    })

    it('throws SettingsValidationError for non-string geminiModel', () => {
      expect(() => settingsStore.set('geminiModel', 42 as never)).toThrow(SettingsValidationError)
    })

    it('throws SettingsValidationError for empty hotkey', () => {
      expect(() => settingsStore.set('hotkey', '')).toThrow(SettingsValidationError)
    })

    it('throws SettingsValidationError for non-string hotkey', () => {
      expect(() => settingsStore.set('hotkey', null as never)).toThrow(SettingsValidationError)
    })

    it('throws SettingsValidationError for invalid submitHotkey', () => {
      expect(() => settingsStore.set('submitHotkey', 'Alt+Enter' as never)).toThrow(
        SettingsValidationError
      )
    })

    it('includes key name in validation error', () => {
      try {
        settingsStore.set('geminiModel', '')
        expect.unreachable('should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(SettingsValidationError)
        expect((e as InstanceType<typeof SettingsValidationError>).key).toBe('geminiModel')
      }
    })
  })

  describe('onChange', () => {
    it('calls listener when a value is set', () => {
      const listener = vi.fn()
      settingsStore.onChange(listener)
      settingsStore.set('geminiApiKey', 'new-key')
      expect(listener).toHaveBeenCalledOnce()
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ geminiApiKey: 'new-key' }))
    })

    it('calls multiple listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      settingsStore.onChange(listener1)
      settingsStore.onChange(listener2)
      settingsStore.set('geminiApiKey', 'key')
      expect(listener1).toHaveBeenCalledOnce()
      expect(listener2).toHaveBeenCalledOnce()
    })

    it('returns an unsubscribe function', () => {
      const listener = vi.fn()
      const unsubscribe = settingsStore.onChange(listener)
      unsubscribe()
      settingsStore.set('geminiApiKey', 'key')
      expect(listener).not.toHaveBeenCalled()
    })

    it('does not call listener when validation fails', () => {
      const listener = vi.fn()
      settingsStore.onChange(listener)
      expect(() => settingsStore.set('geminiModel', '')).toThrow()
      expect(listener).not.toHaveBeenCalled()
    })
  })
})
