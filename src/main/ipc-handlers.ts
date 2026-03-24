import { app, clipboard, ipcMain } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { CommandChannel, CommandHandler, ModelEntry } from '../shared/ipc-contract'
import type { MainWindow } from './MainWindow'
import type { SettingsStore } from './utils/SettingsStore'
import { registerHotkey } from './utils/shortcuts'

export function setupIpcHandlers(mainWindow: MainWindow, settings: SettingsStore): void {
  handle('clipboard:read', () => clipboard.readText())

  handle('models:get', () => loadModels())

  handle('settings:get', () => settings.getAll())

  handle('settings:set', (key, value) => {
    settings.set(key, value)
  })

  handle('shortcut:register', (accelerator) => {
    const success = registerHotkey(mainWindow, accelerator)
    if (success) settings.set('hotkey', accelerator)

    return success
  })

  handle('window:hide', () => mainWindow.hide())
}

function handle<C extends CommandChannel>(channel: C, handler: CommandHandler<C>): void {
  ipcMain.handle(channel, (_event, ...args) => handler(...(args as Parameters<CommandHandler<C>>)))
}

function loadModels(): ModelEntry[] {
  const modelsPath = join(app.getAppPath(), 'geminiModels.json')
  return JSON.parse(readFileSync(modelsPath, 'utf-8'))
}
