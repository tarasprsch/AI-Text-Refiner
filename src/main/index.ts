import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { setupIpcHandlers } from './ipc-handlers'
import { setupShortcuts } from './shortcuts'
import { setupTray } from './tray'
import { createWindowVisibilityManager } from './window-manager'
import { createSettingsStore, ElectronStorageBackend } from './settings-store'

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    show: false,
    skipTaskbar: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.aitextrefiner.app')

  createWindow()

  const settings = createSettingsStore(new ElectronStorageBackend())
  const visibility = createWindowVisibilityManager(mainWindow!)

  // Close hides to tray instead of quitting
  mainWindow!.on('close', (event) => {
    event.preventDefault()
    visibility.hide()
  })

  // Hide on blur in packaged mode
  mainWindow!.on('blur', () => {
    if (app.isPackaged) {
      visibility.hide()
    }
  })

  // Push settings changes to renderer
  settings.onChange((s) => {
    mainWindow!.webContents.send('settings:changed', s)
  })

  setupTray(visibility)
  setupShortcuts(mainWindow!, visibility, settings.getAll().hotkey)
  setupIpcHandlers(mainWindow!, settings, visibility)
})

app.on('window-all-closed', () => {
  // Do not quit — app lives in the system tray
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show()
    mainWindow.focus()
  }
})
