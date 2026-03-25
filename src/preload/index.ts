import type {
  CommandChannel,
  EventChannel,
  IpcEvents,
  IpcRendererBridge
} from '@shared/ipc-contract'
import { ALLOWED_EVENTS } from '@shared/ipc-contract'
import { contextBridge, ipcRenderer } from 'electron'

const ALLOWED_COMMANDS: ReadonlySet<string> = new Set<CommandChannel>([
  'clipboard:read',
  'models:get',
  'settings:get',
  'settings:set',
  'shortcut:register',
  'window:hide'
])

const api: IpcRendererBridge = {
  invoke(channel: CommandChannel, ...args: unknown[]) {
    if (!ALLOWED_COMMANDS.has(channel)) throw new Error(`Unknown IPC channel: ${channel}`)
    return ipcRenderer.invoke(channel, ...args)
  },

  on<E extends EventChannel>(channel: E, listener: (...args: IpcEvents[E]['params']) => void) {
    if (!ALLOWED_EVENTS.has(channel)) throw new Error(`Unknown IPC event: ${channel}`)
    const handler = (_event: Electron.IpcRendererEvent, ...args: IpcEvents[E]['params']): void =>
      listener(...args)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.api = api
}
