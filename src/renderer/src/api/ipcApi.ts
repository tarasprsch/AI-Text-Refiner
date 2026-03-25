import { AppSettings } from '@shared/appSettings'
import type { ModelEntry } from '@shared/geminiModelsEntry'

export const ipcApi = {
  hideWindow: (): Promise<void> => window.api.invoke('window:hide'),

  getSettings: (): Promise<AppSettings> => window.api.invoke('settings:get'),

  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> =>
    window.api.invoke('settings:set', key, value as string),

  getModels: (): Promise<ModelEntry[]> => window.api.invoke('models:get'),

  registerShortcut: (accelerator: string): Promise<boolean> =>
    window.api.invoke('shortcut:register', accelerator),

  onNavigate: (listener: (view: string) => void): (() => void) =>
    window.api.on('navigate', listener),

  onSettingsChanged: (listener: (settings: AppSettings) => void): (() => void) =>
    window.api.on('settings:changed', listener),

  onHotkeyTriggered: (listener: (text: string) => void): (() => void) =>
    window.api.on('hotkey:triggered', listener)
}
