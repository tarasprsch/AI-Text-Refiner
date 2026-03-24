import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'
import { resolve } from 'path'
import checker from 'vite-plugin-checker'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    root: resolve('src/renderer'),
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    plugins: [
      react(),
      checker({
        typescript: {
          tsconfigPath: 'tsconfig.json',
          buildMode: true
        }
      })
    ]
  }
})
