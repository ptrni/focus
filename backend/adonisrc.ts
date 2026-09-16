import { defineConfig } from '@adonisjs/core/app'
import { indexEntities } from '@adonisjs/core'
export default defineConfig({
  commands: [() => import('@adonisjs/core/commands'), () => import('@adonisjs/lucid/commands')],
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/repl_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/cors/cors_provider'),
  ],
  preloads: [() => import('#start/routes'), () => import('#start/kernel')],
  hooks: { init: [indexEntities()] },
})
