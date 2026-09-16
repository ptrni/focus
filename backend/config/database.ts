import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'
const databaseUrl = env.get('DATABASE_URL')
export default defineConfig({
  connection: 'pg', connections: { pg: {
    client: 'pg', connection: databaseUrl ? {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    } : {
      host: env.get('PG_HOST', '127.0.0.1'), port: env.get('PG_PORT', 5432),
      user: env.get('PG_USER', 'todo'), password: env.get('PG_PASSWORD'), database: env.get('PG_DB_NAME', 'todo'),
    },
    pool: { min: 0, max: 1, idleTimeoutMillis: 10000, acquireTimeoutMillis: 10000 },
    migrations: { naturalSort: true, paths: ['./database/migrations'], disableRollbacksInProduction: true },
    // Keep the existing hand-written model and schema during the framework upgrade.
    schemaGeneration: { enabled: false },
  } },
})
