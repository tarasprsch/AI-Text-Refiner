import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { setupIpcHandlers } from './ipc-handlers'
import { setupShortcuts } from './shortcuts'
import { setupTray } from './tray'

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

  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow!.hide()
  })

  mainWindow.on('blur', () => {
    if (app.isPackaged) {
      mainWindow!.hide()
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
  // Lazy-require electron-store after app is ready to avoid Electron 39 module init conflicts
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Store = require('electron-store')
  const store = new Store({
    defaults: {
      geminiApiKey: '',
      hotkey: 'Ctrl+Shift+Space',
      submitHotkey: 'Ctrl+Enter'
    }
  })

  app.setAppUserModelId('com.aitextrefiner.app')

  createWindow()
  setupTray(mainWindow!)
  setupShortcuts(mainWindow!, store.get('hotkey', 'Ctrl+Shift+Space') as string)
  setupIpcHandlers(mainWindow!, store)
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
