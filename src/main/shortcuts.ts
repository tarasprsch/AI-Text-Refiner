import { globalShortcut, clipboard } from 'electron'
import type { BrowserWindow } from 'electron'
import type { WindowVisibilityManager } from './window-manager'

export function setupShortcuts(
  win: BrowserWindow,
  visibility: WindowVisibilityManager,
  hotkey: string
): void {
  registerHotkey(win, visibility, hotkey)
}

export function registerHotkey(
  win: BrowserWindow,
  visibility: WindowVisibilityManager,
  accelerator: string
): boolean {
  globalShortcut.unregisterAll()

  try {
    const success = globalShortcut.register(accelerator, () => {
      const clipboardText = clipboard.readText()
      visibility.show()
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
