import './SettingsView.css'
import { useEffect, useState } from 'react'
import type { AppSettings, ModelEntry, SubmitHotkey } from '../../../shared/ipc-contract'

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
  const [models, setModels] = useState<ModelEntry[]>([])

  useEffect(() => {
    window.api.invoke('models:get').then(setModels)
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

  const handleSaveApiKey = async () => {
    await onUpdate('geminiApiKey', apiKey)
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
  }

  const handleApplyHotkey = async () => {
    const success = await window.api.invoke('shortcut:register', hotkey)
    if (success) {
      await onUpdate('hotkey', hotkey)
      setHotkeyStatus('success')
    } else {
      setHotkeyStatus('error')
    }
    setTimeout(() => setHotkeyStatus('idle'), 3000)
  }

  return (
    <div className="settings">
      <section className="settings__header">
        <h2 className="settings__title">Settings</h2>
        <button onClick={onBack} className="settings__back-btn">
          ← Back
        </button>
      </section>

      <section className="settings__section">
        <h3 className="settings__section-title">Gemini API Key</h3>
        <p className="settings__description">To get your free API key:</p>
        <ol className="settings__instructions">
          <li>
            Go to{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio — API Keys
            </a>
          </li>
          <li>Click &ldquo;Create API key&rdquo; and copy it</li>
        </ol>

        <div className="settings__input-row">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            autoComplete="off"
          />
          <button onClick={handleSaveApiKey} className="settings__save-btn">
            {apiKeySaved ? '✓ Saved' : 'Save Key'}
          </button>
        </div>
      </section>

      <section className="settings__section">
        <h3 className="settings__section-title">Gemini Model</h3>
        <p className="settings__description">
          Choose which Gemini model to use for grammar checking.
        </p>
        <select
          className="settings__select"
          value={settings.geminiModel}
          onChange={(e) => onUpdate('geminiModel', e.target.value)}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </section>

      <section className="settings__section">
        <h3 className="settings__section-title">Global Hotkey</h3>
        <p className="settings__description">
          Press this from any app to open the window and paste your clipboard.
        </p>
        <div className="hotkey-recorder">
          <div className="hotkey-recorder__display">{hotkey}</div>
          <button
            onClick={() => setIsRecording((r) => !r)}
            className={`hotkey-recorder__btn ${isRecording ? 'hotkey-recorder__btn--recording' : ''}`}
          >
            {isRecording ? 'Press a key combination...' : 'Change Hotkey'}
          </button>
          {isRecording && (
            <button onClick={() => setIsRecording(false)} className="hotkey-recorder__cancel-btn">
              Cancel
            </button>
          )}
        </div>
        <div className="hotkey-recorder__actions">
          <button
            onClick={handleApplyHotkey}
            className="settings__apply-btn"
            disabled={hotkey === settings.hotkey}
          >
            Apply Hotkey
          </button>
          {hotkeyStatus === 'success' && (
            <span className="hotkey-recorder__status--success">Registered successfully.</span>
          )}
          {hotkeyStatus === 'error' && (
            <span className="hotkey-recorder__status--error">
              Failed — this combination may be taken by another app.
            </span>
          )}
        </div>
      </section>

      <section className="settings__section">
        <h3 className="settings__section-title">Submit Shortcut</h3>
        <p className="settings__description">
          Keyboard shortcut to submit text in the grammar check and follow-up fields.
        </p>
        <select
          className="settings__select"
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
