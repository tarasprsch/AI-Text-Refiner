export type SubmitHotkey = 'Ctrl+Enter' | 'Ctrl+Shift+Enter' | 'Enter'

export const VALID_SUBMIT_HOTKEYS: ReadonlySet<SubmitHotkey> = new Set<SubmitHotkey>([
  'Ctrl+Enter',
  'Ctrl+Shift+Enter',
  'Enter'
])

export const SUBMIT_HOTKEY_OPTIONS: ReadonlyArray<{
  value: SubmitHotkey
  label: string
}> = [
  { value: 'Ctrl+Enter', label: 'Ctrl + Enter' },
  { value: 'Ctrl+Shift+Enter', label: 'Ctrl + Shift + Enter' },
  { value: 'Enter', label: 'Enter' }
]
