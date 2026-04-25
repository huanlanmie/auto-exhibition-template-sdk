import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const libraryEntries = {
  'sdk/index': resolve(__dirname, 'src/sdk/index.ts'),
  'config/index': resolve(__dirname, 'src/config/index.ts'),
  'vite/index': resolve(__dirname, 'src/vite/index.ts'),
}

function isExternalDependency(id: string) {
  return id === 'vue' || id === 'vite' || id.startsWith('node:')
}

// dev 仍然使用 index.html 驱动的本地调试壳；
// build 则切到真正的库模式，把 SDK 的三个对外入口一起打到 dist。
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  build: command === 'build'
    ? {
        outDir: 'dist',
        lib: {
          entry: libraryEntries,
          formats: ['es'],
          fileName: (_format, entryName) => `${entryName}.js`,
        },
        rollupOptions: {
          external: isExternalDependency,
          output: {
            chunkFileNames: 'chunks/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash][extname]',
          },
        },
      }
    : undefined,
}))
