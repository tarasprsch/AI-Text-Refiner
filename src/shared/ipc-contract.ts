import { AppSettings } from './appSettings'
import { ModelEntry } from './geminiModelsEntry'

// ── IPC Commands (renderer invokes, main handles) ──

export interface IpcCommands {
  'clipboard:read': { params: []; result: string }
  'models:get': { params: []; result: ModelEntry[] }
  'settings:get': { params: []; result: AppSettings }
  'settings:set': { params: [key: keyof AppSettings, value: string]; result: void }
  'shortcut:register': { params: [accelerator: string]; result: boolean }
  'window:hide': { params: []; result: void }
}

export type CommandChannel = keyof IpcCommands

export const ALLOWED_COMMANDS: ReadonlySet<string> = new Set<CommandChannel>([
  'clipboard:read',
  'models:get',
  'settings:get',
  'settings:set',
  'shortcut:register',
  'window:hide'
])

// ── IPC Events (main pushes to renderer) ──

export interface IpcEvents {
  navigate: { params: [view: string] }
  'hotkey:triggered': { params: [text: string] }
  'settings:changed': { params: [settings: AppSettings] }
}

export type EventChannel = keyof IpcEvents

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
