import { AppSettings } from '@shared/appSettings'
import { useEffect, useRef, useState } from 'react'
import { ipcApi } from '../../api/ipcApi'
import { ResultPanel } from './components/ResultPanel'
import { useTextRefinement } from './hooks/useTextRefinement'
import './MainView.css'

interface Props {
  settings: AppSettings
}

export function MainView({ settings }: Props) {
  const [inputText, setInputText] = useState('')
  const [followUpText, setFollowUpText] = useState('')
  const [messageHistory, setMessageHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const session = useTextRefinement(settings)

  const sessionReset = session.reset

  useEffect(() => {
    const unsubscribe = ipcApi.onHotkeyTriggered((clipboardText) => {
      setInputText(clipboardText)
      setFollowUpText('')
      setMessageHistory([])
      setActiveTab('editor')
      sessionReset()
      setTimeout(() => textareaRef.current?.focus(), 50)
    })
    return unsubscribe
  }, [sessionReset])

  const hasApiKey = Boolean(settings.geminiApiKey)
  const isEnabled = !session.loading && !!inputText.trim() && hasApiKey

  const handleCheck = async () => {
    setFollowUpText('')
    setMessageHistory([inputText])
    await session.check(inputText)
  }

  const handleFollowUp = async () => {
    if (!followUpText.trim()) return
    const message = followUpText
    setFollowUpText('')
    setMessageHistory((prev) => [...prev, message])
    await session.followUp(message)
  }

  const matchesSubmitHotkey = (e: React.KeyboardEvent): boolean => {
    if (e.key !== 'Enter') return false

    switch (settings.submitHotkey) {
      case 'Ctrl+Enter':
        return (e.ctrlKey || e.metaKey) && !e.shiftKey
      case 'Ctrl+Shift+Enter':
        return (e.ctrlKey || e.metaKey) && e.shiftKey
      case 'Enter':
        return !e.ctrlKey && !e.metaKey && !e.shiftKey
      default:
        return false
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (matchesSubmitHotkey(e)) {
      e.preventDefault()
      if (isEnabled) handleCheck()
    }
  }

  const handleFollowUpKeyDown = (e: React.KeyboardEvent) => {
    if (matchesSubmitHotkey(e)) {
      e.preventDefault()
      handleFollowUp()
    }
  }

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
            onClick={() => setActiveTab('editor')}
          >
            Text to check
          </button>
          {messageHistory.length > 0 && (
            <button
              className={`tabs__btn${activeTab === 'history' ? ' tabs__btn--active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Conversation history ({messageHistory.length})
            </button>
          )}
        </div>

        {activeTab === 'editor' && (
          <div className="tabs__content">
            <textarea
              ref={textareaRef}
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={`Paste or type text here, or press your hotkey to auto-fill from clipboard. ${settings.submitHotkey} to check.`}
              rows={6}
              disabled={session.loading}
            />
            <button onClick={handleCheck} disabled={!isEnabled} className="main-view__check-btn">
              {session.loading && !session.result ? 'Checking...' : 'Check Grammar'}
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
      </section>

      {session.hasSession && session.result && (
        <section className="main-view__chat">
          <textarea
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            onKeyDown={handleFollowUpKeyDown}
            placeholder='Ask for changes... e.g. "Make it more formal" or "Shorter version"'
            rows={2}
            disabled={session.loading}
          />
          <button
            onClick={handleFollowUp}
            disabled={session.loading || !followUpText.trim()}
            className="main-view__send-btn"
          >
            {session.loading && session.result ? 'Sending...' : 'Send'}
          </button>
        </section>
      )}

      {session.loading && <div className="main-view__loading">Analysing with Gemini...</div>}

      {session.error && <div className="main-view__error">{session.error}</div>}

      {session.result && (
        <ResultPanel options={session.result.options} explanation={session.result.explanation} />
      )}
    </div>
  )
}
