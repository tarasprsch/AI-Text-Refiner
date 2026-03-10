import { Tray, Menu, nativeImage, app } from 'electron'
import type { BrowserWindow } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function setupTray(win: BrowserWindow): void {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked/resources/icon.png')
    : join(__dirname, '../../resources/icon.png')

  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('AI Text Refiner')
  tray.setContextMenu(buildContextMenu(win))

  tray.on('click', () => {
    if (win.isVisible()) {
      win.hide()
    } else {
      showAndFocusWindow(win)
    }
  })

  tray.on('right-click', () => {
    tray!.setContextMenu(buildContextMenu(win))
    tray!.popUpContextMenu()
  })
}

function buildContextMenu(win: BrowserWindow): Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => showAndFocusWindow(win)
    },
    {
      label: 'Settings',
      click: () => {
        showAndFocusWindow(win)
        win.webContents.send('navigate', 'settings')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        win.removeAllListeners('close')
        app.quit()
      }
    }
  ])
}

export function showAndFocusWindow(win: BrowserWindow): void {
  if (!win.isVisible()) win.show()
  win.focus()
  win.setAlwaysOnTop(true)
  win.setAlwaysOnTop(false)
}
