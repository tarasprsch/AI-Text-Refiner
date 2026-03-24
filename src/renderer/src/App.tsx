import { useEffect, useState } from 'react'
import { ipcApi } from './api/ipcApi'
import './App.css'
import { IconSettings } from './components/IconSettings'
import { useSettings } from './hooks/useSettings'
import { MainView } from './views/MainView'
import { SettingsView } from './views/SettingsView'

type View = 'main' | 'settings'

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<View>('main')
  const { settings, loading, updateSetting } = useSettings()

  useEffect(() => {
    const unsubscribe = ipcApi.onNavigate((view) => {
      setCurrentView(view === 'settings' ? 'settings' : 'main')
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void ipcApi.hideWindow()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) return <div className="app__loading">Loading...</div>

  return (
    <div className="app">
      <nav className="app__nav">
        <button
          className={`app__nav-btn ${currentView === 'main' ? 'app__nav-btn--active' : ''}`}
          onClick={() => setCurrentView('main')}
        >
          Text Check
        </button>
        <div className="app__nav-spacer" />
        <button
          className={`app__nav-icon ${currentView === 'settings' ? 'app__nav-icon--active' : ''}`}
          onClick={() => setCurrentView('settings')}
          title="Settings"
        >
          <IconSettings />
        </button>
      </nav>
      <main className="app__content">
        {currentView === 'main' ? (
          <MainView settings={settings} />
        ) : (
          <SettingsView
            settings={settings}
            onUpdate={updateSetting}
            onBack={() => setCurrentView('main')}
          />
        )}
      </main>
    </div>
  )
}

export default App
