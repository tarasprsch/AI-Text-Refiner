import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '../../../shared/ipc-contract'
import { SETTINGS_DEFAULTS } from '../../../shared/ipc-contract'
import { ipcApi } from '../api/ipcApi'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(SETTINGS_DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ipcApi.getSettings().then((s) => {
      setSettings(s)
      setLoading(false)
    })

    const unsubscribe = ipcApi.onSettingsChanged((s) => {
      setSettings(s)
    })
    return unsubscribe
  }, [])

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      await ipcApi.setSetting(key, value)
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  return { settings, loading, updateSetting }
}
