import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const buildStamp =
    process.env.VITE_BUILD_STAMP ??
    (mode === 'production' ? `p${Date.now()}` : 'local')

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

