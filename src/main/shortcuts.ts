import { globalShortcut, clipboard } from 'electron'
import type { BrowserWindow } from 'electron'
import { showAndFocusWindow } from './tray'

export function setupShortcuts(win: BrowserWindow, hotkey: string): void {
  registerHotkey(win, hotkey)
}

export function registerHotkey(win: BrowserWindow, accelerator: string): boolean {
  globalShortcut.unregisterAll()

  try {
    const success = globalShortcut.register(accelerator, () => {
      const clipboardText = clipboard.readText()
      showAndFocusWindow(win)
      setTimeout(() => {
        win.webContents.send('hotkey:triggered', clipboardText)
      }, 100)
    })

    if (!success) {
      console.error(`Failed to register shortcut: ${accelerator}`)
    }
    return success
  } catch (error) {
    console.error('Error registering shortcut:', error)
    return false
  }
}
