export type SubmitHotkey = 'Ctrl+Enter' | 'Ctrl+Shift+Enter' | 'Enter'

export const VALID_SUBMIT_HOTKEYS: ReadonlySet<SubmitHotkey> = new Set<SubmitHotkey>([
  'Ctrl+Enter',
  'Ctrl+Shift+Enter',
  'Enter'
])

export const getHotkeyLabel = (hotkey: SubmitHotkey): string => hotkey.replace(/\+/g, ' + ')
