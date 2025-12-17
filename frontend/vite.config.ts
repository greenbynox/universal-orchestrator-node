import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',  // Important for Electron - use relative paths
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://${String(process.env.VITE_BACKEND_HOST || '127.0.0.1')}:${Number(process.env.VITE_BACKEND_PORT || process.env.PORT || 3001)}`,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            const code = (err as any)?.code;
            if (code === 'ECONNRESET' || code === 'ECONNABORTED' || code === 'EPIPE') return;
            // eslint-disable-next-line no-console
            console.error('[vite-proxy][/api] error:', err);
          });
        },
      },
      '/socket.io': {
        target: `http://${String(process.env.VITE_BACKEND_HOST || '127.0.0.1')}:${Number(process.env.VITE_BACKEND_PORT || process.env.PORT || 3001)}`,
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            const code = (err as any)?.code;
            // Common when backend restarts/reloads in dev; don't spam the console.
            if (code === 'ECONNRESET' || code === 'ECONNABORTED' || code === 'EPIPE') return;
            // eslint-disable-next-line no-console
            console.error('[vite-proxy][/socket.io] error:', err);
          });
        },
      },
    },
  },
})
