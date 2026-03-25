import type { AppSettings } from '@shared/appSettings'
import type React from 'react'
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { ipcApi } from '../../api/ipcApi'
import { useTextRefinement } from './hooks/useTextRefinement'

export function useMainView(settings: AppSettings) {
  const [inputText, setInputText] = useState('')
  const [followUpText, setFollowUpText] = useState('')
  const [messageHistory, setMessageHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const session = useTextRefinement(settings)

  const sessionCheck = session.check
  const sessionFollowUp = session.followUp

  const onHotkeyTriggered = useEffectEvent((clipboardText: string) => {
    setInputText(clipboardText)
    setFollowUpText('')
    setMessageHistory([])
    setActiveTab('editor')
    session.reset()
    setTimeout(() => textareaRef.current?.focus(), 50)
  })

  useEffect(() => {
    const unsubscribe = ipcApi.onHotkeyTriggered(onHotkeyTriggered)
    return unsubscribe
  }, [])

  const hasApiKey = Boolean(settings.geminiApiKey)
  const isEnabled = !session.loading && !!inputText.trim() && hasApiKey

  const check = useCallback(async () => {
    setFollowUpText('')
    setMessageHistory([inputText])
    await sessionCheck(inputText)
  }, [inputText, sessionCheck])

  const followUp = useCallback(async () => {
    if (!followUpText.trim()) return
    const message = followUpText
    setFollowUpText('')
    setMessageHistory((prev) => [...prev, message])
    await sessionFollowUp(message)
  }, [followUpText, sessionFollowUp])

  const matchesSubmitHotkey = useCallback(
    (e: React.KeyboardEvent): boolean => {
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
    },
    [settings.submitHotkey]
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (matchesSubmitHotkey(e)) {
        e.preventDefault()
        if (isEnabled) check()
      }
    },
    [matchesSubmitHotkey, isEnabled, check]
  )

  const handleFollowUpKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (matchesSubmitHotkey(e)) {
        e.preventDefault()
        followUp()
      }
    },
    [matchesSubmitHotkey, followUp]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setInputText(e.target.value)

  const handleFollowUpChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setFollowUpText(e.target.value)

  const showEditorTab = () => setActiveTab('editor')
  const showHistoryTab = () => setActiveTab('history')

  return {
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
    showHistoryTab
  }
}
