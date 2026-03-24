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

export const SETTINGS_DEFAULTS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash-lite',
  hotkey: 'Ctrl+Shift+Space',
  submitHotkey: 'Ctrl+Enter'
}

// ── IPC Commands (renderer invokes, main handles) ──

export interface IpcCommands {
  'clipboard:read': { params: []; result: string }
  'models:get': { params: []; result: ModelEntry[] }
  'settings:get': { params: []; result: AppSettings }
  'settings:set': { params: [key: keyof AppSettings, value: string]; result: void }
  'shortcut:register': { params: [accelerator: string]; result: boolean }
  'window:hide': { params: []; result: void }
}

// ── IPC Events (main pushes to renderer) ──

export interface IpcEvents {
  navigate: { params: [view: string] }
  'hotkey:triggered': { params: [text: string] }
  'settings:changed': { params: [settings: AppSettings] }
}

// ── Derived utility types ──

export type CommandChannel = keyof IpcCommands
export type EventChannel = keyof IpcEvents

export type CommandHandler<C extends CommandChannel> = (
  ...args: IpcCommands[C]['params']
) => IpcCommands[C]['result'] | Promise<IpcCommands[C]['result']>

// ── Allowed channel sets for runtime validation in preload ──

export const ALLOWED_COMMANDS: ReadonlySet<string> = new Set<CommandChannel>([
  'clipboard:read',
  'models:get',
  'settings:get',
  'settings:set',
  'shortcut:register',
  'window:hide'
])

export const ALLOWED_EVENTS: ReadonlySet<string> = new Set<EventChannel>([
  'hotkey:triggered',
  'navigate',
  'settings:changed'
])

// ── Typed renderer bridge (exposed via contextBridge) ──

export interface IpcRendererBridge {
  invoke<C extends CommandChannel>(
    channel: C,
    ...args: IpcCommands[C]['params']
  ): Promise<IpcCommands[C]['result']>

  on<E extends EventChannel>(
    channel: E,
    listener: (...args: IpcEvents[E]['params']) => void
  ): () => void
}

declare global {
  interface Window {
    api: IpcRendererBridge
  }
}
