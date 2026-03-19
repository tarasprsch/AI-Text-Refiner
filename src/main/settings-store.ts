import type { AppSettings, SubmitHotkey } from '../shared/ipc-contract'
import { SETTINGS_DEFAULTS } from '../shared/ipc-contract'

export interface StorageBackend {
  read(): Partial<AppSettings>
  write(settings: AppSettings): void
}

export class SettingsValidationError extends Error {
  constructor(
    public readonly key: string,
    public readonly reason: string
  ) {
    super(`Invalid value for "${key}": ${reason}`)
  }
}

const VALID_SUBMIT_HOTKEYS: ReadonlySet<string> = new Set<SubmitHotkey>([
  'Ctrl+Enter',
  'Ctrl+Shift+Enter',
  'Enter'
])

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
      if (!VALID_SUBMIT_HOTKEYS.has(value as string)) {
        throw new SettingsValidationError(key, `must be one of: ${[...VALID_SUBMIT_HOTKEYS].join(', ')}`)
      }
      break
  }
}

export interface SettingsStore {
  getAll(): AppSettings
  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void
  onChange(callback: (settings: AppSettings) => void): () => void
}

export function createSettingsStore(backend: StorageBackend): SettingsStore {
  const listeners = new Set<(settings: AppSettings) => void>()

  function getAll(): AppSettings {
    return { ...SETTINGS_DEFAULTS, ...backend.read() }
  }

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    validate(key, value)
    const current = getAll()
    current[key] = value
    backend.write(current)
    for (const listener of listeners) {
      listener(current)
    }
  }

  function onChange(callback: (settings: AppSettings) => void): () => void {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }

  return { getAll, set, onChange }
}

export class ElectronStorageBackend implements StorageBackend {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private store: any

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Store = require('electron-store')
    this.store = new Store()
  }

  read(): Partial<AppSettings> {
    return this.store.store as Partial<AppSettings>
  }

  write(settings: AppSettings): void {
    this.store.store = settings
  }
}
