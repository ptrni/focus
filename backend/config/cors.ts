import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'
export default defineConfig({ enabled: true, origin: [env.get('FRONTEND_ORIGIN')], methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], headers: ['Content-Type', 'Accept'], exposeHeaders: [], credentials: false, maxAge: 90 })
