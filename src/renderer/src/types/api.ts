export type SubmitHotkey = 'Ctrl+Enter' | 'Ctrl+Shift+Enter' | 'Enter'

export type GeminiModel =
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.1-pro'

export interface AppSettings {
  geminiApiKey: string
  geminiModel: GeminiModel
  hotkey: string
  submitHotkey: SubmitHotkey
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.1-flash-lite',
  hotkey: 'Ctrl+Shift+Space',
  submitHotkey: 'Ctrl+Enter'
}

export interface ElectronAPI {
  readClipboard: () => Promise<string>
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
