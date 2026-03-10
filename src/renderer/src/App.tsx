import { useState, useEffect } from 'react'
import { GrammarCheckView } from './views/GrammarCheckView'
import { SettingsView } from './views/SettingsView'
import { useSettings } from './hooks/useSettings'

type View = 'grammar' | 'settings'

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<View>('grammar')
  const { settings, loading, updateSetting } = useSettings()

  useEffect(() => {
    const unsubscribe = window.api.onNavigate((view) => {
      setCurrentView(view === 'settings' ? 'settings' : 'grammar')
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.api.hideWindow()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) return <div className="loading-state">Loading...</div>

  return (
    <div className="app">
      <nav className="app-nav">
        <button
          className={currentView === 'grammar' ? 'active' : ''}
          onClick={() => setCurrentView('grammar')}
        >
          Grammar Check
        </button>
        <div className="nav-spacer" />
        <button
          className={`nav-icon-btn ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
          title="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </nav>
      <main className="app-content">
        {currentView === 'grammar' ? (
          <GrammarCheckView settings={settings} />
        ) : (
          <SettingsView
            settings={settings}
            onUpdate={updateSetting}
            onBack={() => setCurrentView('grammar')}
          />
        )}
      </main>
    </div>
  )
}

export default App
