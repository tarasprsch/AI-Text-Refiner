import type { BrowserWindow } from 'electron'
import { clipboard, ipcMain } from 'electron'
import type Store from 'electron-store'
// import type { AppSettings } from 'src/renderer/src/types/api'
import { AppSettings } from '../renderer/src/types/api'
import { registerHotkey } from './shortcuts'

export function setupIpcHandlers(win: BrowserWindow, store: InstanceType<typeof Store>): void {
  ipcMain.handle('clipboard:read', async (): Promise<string> => {
    return clipboard.readText()
  })

  ipcMain.handle('settings:get', async (): Promise<AppSettings> => {
    return {
      geminiApiKey: store.get('geminiApiKey', '') as string,
      hotkey: store.get('hotkey', 'Ctrl+Shift+Space') as string,
      submitHotkey: store.get('submitHotkey', 'Ctrl+Enter') as AppSettings['submitHotkey'],
      geminiModel: store.get('geminiModel', 'gemini-3.1-flash-lite')
    }
  })

  ipcMain.handle(
    'settings:set',
    async (_event, key: keyof AppSettings, value: string): Promise<void> => {
      store.set(key, value)
    }
  )

  ipcMain.handle('shortcut:register', async (_event, accelerator: string): Promise<boolean> => {
    const success = registerHotkey(win, accelerator)
    if (success) {
      store.set('hotkey', accelerator)
    }
    return success
  })

  ipcMain.handle('window:hide', async (): Promise<void> => {
    win.hide()
  })
}
