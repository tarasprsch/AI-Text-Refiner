import { readFileSync } from 'fs'
import { join } from 'path'
import type { BrowserWindow } from 'electron'
import { app, clipboard, ipcMain } from 'electron'
import type { CommandChannel, CommandHandler, ModelEntry } from '../shared/ipc-contract'
import type { SettingsStore } from './settings-store'
import type { WindowVisibilityManager } from './window-manager'
import { registerHotkey } from './shortcuts'

function handle<C extends CommandChannel>(channel: C, handler: CommandHandler<C>): void {
  ipcMain.handle(channel, (_event, ...args) => handler(...(args as Parameters<CommandHandler<C>>)))
}

function loadModels(): ModelEntry[] {
  const modelsPath = join(app.getAppPath(), 'geminiModels.json')
  return JSON.parse(readFileSync(modelsPath, 'utf-8'))
}

export function setupIpcHandlers(
  win: BrowserWindow,
  settings: SettingsStore,
  visibility: WindowVisibilityManager
): void {
  handle('clipboard:read', () => clipboard.readText())

  handle('models:get', () => loadModels())

  handle('settings:get', () => settings.getAll())

  handle('settings:set', (key, value) => {
    settings.set(key, value)
  })

  handle('shortcut:register', (accelerator) => {
    const success = registerHotkey(win, visibility, accelerator)
    if (success) {
      settings.set('hotkey', accelerator)
    }
    return success
  })

  handle('window:hide', () => visibility.hide())
}
