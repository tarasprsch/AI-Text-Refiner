export type SubmitHotkey = 'Ctrl+Enter' | 'Ctrl+Shift+Enter' | 'Enter'

export interface ModelEntry {
  id: string
  label: string
}

export interface AppSettings {
  geminiApiKey: string
  geminiModel: string
  hotkey: string
  submitHotkey: SubmitHotkey
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash-lite',
  hotkey: 'Ctrl+Shift+Space',
  submitHotkey: 'Ctrl+Enter'
}

export interface ElectronAPI {
  readClipboard: () => Promise<string>
  getModels: () => Promise<ModelEntry[]>
  getSettings: () => Promise<AppSettings>
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  registerShortcut: (accelerator: string) => Promise<boolean>
  hideWindow: () => Promise<void>
  onHotkeyTriggered: (callback: (clipboardText: string) => void) => () => void
  onNavigate: (callback: (view: string) => void) => () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
