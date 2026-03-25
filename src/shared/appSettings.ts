import { SubmitHotkey } from './hotkeys'

export interface AppSettings {
  geminiApiKey: string
  geminiModel: string
  hotkey: string
  submitHotkey: SubmitHotkey
}

export const SETTINGS_DEFAULTS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash-lite',
  hotkey: 'Ctrl+Shift+Space',
  submitHotkey: 'Ctrl+Enter'
}
