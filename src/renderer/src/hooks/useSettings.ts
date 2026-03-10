import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../types/api'
import { DEFAULT_SETTINGS } from '../types/api'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      await window.api.setSetting(key, value)
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  return { settings, loading, updateSetting }
}
