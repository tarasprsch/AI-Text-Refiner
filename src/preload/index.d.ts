import type { ElectronAPI } from '../renderer/src/types/api'

declare global {
  interface Window {
    api: ElectronAPI
  }
}
