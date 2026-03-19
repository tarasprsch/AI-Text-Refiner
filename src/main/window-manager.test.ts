import { describe, it, expect, vi } from 'vitest'
import { createWindowVisibilityManager } from './window-manager'
import type { BrowserWindow } from 'electron'

function createFakeWindow(): BrowserWindow {
  let visible = false
  let alwaysOnTop = false
  const webContents = { send: vi.fn() }

  return {
    isVisible: () => visible,
    show: vi.fn(() => {
      visible = true
    }),
    hide: vi.fn(() => {
      visible = false
    }),
    focus: vi.fn(),
    setAlwaysOnTop: vi.fn((value: boolean) => {
      alwaysOnTop = value
    }),
    webContents
  } as unknown as BrowserWindow
}

describe('WindowVisibilityManager', () => {
  it('show() makes a hidden window visible and steals focus', () => {
    const win = createFakeWindow()
    const vm = createWindowVisibilityManager(win)

    vm.show()

    expect(win.show).toHaveBeenCalled()
    expect(win.focus).toHaveBeenCalled()
    expect(win.setAlwaysOnTop).toHaveBeenCalledWith(true)
    expect(win.setAlwaysOnTop).toHaveBeenCalledWith(false)
  })

  it('hide() hides a visible window', () => {
    const win = createFakeWindow()
    const vm = createWindowVisibilityManager(win)

    vm.show()
    vm.hide()

    expect(win.hide).toHaveBeenCalled()
  })

  it('hide() is a no-op when already hidden', () => {
    const win = createFakeWindow()
    const vm = createWindowVisibilityManager(win)

    vm.hide()

    expect(win.hide).not.toHaveBeenCalled()
  })

  it('toggle() shows a hidden window', () => {
    const win = createFakeWindow()
    const vm = createWindowVisibilityManager(win)

    vm.toggle()

    expect(win.show).toHaveBeenCalled()
    expect(win.focus).toHaveBeenCalled()
  })

  it('toggle() hides a visible window', () => {
    const win = createFakeWindow()
    const vm = createWindowVisibilityManager(win)

    vm.show()
    vi.mocked(win.hide).mockClear()
    vm.toggle()

    expect(win.hide).toHaveBeenCalled()
  })

  it('show(route) sends navigate event to renderer', () => {
    const win = createFakeWindow()
    const vm = createWindowVisibilityManager(win)

    vm.show('settings')

    expect(win.webContents.send).toHaveBeenCalledWith('navigate', 'settings')
  })

  it('show() without route does not send navigate event', () => {
    const win = createFakeWindow()
    const vm = createWindowVisibilityManager(win)

    vm.show()

    expect(win.webContents.send).not.toHaveBeenCalled()
  })
})
