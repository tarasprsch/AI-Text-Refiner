import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../renderer/src/types/api'

const api: ElectronAPI = {
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),

  getSettings: () => ipcRenderer.invoke('settings:get'),

  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  registerShortcut: (accelerator) => ipcRenderer.invoke('shortcut:register', accelerator),

  hideWindow: () => ipcRenderer.invoke('window:hide'),

  onHotkeyTriggered: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, text: string): void => callback(text)
    ipcRenderer.on('hotkey:triggered', handler)
    return () => ipcRenderer.removeListener('hotkey:triggered', handler)
  },

  onNavigate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, view: string): void => callback(view)
    ipcRenderer.on('navigate', handler)
    return () => ipcRenderer.removeListener('navigate', handler)
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
