import { describe, it, expect } from 'vitest'
import { createSettingsStore, StorageBackend, SettingsValidationError } from './settings-store'
import { SETTINGS_DEFAULTS } from '../shared/ipc-contract'
import type { AppSettings } from '../shared/ipc-contract'

function createInMemoryBackend(initial: Partial<AppSettings> = {}): StorageBackend {
  let data = { ...initial }
  return {
    read: () => ({ ...data }),
    write: (settings: AppSettings) => {
      data = { ...settings }
    }
  }
}

describe('SettingsStore', () => {
  it('returns defaults when storage is empty', () => {
    const store = createSettingsStore(createInMemoryBackend())
    expect(store.getAll()).toEqual(SETTINGS_DEFAULTS)
  })

  it('merges stored values with defaults for missing keys', () => {
    const store = createSettingsStore(
      createInMemoryBackend({ geminiApiKey: 'my-key' })
    )
    const settings = store.getAll()
    expect(settings.geminiApiKey).toBe('my-key')
    expect(settings.geminiModel).toBe(SETTINGS_DEFAULTS.geminiModel)
    expect(settings.hotkey).toBe(SETTINGS_DEFAULTS.hotkey)
    expect(settings.submitHotkey).toBe(SETTINGS_DEFAULTS.submitHotkey)
  })

  it('set() persists a valid value and getAll() reflects it', () => {
    const store = createSettingsStore(createInMemoryBackend())
    store.set('geminiApiKey', 'new-key')
    expect(store.getAll().geminiApiKey).toBe('new-key')
  })

  it('set() rejects an invalid submitHotkey', () => {
    const store = createSettingsStore(createInMemoryBackend())
    expect(() => store.set('submitHotkey', 'Alt+Enter' as any)).toThrow(SettingsValidationError)
  })

  it('set() rejects an empty geminiModel', () => {
    const store = createSettingsStore(createInMemoryBackend())
    expect(() => store.set('geminiModel', '')).toThrow(SettingsValidationError)
  })

  it('set() rejects an empty hotkey', () => {
    const store = createSettingsStore(createInMemoryBackend())
    expect(() => store.set('hotkey', '')).toThrow(SettingsValidationError)
  })

  it('onChange fires with updated settings after set()', () => {
    const store = createSettingsStore(createInMemoryBackend())
    let received: AppSettings | null = null
    store.onChange((s) => {
      received = s
    })
    store.set('geminiApiKey', 'callback-key')
    expect(received).not.toBeNull()
    expect(received!.geminiApiKey).toBe('callback-key')
  })

  it('onChange unsubscribe stops notifications', () => {
    const store = createSettingsStore(createInMemoryBackend())
    let callCount = 0
    const unsub = store.onChange(() => {
      callCount++
    })
    store.set('geminiApiKey', 'a')
    unsub()
    store.set('geminiApiKey', 'b')
    expect(callCount).toBe(1)
  })

  it('onChange does not fire when set() throws validation error', () => {
    const store = createSettingsStore(createInMemoryBackend())
    let called = false
    store.onChange(() => {
      called = true
    })
    expect(() => store.set('submitHotkey', 'bad' as any)).toThrow()
    expect(called).toBe(false)
  })
})
