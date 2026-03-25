import { AppSettings } from '@shared/appSettings'
import { getHotkeyLabel, VALID_SUBMIT_HOTKEYS } from '@shared/hotkeys'
import './SettingsView.css'
import { useSettingsView } from './useSettingsView'

interface Props {
  settings: AppSettings
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  onBack: () => void
}

export function SettingsView({ settings, onUpdate, onBack }: Props) {
  const {
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
  } = useSettingsView({ settings, onUpdate })

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
            onChange={handleChangeApiKey}
            placeholder="AIza..."
            autoComplete="off"
          />
          <button onClick={saveApiKey} className="settings__save-btn">
            {apiKeySaved ? '✓ Saved' : 'Save Key'}
          </button>
        </div>
      </section>

      <section className="settings__section">
        <h3 className="settings__section-title">Gemini Model</h3>
        <p className="settings__description">
          Choose which Gemini model to use for grammar checking.
        </p>
        <select className="settings__select" value={settings.geminiModel} onChange={handleChangeModel}>
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
            onClick={toggleRecording}
            className={`hotkey-recorder__btn ${isRecording ? 'hotkey-recorder__btn--recording' : ''}`}
          >
            {isRecording ? 'Press a key combination...' : 'Change Hotkey'}
          </button>
          {isRecording && (
            <button onClick={cancelRecording} className="hotkey-recorder__cancel-btn">
              Cancel
            </button>
          )}
        </div>
        <div className="hotkey-recorder__actions">
          <button
            onClick={applyHotkey}
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
          onChange={handleChangeSubmitHotkey}
        >
          {[...VALID_SUBMIT_HOTKEYS].map((hotkey) => (
            <option key={hotkey} value={hotkey}>
              {getHotkeyLabel(hotkey)}
            </option>
          ))}
        </select>
      </section>
    </div>
  )
}
