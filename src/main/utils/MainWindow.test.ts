import { beforeEach, describe, expect, it, vi } from 'vitest'

let mockVisible = false
const mockWebContents = {
  send: vi.fn(),
  setWindowOpenHandler: vi.fn(),
  openDevTools: vi.fn()
}
const mockBrowserWindowInstance = {
  isVisible: () => mockVisible,
  show: vi.fn(() => (mockVisible = true)),
  hide: vi.fn(() => (mockVisible = false)),
  focus: vi.fn(),
  setAlwaysOnTop: vi.fn(),
  loadURL: vi.fn(),
  loadFile: vi.fn(),
  webContents: mockWebContents
}

class MockBrowserWindow {
  static calls: unknown[][] = []
  constructor(...args: unknown[]) {
    MockBrowserWindow.calls.push(args)
    return mockBrowserWindowInstance as unknown as MockBrowserWindow
  }

  static mockClear(): void {
    MockBrowserWindow.calls = []
  }
}

vi.mock('electron', () => ({
  app: { isPackaged: true },
  BrowserWindow: MockBrowserWindow,
  shell: { openExternal: vi.fn() }
}))

vi.mock(import('path'), async (original) => ({
  ...(await original()),
  join: (...args: string[]) => args.join('/')
}))

const { MainWindow } = await import('./MainWindow')

describe('MainWindow', () => {
  let mainWindow: InstanceType<typeof MainWindow>

  beforeEach(() => {
    vi.clearAllMocks()
    MockBrowserWindow.mockClear()
    mockVisible = false
    mainWindow = new MainWindow()
  })

  describe('constructor', () => {
    it('creates a BrowserWindow with correct options', () => {
      const opts = MockBrowserWindow.calls[0][0] as Record<string, unknown>
      expect(opts).toEqual(
        expect.objectContaining({
          width: 800,
          height: 800,
          show: false,
          skipTaskbar: true,
          autoHideMenuBar: true
        })
      )
    })

    it('sets up external link handler', () => {
      expect(mockWebContents.setWindowOpenHandler).toHaveBeenCalled()
    })

    it('loads file in packaged mode', () => {
      expect(mockBrowserWindowInstance.loadFile).toHaveBeenCalled()
    })
  })

  describe('show', () => {
    it('makes a hidden window visible and steals focus', () => {
      mainWindow.show()

      expect(mockBrowserWindowInstance.show).toHaveBeenCalled()
      expect(mockBrowserWindowInstance.focus).toHaveBeenCalled()
      expect(mockBrowserWindowInstance.setAlwaysOnTop).toHaveBeenCalledWith(true)
      expect(mockBrowserWindowInstance.setAlwaysOnTop).toHaveBeenCalledWith(false)
    })

    it('does not call show() again when already visible', () => {
      mockVisible = true

      mainWindow.show()

      expect(mockBrowserWindowInstance.show).not.toHaveBeenCalled()
      expect(mockBrowserWindowInstance.focus).toHaveBeenCalled()
    })

    it('sends navigate event when route is provided', () => {
      mainWindow.show('settings')

      expect(mockWebContents.send).toHaveBeenCalledWith('navigate', 'settings')
    })

    it('does not send navigate event without route', () => {
      mainWindow.show()

      expect(mockWebContents.send).not.toHaveBeenCalled()
    })
  })

  describe('hide', () => {
    it('hides a visible window', () => {
      mainWindow.show()
      mockBrowserWindowInstance.hide.mockClear()

      mainWindow.hide()

      expect(mockBrowserWindowInstance.hide).toHaveBeenCalled()
    })

    it('is a no-op when already hidden', () => {
      mainWindow.hide()

      expect(mockBrowserWindowInstance.hide).not.toHaveBeenCalled()
    })
  })

  describe('toggle', () => {
    it('shows a hidden window', () => {
      mainWindow.toggle()

      expect(mockBrowserWindowInstance.show).toHaveBeenCalled()
      expect(mockBrowserWindowInstance.focus).toHaveBeenCalled()
    })

    it('hides a visible window', () => {
      mainWindow.show()
      mockBrowserWindowInstance.hide.mockClear()

      mainWindow.toggle()

      expect(mockBrowserWindowInstance.hide).toHaveBeenCalled()
    })
  })

  describe('browserWindow', () => {
    it('exposes the underlying BrowserWindow instance', () => {
      expect(mainWindow.browserWindow).toBe(mockBrowserWindowInstance)
    })
  })
})
