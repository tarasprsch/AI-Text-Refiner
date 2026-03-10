import { useEffect, useState } from 'react'
import type { AppSettings, GeminiModel, SubmitHotkey } from '../types/api'

interface Props {
  settings: AppSettings
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  onBack: () => void
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta'])

export function SettingsView({ settings, onUpdate, onBack }: Props) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey)
  const [hotkey, setHotkey] = useState(settings.hotkey)
  const [isRecording, setIsRecording] = useState(false)
  const [hotkeyStatus, setHotkeyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [apiKeySaved, setApiKeySaved] = useState(false)

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

  const handleSaveApiKey = async () => {
    await onUpdate('geminiApiKey', apiKey)
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
  }

  const handleApplyHotkey = async () => {
    const success = await window.api.registerShortcut(hotkey)
    if (success) {
      await onUpdate('hotkey', hotkey)
      setHotkeyStatus('success')
    } else {
      setHotkeyStatus('error')
    }
    setTimeout(() => setHotkeyStatus('idle'), 3000)
  }

  return (
    <div className="settings-view">
      <section className="settings-header">
        <h2>Settings</h2>
        <button onClick={onBack} className="btn-back">
          ← Back
        </button>
      </section>

      <section className="settings-section">
        <h3>Gemini API Key</h3>
        <p className="settings-description">To get your free API key:</p>
        <ol className="settings-instructions">
          <li>
            Go to{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio — API Keys
            </a>
          </li>
          <li>Click &ldquo;Create API key&rdquo; and copy it</li>
        </ol>

        <div className="input-row">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            autoComplete="off"
          />
          <button onClick={handleSaveApiKey} className="btn-primary">
            {apiKeySaved ? '✓ Saved' : 'Save Key'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>Gemini Model</h3>
        <p className="settings-description">
          Choose which Gemini model to use for grammar checking.
        </p>
        <select
          className="select-input"
          value={settings.geminiModel}
          onChange={(e) => onUpdate('geminiModel', e.target.value as GeminiModel)}
        >
          <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (recommended)</option>
          <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
        </select>
      </section>

      <section className="settings-section">
        <h3>Global Hotkey</h3>
        <p className="settings-description">
          Press this from any app to open the window and paste your clipboard.
        </p>
        <div className="hotkey-recorder">
          <div className="hotkey-display">{hotkey}</div>
          <button
            onClick={() => setIsRecording((r) => !r)}
            className={`btn-record ${isRecording ? 'recording' : ''}`}
          >
            {isRecording ? 'Press a key combination...' : 'Change Hotkey'}
          </button>
          {isRecording && (
            <button onClick={() => setIsRecording(false)} className="btn-secondary">
              Cancel
            </button>
          )}
        </div>
        <div className="hotkey-actions">
          <button
            onClick={handleApplyHotkey}
            className="btn-primary"
            disabled={hotkey === settings.hotkey}
          >
            Apply Hotkey
          </button>
          {hotkeyStatus === 'success' && (
            <span className="status-success">Registered successfully.</span>
          )}
          {hotkeyStatus === 'error' && (
            <span className="status-error">
              Failed — this combination may be taken by another app.
            </span>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h3>Submit Shortcut</h3>
        <p className="settings-description">
          Keyboard shortcut to submit text in the grammar check and follow-up fields.
        </p>
        <select
          className="select-input"
          value={settings.submitHotkey}
          onChange={(e) => onUpdate('submitHotkey', e.target.value as SubmitHotkey)}
        >
          <option value="Ctrl+Enter">Ctrl + Enter</option>
          <option value="Ctrl+Shift+Enter">Ctrl + Shift + Enter</option>
          <option value="Enter">Enter</option>
        </select>
      </section>
    </div>
  )
}
