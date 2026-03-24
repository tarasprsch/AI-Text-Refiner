import { clipboard, globalShortcut } from 'electron'
import type { MainWindow } from './MainWindow'

export function setupShortcuts(mainWindow: MainWindow, hotkey: string): void {
  registerHotkey(mainWindow, hotkey)
}

export function registerHotkey(mainWindow: MainWindow, accelerator: string): boolean {
  globalShortcut.unregisterAll()

  try {
    const success = globalShortcut.register(accelerator, () => {
      const clipboardText = clipboard.readText()
      mainWindow.show()
      setTimeout(() => {
        mainWindow.browserWindow.webContents.send('hotkey:triggered', clipboardText)
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
