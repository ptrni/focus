import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/core/encryption'
export default defineConfig({ default: 'app', list: { app: drivers.chacha20({ id: 'app', keys: [env.get('APP_KEY')] }) } })
