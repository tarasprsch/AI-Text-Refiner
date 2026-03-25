import { AppSettings, SETTINGS_DEFAULTS } from '@shared/appSettings'
import { VALID_SUBMIT_HOTKEYS, type SubmitHotkey } from '@shared/hotkeys'
import ElectronStore from 'electron-store'

export class SettingsValidationError extends Error {
  constructor(
    public readonly key: string,
    public readonly reason: string
  ) {
    super(`Invalid value for "${key}": ${reason}`)
  }
}

export class SettingsStore {
  private readonly listeners = new Set<(settings: AppSettings) => void>()
  private readonly store: ElectronStore<AppSettings>

  constructor() {
    this.store = new ElectronStore<AppSettings>()
  }

  getAll(): AppSettings {
    return { ...SETTINGS_DEFAULTS, ...this.store.store }
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    validate(key, value)
    const current = this.getAll()
    current[key] = value
    this.store.store = current
    this.listeners.forEach((listener) => listener(current))
  }

  onChange(callback: (settings: AppSettings) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
}

function validate<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  switch (key) {
    case 'geminiApiKey':
      if (typeof value !== 'string') {
        throw new SettingsValidationError(key, 'must be a string')
      }
      break
    case 'geminiModel':
      if (typeof value !== 'string' || value.length === 0) {
        throw new SettingsValidationError(key, 'must be a non-empty string')
      }
      break
    case 'hotkey':
      if (typeof value !== 'string' || value.length === 0) {
        throw new SettingsValidationError(key, 'must be a non-empty string')
      }
      break
    case 'submitHotkey':
      if (!VALID_SUBMIT_HOTKEYS.has(value as SubmitHotkey)) {
        throw new SettingsValidationError(
          key,
          `must be one of: ${[...VALID_SUBMIT_HOTKEYS].join(', ')}`
        )
      }
      break
  }
}
