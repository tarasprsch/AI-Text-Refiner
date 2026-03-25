import type { AppSettings } from '@shared/appSettings'
import type { ModelEntry } from '@shared/geminiModelsEntry'
import type { SubmitHotkey } from '@shared/hotkeys'
import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { ipcApi } from '../../api/ipcApi'

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta'])

interface UseSettingsViewParams {
  settings: AppSettings
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
}

export function useSettingsView({ settings, onUpdate }: UseSettingsViewParams) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey)
  const [hotkey, setHotkey] = useState(settings.hotkey)
  const [isRecording, setIsRecording] = useState(false)
  const [hotkeyStatus, setHotkeyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [models, setModels] = useState<ModelEntry[]>([])

  useEffect(() => {
    ipcApi.getModels().then(setModels)
  }, [])

  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (MODIFIER_KEYS.has(e.key)) return

      const parts: string[] = []
      if (e.ctrlKey) parts.push('Ctrl')
      if (e.altKey) parts.push('Alt')
      if (e.shiftKey) parts.push('Shift')

      const keyMap: Record<string, string> = {
        ' ': 'Space',
        ArrowUp: 'Up',
        ArrowDown: 'Down',
        ArrowLeft: 'Left',
        ArrowRight: 'Right'
      }
      parts.push(keyMap[e.key] ?? e.key.toUpperCase())

      setHotkey(parts.join('+'))
      setIsRecording(false)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isRecording])

  const saveApiKey = async () => {
    await onUpdate('geminiApiKey', apiKey)
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
  }

  const applyHotkey = async () => {
    const success = await ipcApi.registerShortcut(hotkey)
    if (success) {
      await onUpdate('hotkey', hotkey)
      setHotkeyStatus('success')
    } else {
      setHotkeyStatus('error')
    }
    setTimeout(() => setHotkeyStatus('idle'), 3000)
  }

  const toggleRecording = () => setIsRecording((r) => !r)
  const cancelRecording = () => setIsRecording(false)

  const handleChangeApiKey = (e: ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)
  const handleChangeModel = (e: ChangeEvent<HTMLSelectElement>) => onUpdate('geminiModel', e.target.value)
  const handleChangeSubmitHotkey = (e: ChangeEvent<HTMLSelectElement>) =>
    onUpdate('submitHotkey', e.target.value as SubmitHotkey)

  return {
    apiKey,
    hotkey,
    isRecording,
    hotkeyStatus,
    apiKeySaved,
    models,
    handleChangeApiKey,
    saveApiKey,
    handleChangeModel,
    applyHotkey,
    handleChangeSubmitHotkey,
    toggleRecording,
    cancelRecording
  }
}
