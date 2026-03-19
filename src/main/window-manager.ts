import type { BrowserWindow } from 'electron'

export interface WindowVisibilityManager {
  show(route?: string): void
  hide(): void
  toggle(): void
}

export function createWindowVisibilityManager(win: BrowserWindow): WindowVisibilityManager {
  function show(route?: string): void {
    if (!win.isVisible()) win.show()
    win.focus()
    win.setAlwaysOnTop(true)
    win.setAlwaysOnTop(false)
    if (route) {
      win.webContents.send('navigate', route)
    }
  }

  function hide(): void {
    if (win.isVisible()) win.hide()
  }

  function toggle(): void {
    if (win.isVisible()) {
      hide()
    } else {
      show()
    }
  }

  return { show, hide, toggle }
}
