import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'
import type { WindowVisibilityManager } from './window-manager'

let tray: Tray | null = null

export function setupTray(visibility: WindowVisibilityManager): void {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked/resources/icon.png')
    : join(__dirname, '../../resources/icon.png')

  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('AI Text Refiner')
  tray.setContextMenu(buildContextMenu(visibility))

  tray.on('click', () => {
    visibility.toggle()
  })

  tray.on('right-click', () => {
    tray!.setContextMenu(buildContextMenu(visibility))
    tray!.popUpContextMenu()
  })
}

function buildContextMenu(visibility: WindowVisibilityManager): Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => visibility.show()
    },
    {
      label: 'Settings',
      click: () => visibility.show('settings')
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
