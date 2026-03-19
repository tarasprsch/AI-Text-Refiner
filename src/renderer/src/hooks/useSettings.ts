import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../../../shared/ipc-contract'
import { SETTINGS_DEFAULTS } from '../../../shared/ipc-contract'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(SETTINGS_DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.invoke('settings:get').then((s) => {
      setSettings(s)
      setLoading(false)
    })

    const unsubscribe = window.api.on('settings:changed', (s) => {
      setSettings(s)
    })
    return unsubscribe
  }, [])

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      await window.api.invoke('settings:set', key, value as string)
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  return { settings, loading, updateSetting }
}
