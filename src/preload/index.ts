import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererBridge, CommandChannel, EventChannel } from '../shared/ipc-contract'
import { ALLOWED_COMMANDS, ALLOWED_EVENTS } from '../shared/ipc-contract'

const api: IpcRendererBridge = {
  invoke(channel: CommandChannel, ...args: unknown[]) {
    if (!ALLOWED_COMMANDS.has(channel)) {
      throw new Error(`Blocked IPC channel: ${channel}`)
    }
    return ipcRenderer.invoke(channel, ...args)
  },

  on(channel: EventChannel, listener: (...args: unknown[]) => void) {
    if (!ALLOWED_EVENTS.has(channel)) {
      throw new Error(`Blocked IPC event: ${channel}`)
    }
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void =>
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
  // @ts-ignore
  window.api = api
}
