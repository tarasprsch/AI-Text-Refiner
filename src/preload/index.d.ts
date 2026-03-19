import type { IpcRendererBridge } from '../shared/ipc-contract'

declare global {
  interface Window {
    api: IpcRendererBridge
  }
}
