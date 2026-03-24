import { app, Menu, nativeImage, Tray } from 'electron'
import { join } from 'path'
import type { MainWindow } from './MainWindow'

let tray: Tray | null = null

export function setupTray(mainWindow: MainWindow): void {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked/resources/icon.png')
    : join(__dirname, '../../resources/icon.png')

  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('AI Text Refiner')
  tray.setContextMenu(buildContextMenu(mainWindow))

  tray.on('click', () => {
    mainWindow.toggle()
  })

  tray.on('right-click', () => {
    tray!.setContextMenu(buildContextMenu(mainWindow))
    tray!.popUpContextMenu()
  })
}

function buildContextMenu(mainWindow: MainWindow): Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => mainWindow.show()
    },
    {
      label: 'Settings',
      click: () => mainWindow.show('settings')
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])
}
