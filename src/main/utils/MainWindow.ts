import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { ENV } from '../../shared/env'

export class MainWindow {
  readonly browserWindow: BrowserWindow

  constructor() {
    this.browserWindow = createBrowserWindow()
  }

  show(route?: string): void {
    if (!this.browserWindow.isVisible()) this.browserWindow.show()
    this.browserWindow.focus()
    this.browserWindow.setAlwaysOnTop(true)
    this.browserWindow.setAlwaysOnTop(false)
    if (route) {
      this.browserWindow.webContents.send('navigate', route)
    }
  }

  hide(): void {
    if (this.browserWindow.isVisible()) this.browserWindow.hide()
  }

  toggle(): void {
    if (this.browserWindow.isVisible()) {
      this.hide()
    } else {
      this.show()
    }
  }
}

function createBrowserWindow(): BrowserWindow {
  const win = new BrowserWindow({
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

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && ENV.rendererUrl) {
    win.loadURL(ENV.rendererUrl)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
