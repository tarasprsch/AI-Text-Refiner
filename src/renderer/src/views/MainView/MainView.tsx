import { AppSettings } from '@shared/appSettings'
import { ResultPanel } from './components/ResultPanel'
import './MainView.css'
import { useMainView } from './useMainView'

interface Props {
  settings: AppSettings
}

export function MainView({ settings }: Props) {
  const {
    inputText,
    followUpText,
    messageHistory,
    activeTab,
    textareaRef,
    session,
    hasApiKey,
    isEnabled,
    check,
    followUp,
    handleInputKeyDown,
    handleFollowUpKeyDown,
    handleInputChange,
    handleFollowUpChange,
    showEditorTab,
    showFollowUpTab,
    showHistoryTab
  } = useMainView(settings)

  return (
    <div className="main-view">
      {!hasApiKey && (
        <div className="main-view__warning">
          No API key configured. Go to Settings to add your Gemini API key.
        </div>
      )}

      <section className="tabs">
        <div className="tabs__bar">
          <button
            className={`tabs__btn${activeTab === 'editor' ? ' tabs__btn--active' : ''}`}
            onClick={showEditorTab}
          >
            Text to check
          </button>
          {session.hasSession && session.result && (
            <button
              className={`tabs__btn${activeTab === 'followup' ? ' tabs__btn--active' : ''}`}
              onClick={showFollowUpTab}
            >
              Ask for changes
            </button>
          )}
          {messageHistory.length > 0 && (
            <button
              className={`tabs__btn tabs__btn--right${activeTab === 'history' ? ' tabs__btn--active' : ''}`}
              onClick={showHistoryTab}
            >
              History ({messageHistory.length})
            </button>
          )}
        </div>

        {activeTab === 'editor' && (
          <div className="tabs__content">
            <textarea
              ref={textareaRef}
              id="input-text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={`Paste or type text here, or press your hotkey to auto-fill from clipboard. ${settings.submitHotkey} to check.`}
              rows={6}
              disabled={session.loading}
            />
            <button onClick={check} disabled={!isEnabled} className="main-view__check-btn">
              {session.loading && !session.result ? 'Checking...' : 'Check'}
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tabs__content">
            {messageHistory.length === 0 ? (
              <p className="tabs__empty">No messages yet. Check some text to see history here.</p>
            ) : (
              <div className="conversation">
                {messageHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`conversation__message ${i === 0 ? 'conversation__message--original' : 'conversation__message--followup'}`}
                  >
                    <span className="conversation__label">
                      {i === 0 ? 'Original text' : `Follow-up #${i}`}
                    </span>
                    <p className="conversation__text">{msg}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'followup' && (
          <div className="tabs__content">
            <textarea
              value={followUpText}
              onChange={handleFollowUpChange}
              onKeyDown={handleFollowUpKeyDown}
              placeholder='Ask for changes... e.g. "Make it more formal" or "Shorter version"'
              rows={2}
              disabled={session.loading}
            />
            <button
              onClick={followUp}
              disabled={session.loading || !followUpText.trim()}
              className="main-view__send-btn"
            >
              {session.loading && session.result ? 'Sending...' : 'Send'}
            </button>
          </div>
        )}
      </section>

      {session.loading && <div className="main-view__loading">Analysing with Gemini...</div>}

      {session.error && <div className="main-view__error">{session.error}</div>}

      {session.result && (
        <ResultPanel options={session.result.options} explanation={session.result.explanation} />
      )}
    </div>
  )
}
