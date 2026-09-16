import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'
export default defineConfig({
  connection: 'pg', connections: { pg: {
    client: 'pg', connection: env.get('DATABASE_URL') || {
      host: env.get('PG_HOST', '127.0.0.1'), port: env.get('PG_PORT', 5432),
      user: env.get('PG_USER', 'todo'), password: env.get('PG_PASSWORD'), database: env.get('PG_DB_NAME', 'todo'),
    },
    pool: { min: 0, max: 2, idleTimeoutMillis: 10000, acquireTimeoutMillis: 10000 },
    migrations: { naturalSort: true, paths: ['./database/migrations'], disableRollbacksInProduction: true },
    // Keep the existing hand-written model and schema during the framework upgrade.
    schemaGeneration: { enabled: false },
  } },
})
