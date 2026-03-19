import { useEffect, useRef, useState } from 'react'
import { ResultPanel } from '../components/ResultPanel'
import { useTextRefinement } from '../hooks/useTextRefinement'
import type { AppSettings } from '../../../shared/ipc-contract'

interface Props {
  settings: AppSettings
}

export function GrammarCheckView({ settings }: Props) {
  const [inputText, setInputText] = useState('')
  const [followUpText, setFollowUpText] = useState('')
  const [messageHistory, setMessageHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const session = useTextRefinement({
    apiKey: settings.geminiApiKey,
    model: settings.geminiModel
  })

  useEffect(() => {
    const unsubscribe = window.api.on('hotkey:triggered', (clipboardText) => {
      setInputText(clipboardText)
      setFollowUpText('')
      setMessageHistory([])
      setActiveTab('editor')
      session.reset()
      setTimeout(() => textareaRef.current?.focus(), 50)
    })
    return unsubscribe
  }, [session.reset])

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
    <div className="grammar-check-view">
      {!hasApiKey && (
        <div className="warning-banner">
          No API key configured. Go to Settings to add your Gemini API key.
        </div>
      )}

      <section className="tabbed-panel">
        <div className="tab-bar">
          <button
            className={`tab-btn${activeTab === 'editor' ? ' active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Text to check
          </button>
          {messageHistory.length > 0 && (
            <button
              className={`tab-btn${activeTab === 'history' ? ' active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Conversation history ({messageHistory.length})
            </button>
          )}
        </div>

        {activeTab === 'editor' && (
          <div className="tab-content">
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
            <button onClick={handleCheck} disabled={!isEnabled} className="btn-primary">
              {session.loading && !session.result ? 'Checking...' : 'Check Grammar'}
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            {messageHistory.length === 0 ? (
              <p className="tab-empty">No messages yet. Check some text to see history here.</p>
            ) : (
              <div className="conversation-list">
                {messageHistory.map((msg, i) => (
                  <div key={i} className={`conversation-msg ${i === 0 ? 'original' : 'followup'}`}>
                    <span className="conversation-label">
                      {i === 0 ? 'Original text' : `Follow-up #${i}`}
                    </span>
                    <p className="conversation-text">{msg}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {session.hasSession && session.result && (
        <section className="chat-input-section">
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
            className="btn-primary btn-send"
          >
            {session.loading && session.result ? 'Sending...' : 'Send'}
          </button>
        </section>
      )}

      {session.loading && <div className="loading-state">Analysing with Gemini...</div>}

      {session.error && <div className="error-panel">{session.error}</div>}

      {session.result && (
        <ResultPanel options={session.result.options} explanation={session.result.explanation} />
      )}
    </div>
  )
}
