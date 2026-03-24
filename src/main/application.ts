import { app } from 'electron'
import { setupIpcHandlers } from './ipc-handlers'
import { MainWindow } from './utils/MainWindow'
import { SettingsStore } from './utils/SettingsStore'
import { setupShortcuts } from './utils/shortcuts'
import { setupTray } from './utils/tray'

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

let mainWindow: MainWindow | null = null

app.whenReady().then(() => {
  app.setAppUserModelId('com.aitextrefiner.app')

  mainWindow = new MainWindow()

  const settings = new SettingsStore()

  // Close hides to tray instead of quitting
  mainWindow.browserWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow!.hide()
  })

  // Hide on blur in packaged mode
  mainWindow.browserWindow.on('blur', () => {
    if (app.isPackaged) {
      mainWindow!.hide()
    }
  })

  // Push settings changes to renderer
  settings.onChange((s) => {
    mainWindow!.browserWindow.webContents.send('settings:changed', s)
  })

  setupTray(mainWindow)
  setupShortcuts(mainWindow, settings.getAll().hotkey)
  setupIpcHandlers(mainWindow, settings)
})

app.on('window-all-closed', () => {
  // Do not quit — app lives in the system tray
})

app.on('second-instance', () => {
  if (mainWindow) {
    mainWindow.show()
  }
})
