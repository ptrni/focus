import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build' && process.env.VERCEL === '1') {
    let apiUrl: URL
    try {
      apiUrl = new URL(env.VITE_API_URL || '')
    } catch {
      throw new Error('Set VITE_API_URL in Vercel to your deployed backend HTTPS URL including /api, then redeploy. The backend must be deployed separately.')
    }
    if (apiUrl.protocol !== 'https:' || /^(localhost|127\..*|\[::1\]|0\.0\.0\.0)$/.test(apiUrl.hostname) || apiUrl.hostname.endsWith('.localhost')) {
      throw new Error('VITE_API_URL must point to a deployed HTTPS backend, not localhost. Set FRONTEND_ORIGIN on the backend to your frontend origin.')
    }
  }
  return { plugins: [react()], server: { port: 5173, strictPort: true } }
})
