import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'
export default defineConfig({
  connection: 'pg', connections: { pg: {
    client: 'pg', connection: { host: env.get('PG_HOST'), port: env.get('PG_PORT'), user: env.get('PG_USER'), password: env.get('PG_PASSWORD'), database: env.get('PG_DB_NAME') },
    migrations: { naturalSort: true, paths: ['./database/migrations'], disableRollbacksInProduction: true },
    // Keep the existing hand-written model and schema during the framework upgrade.
    schemaGeneration: { enabled: false },
  } },
})
