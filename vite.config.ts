import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function gitShortHead(): string | null {
  try {
    const out = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return out || null
  } catch {
    return null
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const buildStamp =
    process.env.VITE_BUILD_STAMP ??
    (mode === 'production'
      ? (() => {
          const g = gitShortHead()
          const t = Date.now()
          return g ? `${g}_${t}` : `p${t}`
        })()
      : 'local')

  return {
    plugins: [react()],
    define: {
      __OCTOBERLINE_BUILD_STAMP__: JSON.stringify(buildStamp),
    },
    server: {
      proxy: {
        '/neon_v1': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      }
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: 'index.html'
      }
    }
  }
})

