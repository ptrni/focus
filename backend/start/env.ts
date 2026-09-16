import { Env } from '@adonisjs/core/env'
export default await Env.create(new URL('../', import.meta.url), {
  HOST: Env.schema.string.optional({ format: 'host' }), PORT: Env.schema.number.optional(),
  APP_KEY: Env.schema.string(), NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  DATABASE_URL: Env.schema.string.optional(),
  PG_HOST: Env.schema.string.optional(), PG_PORT: Env.schema.number.optional(), PG_USER: Env.schema.string.optional(),
  PG_PASSWORD: Env.schema.string.optional(), PG_DB_NAME: Env.schema.string.optional(), FRONTEND_ORIGIN: Env.schema.string(),
})
